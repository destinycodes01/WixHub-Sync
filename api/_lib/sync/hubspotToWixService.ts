import axios from 'axios';
import { getDb } from '../firebase.js';

export interface NormalizedContact {
  id: string; // HubSpot Contact ID
  email: string;
  firstname: string;
  lastname: string;
  phone?: string;
}

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

/**
 * Reusable Core Service for Syncing HubSpot records to Wix.
 * This cleanly encapsulates API routing vs native business logic execution.
 */
export async function syncHubspotToWix(userId: string, contact: NormalizedContact) {
  const db = getDb();

  // 1. Get user's Wix Token
  const wixConn = await db.collection('wix_connections').doc(userId).get();
  if (!wixConn.exists) throw new Error('Wix not connected for this user');
  const { access_token } = wixConn.data()!;

  // 2. Exact Match ID Tracking (Anti-Looping)
  const syncId = `hs_${contact.id}`;
  const mappingRef = db.collection('contact_mappings').doc(syncId);
  const mapping = await mappingRef.get();
  
  if (mapping.exists && Date.now() - mapping.data()!.lastSyncedAt < 60000) {
    console.log(`[Service] Loop prevention active: Skipped HubSpot contact ${contact.id}`);
    return { success: true, message: 'Skipped to prevent loop' };
  }

  // 3. Dispatch to Wix Contacts v4 API
  const response = await axios.post('https://www.wixapis.com/contacts/v4/contacts', {
    info: {
      name: { first: contact.firstname, last: contact.lastname },
      emails: [{ email: contact.email }],
      phones: [{ phone: contact.phone }]
    }
  }, {
    headers: { 
      'Authorization': access_token,
      'Content-Type': 'application/json'
    }
  });

  const wixContactId = response.data.contact?.id;
  if (!wixContactId) {
    throw new Error('Wix API did not resolve a valid contact ID in the response body');
  }

  // 4. Set state to prevent bounce loop
  await mappingRef.set({
    wixContactId,
    hubspotContactId: contact.id,
    lastSyncedAt: Date.now(),
    source: 'hubspot',
    syncId
  });

  // 5. Append clean generic audit trail (No PII)
  await logSync(userId, 'hubspot', 'success', 'Successfully synchronized contact from HubSpot to Wix', wixContactId, contact.id);
  
  return { success: true, message: 'Contact synced to Wix securely' };
}
