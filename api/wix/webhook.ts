import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../_lib/firebase.js';
import { syncWixToHubspot, WixNormalizedContact } from '../_lib/sync/wixToHubspotService.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  // Immediately respond 200 OK to prevent Webhook timeouts/retries
  res.status(200).send('OK');

  try {
    const rawBody = req.body;
    
    // Automatically parse depending on Wix Webhook configuration (JWT vs JSON)
    let payloadStr = typeof rawBody === 'string' ? rawBody : rawBody.data;
    let decodedPayload: any;

    if (typeof payloadStr === 'string' && payloadStr.includes('.')) {
      // Decode JWT without strict verification to extract the instance ID and event data natively
      const parts = payloadStr.split('.');
      if (parts.length === 3) {
        decodedPayload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      }
    } else if (typeof rawBody === 'object') {
       decodedPayload = rawBody;
    }

    if (!decodedPayload) return;

    // Isolate identity securely
    const identityId = decodedPayload.instanceId || decodedPayload.metaSiteId || decodedPayload.siteId || req.headers['x-wix-instance-id'] || req.headers['x-wix-site-id'];

    if (!identityId) {
      console.warn('[Wix Webhook] Missing identity ID (instanceId/siteId)');
      return;
    }

    // Resolve User via Multi-Tenant Lookup
    const db = getDb();
    let userId: string | null = null;
    
    // Attempt match against primary App Instance ID
    const connSnapshot = await db.collection('wix_connections')
      .where('wixInstanceId', '==', identityId)
      .limit(1)
      .get();
      
    if (!connSnapshot.empty) {
      userId = connSnapshot.docs[0].id;
    } else {
      // Fallback: Check against naked Site ID
      const siteSnapshot = await db.collection('wix_connections')
        .where('wixSiteId', '==', identityId)
        .limit(1)
        .get();
        
      if (!siteSnapshot.empty) {
         userId = siteSnapshot.docs[0].id;
      }
    }

    if (!userId) {
      console.warn(`[Wix Webhook] Unmapped Wix Identity: ${identityId}`);
      return;
    }

    // Extract Contact Metadata Layer
    let eventData = decodedPayload.data;
    if (typeof eventData === 'string' && eventData.startsWith('{')) {
      try { eventData = JSON.parse(eventData); } catch(e) {}
    } else if (!eventData) {
      eventData = decodedPayload;
    }

    const contactNode = eventData.contact || eventData;
    
    const email = contactNode.email || contactNode.emails?.[0]?.email || '';
    const firstname = contactNode.firstName || contactNode.name?.first || '';
    const lastname = contactNode.lastName || contactNode.name?.last || '';
    const phone = contactNode.phone || contactNode.phones?.[0]?.phone || '';
    const wixContactId = contactNode.contactId || contactNode.id;

    if (!wixContactId) {
      console.warn('[Wix Webhook] Skipped - No wixContactId structurally resolved in payload');
      return;
    }

    const normalizedContact: WixNormalizedContact = {
      contactId: wixContactId,
      email,
      firstname,
      lastname,
      phone
    };

    // Trigger internal Core Service
    await syncWixToHubspot(userId, normalizedContact);

  } catch (error: any) {
    console.error('[Wix Webhook Flow Error]', error.message);
  }
}
