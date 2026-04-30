import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { getDb, firebaseAdmin } from '../_lib/firebase.js';
import { syncHubspotToWix, NormalizedContact } from '../_lib/sync/hubspotToWixService.js';
import { verifyHubSpotSignature, getRawBody } from '../_lib/security/hubspotSignature.js';

// Explicitly disable Vercel body parsing so we can compute the raw hash signature
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    // 1. Extract raw body and headers for verification
    const rawBody = await getRawBody(req);
    const signatureHeader = req.headers['x-hubspot-signature-v3'];
    const timestampHeader = req.headers['x-hubspot-request-timestamp'];
    
    // Fallback: Default to a public URL structure, but recommend setting HUBSPOT_WEBHOOK_TARGET_URI
    const host = req.headers['host'] || 'wixhubsync.vercel.app';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const fullUri = process.env.HUBSPOT_WEBHOOK_TARGET_URI || `${protocol}://${host}${req.url}`;
    
    const secret = process.env.HUBSPOT_CLIENT_SECRET;

    // 2. Validate V3 Signature Security
    if (!verifyHubSpotSignature(rawBody, signatureHeader, timestampHeader, secret, req.method, fullUri)) {
      console.error('[HubSpot Webhook] Failed signature validation.');
      return res.status(401).send('Unauthorized signature');
    }

    // 3. Immediately Return 200 to prevent HubSpot timeout & retry
    res.status(200).send('OK');

    // Parse the payload safely
    let events: any[];
    try {
      events = JSON.parse(rawBody);
      if (!Array.isArray(events) || events.length === 0) return;
    } catch {
      return; // Stop if invalid JSON
    }

    // 4. Detach process
    processEvents(events).catch((err) => {
      console.error('[HubSpot Webhook] Fatal background processing error:', err.message);
    });

  } catch (error: any) {
    console.error('[HubSpot Webhook] Critical wrapper error:', error.message);
    if (!res.headersSent) {
      res.status(500).send('Internal Server Error');
    }
  }
}

async function processEvents(events: any[]) {
  const db = getDb();
  
  // 5. Explicit Event-by-Event Deduplication
  const validEvents = [];
  for (const event of events) {
    const eventId = event.eventId?.toString();
    if (!eventId) continue;

    const processedRef = db.collection('processed_events').doc(eventId);
    const docSnap = await processedRef.get();
    
    if (docSnap.exists) {
      continue; // Skip already processed event
    }

    // Mark as processed. 
    // Add expiresAt to leverage native Firestore TTL policies (Clean up after 48h)
    await processedRef.set({
      processedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 172800000)
    });

    validEvents.push(event);
  }

  // 6. Group by objectId sequentially after deduplication
  const uniqueContactIds = [...new Set(validEvents.map(e => e.objectId).filter(Boolean))];

  for (const objectId of uniqueContactIds) {
    try {
      // Grab any valid event for this objectId to harvest its portalId
      const triggerEvent = validEvents.find(e => e.objectId === objectId);
      if (!triggerEvent || !triggerEvent.portalId) continue;

      // Map HubSpot portalId to user's database record
      const connectionsSnap = await db.collection('hubspot_connections')
        .where('hub_id', '==', triggerEvent.portalId)
        .limit(1)
        .get();

      if (connectionsSnap.empty) {
        console.warn(`[HubSpot Webhook] No matching userId for portalId: ${triggerEvent.portalId}`);
        continue;
      }

      const hsConnection = connectionsSnap.docs[0].data();
      const userId = hsConnection.userId;
      const accessToken = hsConnection.access_token;

      // 7. Hydrate Full Contact (Since HubSpot only delivers the specific changed field)
      let contactResponse;
      try {
        contactResponse = await axios.get(
          `https://api.hubapi.com/crm/v3/objects/contacts/${objectId}?properties=email,firstname,lastname,phone`, 
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
      } catch (fetchErr: any) {
        console.error(`[HubSpot Webhook] Failed to hydrate contact ID: ${objectId} -`, fetchErr.response?.data?.message || fetchErr.message);
        continue;
      }

      const props = contactResponse.data.properties;
      const email = props.email || '';
      
      if (!email) {
        console.log(`[HubSpot Webhook] Skipped object ${objectId} - missing email.`);
        continue;
      }

      const normalizedContact: NormalizedContact = {
        id: objectId.toString(),
        email,
        firstname: props.firstname || '',
        lastname: props.lastname || '',
        phone: props.phone || ''
      };

      // 8. Safely Trigger Native Service Logic
      await syncHubspotToWix(userId, normalizedContact);
      
    } catch (criticalErr: any) {
      console.error(`[HubSpot Webhook] Failed mapping flow for object ID ${objectId}:`, criticalErr.message);
    }
  }
}