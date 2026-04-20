import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { getDb } from '../_lib/firebase.js';

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

  // userId can be passed via query string (?userId=xyz) from Wix Automations, or in body from our Test button
  const userId = (req.query.userId as string) || req.body.userId;
  const payload = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, error: 'Missing userId in query or body' });
  }

  if (!payload) {
    return res.status(400).json({ success: false, error: 'Missing webhook payload' });
  }

  // 1. Log the incoming payload structure for debugging
  console.log(`[Wix Webhook] Incoming payload for user ${userId}:`, JSON.stringify(payload, null, 2));

  // 2. Extract relevant fields safely (handles Test Sync and common Wix Automations formats)
  const dataNode = payload.data || payload.contact || payload;
  
  const email = dataNode.email || dataNode.emails?.[0]?.email || payload.email || '';
  const firstname = dataNode.firstName || dataNode.first_name || dataNode.name?.first || payload.firstName || '';
  const lastname = dataNode.lastName || dataNode.last_name || dataNode.name?.last || payload.lastName || '';
  const phone = dataNode.phone || dataNode.phones?.[0]?.phone || payload.phone || '';
  const contactId = dataNode.contactId || dataNode.id || payload.contactId || payload.id || `wix_unknown_${Date.now()}`;

  // 3. Skip if no email is found
  if (!email) {
    console.log('[Wix Webhook] Skipped: No email found in payload');
    // Optionally log this skip to sync_logs
    await logSync(userId, 'wix', 'error', 'Skipped Wix contact sync: No email provided in webhook', contactId);
    return res.status(200).json({ success: true, message: 'Skipped - no email' }); // Return 200 so Wix doesn't retry infinitely
  }

  const normalizedContact = {
    email,
    firstname,
    lastname,
    phone
  };

  console.log('[Wix Webhook] Normalized Contact:', normalizedContact);

  try {
    const db = getDb();
    
    // 4. Get HubSpot Token
    const hsConn = await db.collection('hubspot_connections').doc(userId).get();
    if (!hsConn.exists) throw new Error('HubSpot not connected');
    const { access_token } = hsConn.data()!;

    // 5. Build HubSpot payload
    const hsContact = {
      properties: {
        email: normalizedContact.email,
        firstname: normalizedContact.firstname,
        lastname: normalizedContact.lastname,
        phone: normalizedContact.phone,
      }
    };

    // 6. Prevent Loop using Contact ID mapping
    const syncId = `wix_${contactId}`;
    const mappingRef = db.collection('contact_mappings').doc(syncId);
    const mapping = await mappingRef.get();
    if (mapping.exists && Date.now() - mapping.data()!.lastSyncedAt < 60000) {
      console.log(`[Wix Webhook] Skipped: Loop prevention active for contact ${contactId}`);
      return res.status(200).json({ success: true, message: 'Skipped to prevent loop' });
    }

    // 7. Send to HubSpot
    let hubspotContactId;
    let finalAccessToken = access_token;
    
    try {
      const response = await axios.post('https://api.hubapi.com/crm/v3/objects/contacts', hsContact, {
        headers: { Authorization: `Bearer ${finalAccessToken}` }
      });
      hubspotContactId = response.data.id;
      console.log(`[HubSpot Sync] Successfully created contact ${hubspotContactId}`);
      await logSync(userId, 'wix', 'success', `Synced contact ${normalizedContact.email} to HubSpot`, contactId, hubspotContactId);
      
    } catch (hubspotError: any) {
      // Handle the 401 Unauthorized token expiration
      if (hubspotError.response?.status === 401 && hsConn.data()!.refresh_token) {
        console.log(`[HubSpot Sync] Token expired for user ${userId}. Attempting refresh...`);
        
        try {
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

          // Update DB with fresh tokens
          await db.collection('hubspot_connections').doc(userId).update({
            access_token: finalAccessToken,
            refresh_token: new_refresh_token,
            updatedAt: new Date().toISOString() // Using simple Date string here inside Firebase Admin
          });

          console.log(`[HubSpot Sync] Token refreshed successfully. Retrying request...`);

          // Retry the HubSpot request
          const retryResponse = await axios.post('https://api.hubapi.com/crm/v3/objects/contacts', hsContact, {
            headers: { Authorization: `Bearer ${finalAccessToken}` }
          });
          
          hubspotContactId = retryResponse.data.id;
          console.log(`[HubSpot Sync] Successfully created contact ${hubspotContactId} after refresh`);
          await logSync(userId, 'wix', 'success', `Synced contact ${normalizedContact.email} to HubSpot (after token refresh)`, contactId, hubspotContactId);
        } catch (refreshError: any) {
          console.error(`[HubSpot Sync] Token refresh completely failed:`, refreshError.response?.data || refreshError.message);
          throw new Error('HubSpot credentials expired and automatic refresh failed. Please reconnect HubSpot.');
        }

      } else if (hubspotError.response?.status === 409) {
        // Handle Duplicate Contact
        console.log(`[HubSpot Sync] Duplicate contact ignored: ${normalizedContact.email}`);
        await logSync(userId, 'wix', 'success', `Duplicate contact ${normalizedContact.email} ignored/needs update`, contactId);
        return res.status(200).json({ success: true, message: 'Duplicate ignored' });
      } else {
        throw hubspotError; // Re-throw other errors to be caught by the outer catch
      }
    }

    // 8. Save Mapping for future loop prevention / updates
    await mappingRef.set({
      wixContactId: contactId,
      hubspotContactId: hubspotContactId || null,
      lastSyncedAt: Date.now(),
      source: 'wix',
      syncId
    });

    res.status(200).json({ success: true, message: 'Contact synced to HubSpot' });
  } catch (error: any) {
    console.error('Sync Error (Wix -> HubSpot):', error.response?.data || error.message);
    const errorMessage = error.response?.data?.message || error.message;
    await logSync(userId, 'wix', 'error', `Failed to sync: ${errorMessage}`, contactId);
    
    // Return 200 so Wix Automations doesn't repeatedly retry failing webhooks unless it's a critical server issue
    // Alternatively return 500 if you want Wix to retry. We'll return 500 for actual unhandled throws.
    res.status(500).json({ success: false, error: errorMessage });
  }
}
