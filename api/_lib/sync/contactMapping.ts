import { getDb } from '../firebase.js';

export interface ContactMapping {
  userId: string;
  email: string;
  wixContactId: string | null;
  hubspotContactId: string | null;
  lastSource: 'wix' | 'hubspot';
  lastUpdatedAt: number;
}

export async function getMappingByEmail(userId: string, email: string): Promise<{ id: string, data: ContactMapping } | null> {
  if (!email) return null;
  const db = getDb();
  const snap = await db.collection('contact_mappings')
    .where('userId', '==', userId)
    .where('email', '==', email.toLowerCase().trim())
    .limit(1)
    .get();
  
  if (snap.empty) return null;
  return { id: snap.docs[0].id, data: snap.docs[0].data() as ContactMapping };
}

export async function getMappingByWixId(userId: string, wixContactId: string): Promise<{ id: string, data: ContactMapping } | null> {
  if (!wixContactId) return null;
  const db = getDb();
  const snap = await db.collection('contact_mappings')
    .where('userId', '==', userId)
    .where('wixContactId', '==', wixContactId)
    .limit(1)
    .get();

  if (snap.empty) return null;
  return { id: snap.docs[0].id, data: snap.docs[0].data() as ContactMapping };
}

export async function getMappingByHubspotId(userId: string, hubspotContactId: string): Promise<{ id: string, data: ContactMapping } | null> {
  if (!hubspotContactId) return null;
  const db = getDb();
  const snap = await db.collection('contact_mappings')
    .where('userId', '==', userId)
    .where('hubspotContactId', '==', hubspotContactId)
    .limit(1)
    .get();

  if (snap.empty) return null;
  return { id: snap.docs[0].id, data: snap.docs[0].data() as ContactMapping };
}

export async function upsertContactMapping(userId: string, details: {
  email?: string;
  wixContactId?: string;
  hubspotContactId?: string;
  source: 'wix' | 'hubspot';
}) {
  const db = getDb();
  let existingDocId: string | null = null;
  let m = null;

  // Attempt resolution cascades matching existing documents
  if (details.wixContactId) m = await getMappingByWixId(userId, details.wixContactId);
  if (!m && details.hubspotContactId) m = await getMappingByHubspotId(userId, details.hubspotContactId);
  if (!m && details.email) m = await getMappingByEmail(userId, details.email);

  if (m) existingDocId = m.id;

  const mappingRef = existingDocId 
    ? db.collection('contact_mappings').doc(existingDocId) 
    : db.collection('contact_mappings').doc(); // Auto-ID if none exists

  const updatePayload: Partial<ContactMapping> = {
    userId,
    lastSource: details.source,
    lastUpdatedAt: Date.now()
  };

  if (details.email) updatePayload.email = details.email.toLowerCase().trim();
  if (details.wixContactId) updatePayload.wixContactId = details.wixContactId;
  if (details.hubspotContactId) updatePayload.hubspotContactId = details.hubspotContactId;

  await mappingRef.set(updatePayload, { merge: true });
}