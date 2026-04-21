import crypto from 'crypto';
import { getDb, firebaseAdmin } from '../firebase.js';

export interface ContactMapping {
  userId: string;
  email: string;
  wixContactId: string | null;
  hubspotContactId: string | null;
  lastWixUpdate: number;
  lastHubSpotUpdate: number;
}

export function getMappingId(userId: string, email: string) {
  const normalizedEmail = email.toLowerCase().trim();
  return crypto.createHash('md5').update(`${userId}_${normalizedEmail}`).digest('hex');
}

export async function getContactMapping(userId: string, email: string): Promise<ContactMapping | null> {
  if (!email) return null;
  const db = getDb();
  const mappingRef = db.collection('contact_mappings').doc(getMappingId(userId, email));
  const snap = await mappingRef.get();
  if (!snap.exists) return null;
  return snap.data() as ContactMapping;
}

export async function upsertContactMapping(userId: string, email: string, updates: { 
  wixContactId?: string; 
  hubspotContactId?: string;
  source: 'wix' | 'hubspot';
}) {
  const db = getDb();
  const mappingId = getMappingId(userId, email);
  const mappingRef = db.collection('contact_mappings').doc(mappingId);

  const now = Date.now();
  const updatePayload: any = {
    userId,
    email: email.toLowerCase().trim()
  };

  if (updates.wixContactId) updatePayload.wixContactId = updates.wixContactId;
  if (updates.hubspotContactId) updatePayload.hubspotContactId = updates.hubspotContactId;
  
  if (updates.source === 'wix') {
    updatePayload.lastWixUpdate = now;
    // Set to 0 if doesn't exist so we have a number
    updatePayload.lastHubSpotUpdate = firebaseAdmin.firestore.FieldValue.increment(0) as any;
  } else {
    updatePayload.lastHubSpotUpdate = now;
    updatePayload.lastWixUpdate = firebaseAdmin.firestore.FieldValue.increment(0) as any;
  }

  await mappingRef.set(updatePayload, { merge: true });
}
