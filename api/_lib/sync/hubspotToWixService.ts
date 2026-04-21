import axios from 'axios';
import { getDb } from '../firebase.js';
import { getContactMapping, upsertContactMapping } from './contactMapping.js';

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
 */
export async function syncHubspotToWix(userId: string, contact: NormalizedContact) {
  const db = getDb();

  // 1. Get user's Wix Token
  const wixConn = await db.collection('wix_connections').doc(userId).get();
  if (!wixConn.exists) throw new Error('Wix not connected for this user');
  const { access_token } = wixConn.data()!;

  // 2. Fetch Mapping logically
  const mapping = await getContactMapping(userId, contact.email);
  
  if (mapping && Date.now() - mapping.lastHubSpotUpdate < 60000) {
    console.log(`[Service] Loop prevention active: Skipped HubSpot contact ${contact.id}`);
    return { success: true, message: 'Skipped to prevent loop' };
  }

  // 3. Dispatch to Wix Contacts v4 API
  let wixContactId = mapping?.wixContactId;

  // We use the upsert endpoint on Wix which uses the email standard if ID is omitted
  // But if we know the wixContactId natively from our mapping, we can patch.
  // Actually, Wix v4 upsert takes the email and merges.
  const response = await axios.post('https://www.wixapis.com/contacts/v4/contacts/upsert', {
    contactInfo: {
      name: { first: contact.firstname, last: contact.lastname },
      emails: [{ email: contact.email }],
      phones: contact.phone ? [{ phone: contact.phone }] : []
    }
  }, {
    headers: { 
      'Authorization': access_token,
      'Content-Type': 'application/json'
    }
  });

  wixContactId = response.data.contact?.id;

  if (!wixContactId) {
    // If upsert fails or doesn't return the ID, throw error
    throw new Error('Wix API did not resolve a valid contact ID in the response body');
  }

  // 4. Set state to prevent bounce loop
  await upsertContactMapping(userId, contact.email, {
    wixContactId,
    hubspotContactId: contact.id,
    source: 'hubspot'
  });

  // 5. Append clean generic audit trail (No PII)
  await logSync(userId, 'hubspot', 'success', 'Successfully synchronized contact from HubSpot to Wix', wixContactId, contact.id);
  
  return { success: true, message: 'Contact synced to Wix securely' };
}
