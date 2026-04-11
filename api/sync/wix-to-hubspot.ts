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

  const { userId, contact } = req.body;
  if (!userId || !contact) return res.status(400).send('Missing userId or contact');

  try {
    const db = getDb();
    // 1. Get HubSpot Token
    const hsConn = await db.collection('hubspot_connections').doc(userId).get();
    if (!hsConn.exists) throw new Error('HubSpot not connected');
    const { access_token } = hsConn.data()!;

    // 2. Map Fields (Basic mapping for now, can be expanded via users/{userId}/mappings)
    const hsContact = {
      properties: {
        email: contact.email,
        firstname: contact.firstName,
        lastname: contact.lastName,
        phone: contact.phone,
      }
    };

    // 3. Prevent Loop
    const syncId = `wix_${contact.id}`;
    const mappingRef = db.collection('contact_mappings').doc(syncId);
    const mapping = await mappingRef.get();
    if (mapping.exists && Date.now() - mapping.data()!.lastSyncedAt < 60000) {
      return res.json({ success: true, message: 'Skipped to prevent loop' });
    }

    // 4. Send to HubSpot
    const response = await axios.post('https://api.hubapi.com/crm/v3/objects/contacts', hsContact, {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const hubspotContactId = response.data.id;

    // 5. Save Mapping
    await mappingRef.set({
      wixContactId: contact.id,
      hubspotContactId,
      lastSyncedAt: Date.now(),
      source: 'wix',
      syncId
    });

    await logSync(userId, 'wix', 'success', `Synced contact ${contact.email} to HubSpot`, contact.id, hubspotContactId);
    res.json({ success: true, message: 'Contact synced to HubSpot' });
  } catch (error: any) {
    console.error('Sync Error (Wix -> HubSpot):', error.response?.data || error.message);
    await logSync(userId, 'wix', 'error', `Failed to sync: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}
