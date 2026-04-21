import type { VercelRequest, VercelResponse } from '@vercel/node';
import { syncHubspotToWix, NormalizedContact } from '../_lib/sync/hubspotToWixService.js';
import { getDb } from '../_lib/firebase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { userId, contact } = req.body;
  if (!userId || !contact || !contact.id) {
    return res.status(400).json({ success: false, error: 'Missing userId or invalid contact payload' });
  }

  try {
    const normalizedContact: NormalizedContact = {
      id: contact.id.toString(),
      email: contact.email || '',
      firstname: contact.firstname || contact.firstName || '',
      lastname: contact.lastname || contact.lastName || '',
      phone: contact.phone || ''
    };

    const result = await syncHubspotToWix(userId, normalizedContact);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[API] Sync Error (HubSpot -> Wix):', error.response?.data || error.message);
    
    const db = getDb();
    const cleanMessage = error.response?.data?.message || error.message;
    
    try {
      await db.collection('sync_logs').add({
        userId,
        timestamp: new Date().toISOString(),
        operationType: 'sync',
        source: 'hubspot',
        status: 'error',
        message: `Failed to sync: ${cleanMessage}`,
        wixContactId: null,
        hubspotContactId: contact.id || null,
      });
    } catch (logErr) {
      console.error('Failed to log error to sync_logs', logErr);
    } // Prevent log failure from crashing

    return res.status(500).json({ success: false, error: cleanMessage });
  }
}
