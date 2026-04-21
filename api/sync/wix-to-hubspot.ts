import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { getDb } from '../_lib/firebase.js';
import { getContactMapping, upsertContactMapping } from '../_lib/sync/contactMapping.js';

async function logSync(userId: string, source: 'wix' | 'hubspot', status: 'success' | 'error', message: string, wixContactId?: string, hubspotContactId?: string) {
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
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const userId = (req.query.userId as string) || req.body.userId;
  const payload = req.body;

  if (!userId || !payload) {
    return res.status(400).json({ success: false, error: 'Missing userId or payload' });
  }

  const dataNode = payload.data || payload.contact || payload;
  const email = dataNode.email || dataNode.emails?.[0]?.email || payload.email || '';
  const firstname = dataNode.firstName || dataNode.first_name || dataNode.name?.first || payload.firstName || '';
  const lastname = dataNode.lastName || dataNode.last_name || dataNode.name?.last || payload.lastName || '';
  const phone = dataNode.phone || dataNode.phones?.[0]?.phone || payload.phone || '';
  const contactId = dataNode.contactId || dataNode.id || payload.contactId || payload.id;

  if (!email) {
    return res.status(200).json({ success: true, message: 'Skipped - no email' });
  }
  
  if (!contactId) {
    return res.status(400).json({ success: false, error: 'Wix contactId is required' });
  }

  const normalizedContact = { email, firstname, lastname, phone };

  try {
    const db = getDb();
    
    const hsConn = await db.collection('hubspot_connections').doc(userId).get();
    if (!hsConn.exists) throw new Error('HubSpot not connected');
    const { access_token } = hsConn.data()!;

    // 1. Fetch Mapping logically
    const mapping = await getContactMapping(userId, normalizedContact.email);
    
    // Prevent short-circuit bounce loops
    if (mapping && Date.now() - mapping.lastWixUpdate < 60000) {
      return res.status(200).json({ success: true, message: 'Skipped to prevent loop' });
    }

    const hsContact = {
      properties: {
        email: normalizedContact.email,
        firstname: normalizedContact.firstname,
        lastname: normalizedContact.lastname,
        phone: normalizedContact.phone,
      }
    };

    let hubspotContactId = mapping?.hubspotContactId;
    let finalAccessToken = access_token;
    
    const executeHubSpotSync = async (token: string, existingId: string | null | undefined): Promise<string> => {
      if (existingId) {
        // UPDATE existing HubSpot contact
        await axios.patch(`https://api.hubapi.com/crm/v3/objects/contacts/${existingId}`, hsContact, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return existingId;
      } else {
        // CREATE new HubSpot contact
        try {
          const response = await axios.post('https://api.hubapi.com/crm/v3/objects/contacts', hsContact, {
            headers: { Authorization: `Bearer ${token}` }
          });
          return response.data.id;
        } catch (hubspotErr: any) {
          // Fallback: If creation 409s because of a contact not in our DB, harvest ID and patch
          if (hubspotErr.response?.status === 409) {
            const match = hubspotErr.response.data?.message?.match(/Existing ID: ([0-9]+)/);
            if (match && match[1]) {
              const matchedId = match[1];
              await axios.patch(`https://api.hubapi.com/crm/v3/objects/contacts/${matchedId}`, hsContact, {
                headers: { Authorization: `Bearer ${token}` }
              });
              return matchedId;
            }
          }
          throw hubspotErr;
        }
      }
    };

    try {
      hubspotContactId = await executeHubSpotSync(finalAccessToken, hubspotContactId);
      await logSync(userId, 'wix', 'success', `Synced contact ${normalizedContact.email} to HubSpot`, contactId, hubspotContactId);
    } catch (hubspotError: any) {
      if (hubspotError.response?.status === 401 && hsConn.data()!.refresh_token) {
        // Handle Token Refresh flow
        const formData = new URLSearchParams();
        formData.append('grant_type', 'refresh_token');
        formData.append('client_id', process.env.HUBSPOT_CLIENT_ID || '');
        formData.append('client_secret', process.env.HUBSPOT_CLIENT_SECRET || '');
        formData.append('refresh_token', hsConn.data()!.refresh_token);

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
        await logSync(userId, 'wix', 'success', `Synced contact ${normalizedContact.email} to HubSpot (after token refresh)`, contactId, hubspotContactId);
      } else {
        throw hubspotError;
      }
    }

    // 2. Save Mapping securely
    await upsertContactMapping(userId, normalizedContact.email, {
      wixContactId: contactId,
      hubspotContactId,
      source: 'wix'
    });

    return res.status(200).json({ success: true, message: 'Contact synced to HubSpot' });
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message;
    await logSync(userId, 'wix', 'error', `Failed to sync: ${errorMessage}`, contactId);
    return res.status(500).json({ success: false, error: errorMessage });
  }
}
