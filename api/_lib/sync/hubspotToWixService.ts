import axios from 'axios';
import { getDb } from '../firebase.js';
import { getMappingByEmail, getMappingByHubspotId, upsertContactMapping } from './contactMapping.js';

export interface NormalizedContact {
  id: string; // HubSpot Contact ID
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
 * Reusable Core Service for Syncing HubSpot records to Wix.
 */
export async function syncHubspotToWix(userId: string, contact: NormalizedContact) {
  const db = getDb();

  // 1. Get user's Wix Token
  const wixConn = await db.collection('wix_connections').doc(userId).get();
  if (!wixConn.exists) throw new Error('Wix not connected for this user');
  const { access_token } = wixConn.data()!;

  // 2. Fetch Mapping logically via HS ID fallback to matching Email
  let mapping = await getMappingByHubspotId(userId, contact.id);
  if (!mapping && contact.email) {
    mapping = await getMappingByEmail(userId, contact.email);
  }

  const resolvedEmail = contact.email || (mapping ? mapping.data.email : '');

  // Edge case: No Email on incoming payload and no mapping found -> skip sync completely
  if (!resolvedEmail) {
    return { success: true, message: 'Skipped - no email and no mapping found' };
  }
  
  if (mapping && mapping.data.lastSource === 'hubspot' && Date.now() - mapping.data.lastUpdatedAt < 5000) {
    console.log(`[Service] Loop prevention active: Skipped HubSpot contact ${contact.id}`);
    return { success: true, message: 'Skipped to prevent loop' };
  }

  // 3. Dispatch to Wix Contacts v4 API
  let wixContactId = mapping?.data.wixContactId;

  // We use the upsert endpoint on Wix which merges on email matching
  const executeWixSync = async () => {
    return withRetry(async () => {
      const response = await axios.post('https://www.wixapis.com/contacts/v4/contacts/upsert', {
        contactInfo: {
          name: { first: contact.firstname, last: contact.lastname },
          emails: [{ email: resolvedEmail }],
          phones: contact.phone ? [{ phone: contact.phone }] : []
        }
      }, {
        headers: { 
          'Authorization': access_token,
          'Content-Type': 'application/json'
        }
      });
      return response.data.contact?.id;
    });
  };

  wixContactId = await executeWixSync();

  if (!wixContactId) {
    throw new Error('Wix API did not resolve a valid contact ID in the response body');
  }

  // 4. Set state to prevent bounce loop
  await upsertContactMapping(userId, {
    email: resolvedEmail,
    wixContactId,
    hubspotContactId: contact.id,
    source: 'hubspot'
  });

  // 5. Append clean generic audit trail (No PII)
  await logSync(userId, 'hubspot', 'success', `Successfully synchronized contact ${resolvedEmail} from HubSpot to Wix`, wixContactId, contact.id);
  
  return { success: true, message: 'Contact synced to Wix securely' };
}
