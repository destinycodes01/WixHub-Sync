import axios from 'axios';
import { getDb } from '../firebase.js';
import { getMappingByEmail, getMappingByWixId, upsertContactMapping } from './contactMapping.js';

export interface WixNormalizedContact {
  contactId: string;
  email: string;
  firstname: string;
  lastname: string;
  phone?: string;
}

async function logSync(userId: string, source: 'wix' | 'hubspot', status: 'success' | 'error', message: string, wixContactId?: string, hubspotContactId?: string) {
  try {
    const db = getDb();
    await db.collection('sync_logs').add({
      userId,
      timestamp: new Date().toISOString(),
      operationType: 'sync',
      source,
      status,
      message,
      wixContactId: wixContactId || null,
      hubspotContactId: hubspotContactId || null,
    });
  } catch (err) {
    console.error('Failed to write to sync_logs', err);
  }
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 300): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const status = error?.response?.status;
    const shouldRetry = !status || status >= 500 || status === 429;
    
    if (retries <= 1 || !shouldRetry) throw error;
    await new Promise(res => setTimeout(res, delayMs));
    return withRetry(fn, retries - 1, delayMs);
  }
}

/**
 * Reusable Core Service for Syncing Wix records to HubSpot.
 */
export async function syncWixToHubspot(userId: string, contact: WixNormalizedContact) {
  if (!contact.contactId) {
    throw new Error('Wix contactId is required');
  }

  const db = getDb();
  
  const hsConn = await db.collection('hubspot_connections').doc(userId).get();
  if (!hsConn.exists) {
    throw new Error('HubSpot not connected');
  }
  const { access_token, refresh_token } = hsConn.data()!;

  // 1. Fetch Mapping logically matching by ID, fallback to Email
  let mapping = await getMappingByWixId(userId, contact.contactId);
  if (!mapping && contact.email) {
    mapping = await getMappingByEmail(userId, contact.email);
  }

  const resolvedEmail = contact.email || (mapping ? mapping.data.email : '');

  // Edge case: No Email on incoming payload and no mapping found -> skip sync completely
  if (!resolvedEmail) {
    return { success: true, message: 'Skipped - no email and no mapping found' };
  }

  // 2. Prevent short-circuit bounce loops
  if (mapping && mapping.data.lastSource === 'wix' && (Date.now() - mapping.data.lastUpdatedAt < 5000)) {
    return { success: true, message: 'Skipped to prevent loop' };
  }

  const hsContactPayload = {
    properties: {
      email: resolvedEmail,
      firstname: contact.firstname,
      lastname: contact.lastname,
      phone: contact.phone || '',
    }
  };

  let hubspotContactId = mapping?.data.hubspotContactId;
  let finalAccessToken = access_token;
  
  // Abstracted HubSpot Execution Engine wrapped with localized logic
  const executeHubSpotSync = async (token: string, existingId: string | null | undefined): Promise<string> => {
    return withRetry(async () => {
      if (existingId) {
        await axios.patch(`https://api.hubapi.com/crm/v3/objects/contacts/${existingId}`, hsContactPayload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return existingId;
      } else {
        try {
          const response = await axios.post('https://api.hubapi.com/crm/v3/objects/contacts', hsContactPayload, {
            headers: { Authorization: `Bearer ${token}` }
          });
          return response.data.id;
        } catch (hubspotErr: any) {
          // Fallback: If creation 409s because of a contact not in our DB, harvest ID and patch
          if (hubspotErr.response?.status === 409) {
            const match = hubspotErr.response.data?.message?.match(/Existing ID: ([0-9]+)/);
            if (match && match[1]) {
              const matchedId = match[1];
              await axios.patch(`https://api.hubapi.com/crm/v3/objects/contacts/${matchedId}`, hsContactPayload, {
                headers: { Authorization: `Bearer ${token}` }
              });
              return matchedId;
            }
          }
          throw hubspotErr;
        }
      }
    });
  };

  try {
    hubspotContactId = await executeHubSpotSync(finalAccessToken, hubspotContactId);
    await logSync(userId, 'wix', 'success', `Synced contact ${resolvedEmail} to HubSpot`, contact.contactId, hubspotContactId);
  } catch (hubspotError: any) {
    if (hubspotError.response?.status === 401 && refresh_token) {
      // Handle Token Refresh flow
      const formData = new URLSearchParams();
      formData.append('grant_type', 'refresh_token');
      formData.append('client_id', process.env.HUBSPOT_CLIENT_ID || '');
      formData.append('client_secret', process.env.HUBSPOT_CLIENT_SECRET || '');
      formData.append('refresh_token', refresh_token);

      try {
        const refreshRes = await axios.post('https://api.hubapi.com/oauth/v3/token', formData.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        finalAccessToken = refreshRes.data.access_token;
        const new_refresh_token = refreshRes.data.refresh_token;

        await db.collection('hubspot_connections').doc(userId).update({
          access_token: finalAccessToken,
          refresh_token: new_refresh_token,
          updatedAt: new Date().toISOString()
        });

        // Retry the sync execution
        hubspotContactId = await executeHubSpotSync(finalAccessToken, hubspotContactId);
        await logSync(userId, 'wix', 'success', `Synced contact ${resolvedEmail} to HubSpot (after token refresh)`, contact.contactId, hubspotContactId);
      } catch (refreshErr: any) {
        throw new Error('HubSpot credentials expired and automatic refresh failed. Please reconnect.');
      }
    } else {
      throw hubspotError;
    }
  }

  // 3. Save Mapping securely via cascade resolution and email replacement tracking
  await upsertContactMapping(userId, {
    email: resolvedEmail, // Updates dynamically if it changes
    wixContactId: contact.contactId,
    hubspotContactId,
    source: 'wix'
  });

  return { success: true, message: 'Contact synced to HubSpot' };
}
