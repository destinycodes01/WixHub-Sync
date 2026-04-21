import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { getDb, firebaseAdmin } from '../_lib/firebase.js';
import hubspotToWixHandler from '../sync/hubspot-to-wix.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Immediately return 200 OK to HubSpot (Non-blocking)
  // HubSpot will retry and throttle if we do not acknowledge within 3 seconds.
  res.status(200).send('OK');

  if (req.method !== 'POST') return;
  const events = req.body;
  if (!Array.isArray(events) || events.length === 0) return;

  // 2. Process events in standard detached async execution
  // Note: On Vercel standard tier, background execution may be paused until next invocation.
  // Upgrading to Vercel Background Functions (waitUntil) is recommended for high volume.
  processEvents(events).catch((err) => {
    console.error('[HubSpot Webhook] Fatal background processing error:', err.message);
  });
}

async function processEvents(events: any[]) {
  const db = getDb();
  
  // Group by objectId: HubSpot sends individual events per property change.
  // We extract unique contacts from the payload batch to avoid redundant processing.
  const uniqueContactIds = [...new Set(events.map(e => e.objectId).filter(Boolean))];

  for (const objectId of uniqueContactIds) {
    try {
      const triggerEvent = events.find(e => e.objectId === objectId);
      if (!triggerEvent || !triggerEvent.portalId) continue;

      // 3. Deduplication via Firestore
      const eventId = triggerEvent.eventId?.toString();
      if (eventId) {
        const processedRef = db.collection('processed_events').doc(eventId);
        const docSnap = await processedRef.get();
        if (docSnap.exists) {
          continue; // Skip duplicate payload
        }
        await processedRef.set({
          processedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
        });
      }

      // 4. Map HubSpot portalId to user's database record
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

      // 5. Fetch Full Contact safely
      // We CANNOT rely solely on the webhook payload because `contact.propertyChange` 
      // only includes the strictly modified field (e.g. only "lastname").
      let contactResponse;
      try {
        contactResponse = await axios.get(
          `https://api.hubapi.com/crm/v3/objects/contacts/${objectId}?properties=email,firstname,lastname,phone`, 
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
      } catch (fetchErr: any) {
        console.error(`[HubSpot Webhook] Failed to hydrate contact ${objectId}:`, fetchErr.response?.data?.message || fetchErr.message);
        continue;
      }

      // 6. Normalize payload
      const props = contactResponse.data.properties;
      const email = props.email || '';
      const firstname = props.firstname || '';
      const lastname = props.lastname || '';
      const phone = props.phone || '';

      // 7. Skip if no email
      if (!email) {
        console.log(`[HubSpot Webhook] Skipped contact ${objectId} - missing email.`);
        continue;
      }

      const normalizedContact = {
        id: objectId.toString(),
        email,
        firstname,
        lastname,
        phone
      };

      // 8. Execute Internal wix payload sync
      // We directly invoke the existing serverless handler by mocking the Vercel request cycle.
      const mockReq = {
        method: 'POST',
        body: {
          userId,
          contact: normalizedContact
        }
      } as unknown as VercelRequest;

      const mockRes: any = {
        status: function () { return this; },
        json: function () { return this; },
        send: function () { return this; }
      };

      await hubspotToWixHandler(mockReq, mockRes);
      
    } catch (criticalErr: any) {
      console.error('[HubSpot Webhook] Event mapping execution failed:', criticalErr.message);
    }
  }
}
