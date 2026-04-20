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
    // 1. Get Wix Token
    const wixConn = await db.collection('wix_connections').doc(userId).get();
    if (!wixConn.exists) throw new Error('Wix not connected');
    const { access_token } = wixConn.data()!;

    // 2. Prevent Loop
    const syncId = `hs_${contact.id}`;
    const mappingRef = db.collection('contact_mappings').doc(syncId);
    const mapping = await mappingRef.get();
    if (mapping.exists && Date.now() - mapping.data()!.lastSyncedAt < 60000) {
      return res.json({ success: true, message: 'Skipped to prevent loop' });
    }

    // 3. Send to Wix
    const response = await axios.post('https://www.wixapis.com/contacts/v4/contacts', {
      info: {
        name: { first: contact.firstname, last: contact.lastname },
        emails: [{ email: contact.email }],
        phones: [{ phone: contact.phone }]
      }
    }, {
      headers: { 
        'Authorization': access_token, // It's a Wix Headless token
        'Content-Type': 'application/json'
      }
    });
    
    const wixContactId = response.data.contact.id;

    // 4. Save Mapping
    await mappingRef.set({
      wixContactId,
      hubspotContactId: contact.id,
      lastSyncedAt: Date.now(),
      source: 'hubspot',
      syncId
    });

    await logSync(userId, 'hubspot', 'success', `Synced contact ${contact.email} to Wix`, wixContactId, contact.id);
    res.json({ success: true, message: 'Contact synced to Wix' });
  } catch (error: any) {
    console.error('Sync Error (HubSpot -> Wix):', error.response?.data || error.message);
    await logSync(userId, 'hubspot', 'error', `Failed to sync: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}
