import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { getDb, firebaseAdmin } from '../_lib/firebase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("WIX CALLBACK HIT");
  const { code, state } = req.query;
  if (!code || !state) return res.status(400).send('Missing code or state');

  const WIX_CLIENT_ID = process.env.WIX_CLIENT_ID;
  const WIX_REDIRECT_URI = 'https://wixhubsync.vercel.app/api/wix/callback';

  try {
    const db = getDb();
    
    // Retrieve state doc created during auth initiation
    const stateDoc = await db.collection('wix_oauth_states').doc(state as string).get();
    if (!stateDoc.exists) {
      console.error("Invalid or expired state parameter");
      return res.redirect(`https://wixhubsync.vercel.app/?wix_connected=error&details=${encodeURIComponent("Session expired or invalid. Please try connecting again.")}`);
    }
    
    const stateData = stateDoc.data()!;
    const userId = stateData.userId;
    const codeVerifier = stateData.codeVerifier;

    // Exchange code for tokens, MUST include code_verifier for PKCE validation
    const response = await axios.post('https://www.wixapis.com/oauth2/token', {
      grant_type: 'authorization_code',
      client_id: WIX_CLIENT_ID,
      code,
      redirect_uri: WIX_REDIRECT_URI,
      code_verifier: codeVerifier,
    });

    console.log("WIX TOKEN SUCCESS");
    const { access_token, refresh_token } = response.data;

    let wixInstanceId = null;
    let wixSiteId = null;

    try {
      // Decode JWT access_token safely to extract multi-tenant identifiers
      const parts = access_token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        wixInstanceId = payload.appInstanceId || payload.instanceId || null;
        wixSiteId = payload.tenantId || payload.siteId || null;
      }
    } catch(e) {
      console.warn("Could not decode identity from Wix access token.");
    }

    try {
      // Save tokens permanently alongside multi-tenant identifiers
      const connectionData: any = {
        userId,
        access_token,
        refresh_token,
        createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      };

      if (wixInstanceId) connectionData.wixInstanceId = wixInstanceId;
      if (wixSiteId) connectionData.wixSiteId = wixSiteId;

      await db.collection('wix_connections').doc(userId as string).set(connectionData, { merge: true });
      
      // Cleanup the temporary state doc
      await db.collection('wix_oauth_states').doc(state as string).delete();
    } catch (err: any) {
      console.error("FIREBASE ERROR:", err);
    }

    return res.redirect('https://wixhubsync.vercel.app/?wix_connected=success');
  } catch (error: any) {
    console.error('Wix OAuth Error:', error.response?.data || error.message);
    const encodedError = encodeURIComponent(error.response?.data?.message || error.message);
    return res.redirect(`https://wixhubsync.vercel.app/?wix_connected=error&details=${encodedError}`);
  }
}
