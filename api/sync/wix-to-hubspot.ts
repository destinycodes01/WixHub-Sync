import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { getDb } from '../_lib/firebase.js';
import { getMappingByEmail, getMappingByWixId, upsertContactMapping } from '../_lib/sync/contactMapping.js';

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
    // Only retry on network errors, 5xx server errors, or 429 rate limits
    const status = error?.response?.status;
    const shouldRetry = !status || status >= 500 || status === 429;
    
    if (retries <= 1 || !shouldRetry) throw error;
    await new Promise(res => setTimeout(res, delayMs));
    return withRetry(fn, retries - 1, delayMs);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const userId = (req.query.userId as string) || req.body.userId;
    const payload = req.body;

    if (!userId || !payload) {
      return res.status(400).json({ success: false, error: 'Missing userId or payload' });
    }

    const dataNode = payload.data || payload.contact || payload;
    const incomingEmail = dataNode.email || dataNode.emails?.[0]?.email || payload.email || '';
    const firstname = dataNode.firstName || dataNode.first_name || dataNode.name?.first || payload.firstName || '';
    const lastname = dataNode.lastName || dataNode.last_name || dataNode.name?.last || payload.lastName || '';
    const phone = dataNode.phone || dataNode.phones?.[0]?.phone || payload.phone || '';
    const contactId = dataNode.contactId || dataNode.id || payload.contactId || payload.id;

    if (!contactId) {
      return res.status(400).json({ success: false, error: 'Wix contactId is required' });
    }

    const db = getDb();
    
    const hsConn = await db.collection('hubspot_connections').doc(userId).get();
    if (!hsConn.exists) {
      return res.status(400).json({ success: false, error: 'HubSpot not connected' });
    }
    const { access_token } = hsConn.data()!;

    // 1. Fetch Mapping logically matching by ID, fallback to Email
    let mapping = await getMappingByWixId(userId, contactId);
    if (!mapping && incomingEmail) {
      mapping = await getMappingByEmail(userId, incomingEmail);
    }

    const resolvedEmail = incomingEmail || (mapping ? mapping.data.email : '');

    // Edge case: No Email on incoming payload and no mapping found -> skip sync completely
    if (!resolvedEmail) {
      return res.status(200).json({ success: true, message: 'Skipped - no email and no mapping found' });
    }

    // 2. Prevent short-circuit bounce loops
    if (mapping && mapping.data.lastSource === 'wix' && (Date.now() - mapping.data.lastUpdatedAt < 5000)) {
      return res.status(200).json({ success: true, message: 'Skipped to prevent loop' });
    }

    const hsContactPayload = {
      properties: {
        email: resolvedEmail,
        firstname,
        lastname,
        phone,
      }
    };

    let hubspotContactId = mapping?.data.hubspotContactId;
    let finalAccessToken = access_token;
    
    // Abstracted HubSpot Execution Engine wrapped with localized logic
    const executeHubSpotSync = async (token: string, existingId: string | null | undefined): Promise<string> => {
      return withRetry(async () => {
        if (existingId) {
          // UPDATE existing HubSpot contact
          await axios.patch(`https://api.hubapi.com/crm/v3/objects/contacts/${existingId}`, hsContactPayload, {
            headers: { Authorization: `Bearer ${token}` }
          });
          return existingId;
        } else {
          // CREATE new HubSpot contact
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
      await logSync(userId, 'wix', 'success', `Synced contact ${resolvedEmail} to HubSpot`, contactId, hubspotContactId);
    } catch (hubspotError: any) {
      if (hubspotError.response?.status === 401 && hsConn.data()!.refresh_token) {
        // Handle Token Refresh flow
        const formData = new URLSearchParams();
        formData.append('grant_type', 'refresh_token');
        formData.append('client_id', process.env.HUBSPOT_CLIENT_ID || '');
        formData.append('client_secret', process.env.HUBSPOT_CLIENT_SECRET || '');
        formData.append('refresh_token', hsConn.data()!.refresh_token);

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
          await logSync(userId, 'wix', 'success', `Synced contact ${resolvedEmail} to HubSpot (after token refresh)`, contactId, hubspotContactId);
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
      wixContactId: contactId,
      hubspotContactId,
      source: 'wix'
    });

    return res.status(200).json({ success: true, message: 'Contact synced to HubSpot' });
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Unknown Server Error';
    console.error('[API] Wix -> HubSpot Sync Error:', errorMessage);
    
    const userId = (req.query.userId as string) || req.body?.userId;
    const contactId = req.body?.data?.contactId || req.body?.id;
    
    if (userId) {
      await logSync(userId, 'wix', 'error', `Failed to sync: ${errorMessage}`, contactId);
    }
    
    return res.status(500).json({ success: false, error: errorMessage });
  }
}
