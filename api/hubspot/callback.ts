import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { getDb, firebaseAdmin } from '../_lib/firebase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("CALLBACK HIT", req.query);
  const { code, state: userId } = req.query;

  if (!code) {
    return res.status(400).send("Missing code");
  }

  const HUBSPOT_CLIENT_ID = process.env.HUBSPOT_CLIENT_ID;
  const HUBSPOT_CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET;
  const HUBSPOT_REDIRECT_URI = process.env.HUBSPOT_REDIRECT_URI;

  try {
    const formData = new URLSearchParams();
    formData.append('grant_type', 'authorization_code');
    formData.append('client_id', HUBSPOT_CLIENT_ID || '');
    formData.append('client_secret', HUBSPOT_CLIENT_SECRET || '');
    formData.append('redirect_uri', HUBSPOT_REDIRECT_URI || '');
    formData.append('code', code as string);

    let tokenData;
    try {
      const response = await axios.post('https://api.hubapi.com/oauth/v3/token', formData.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      tokenData = response.data;
    } catch (err: any) {
      throw new Error(`Token Exchange Failed: ${JSON.stringify(err.response?.data || err.message)}`);
    }

    const { access_token, refresh_token, expires_in } = tokenData;

    // Fetch Hub ID
    let hub_id;
    try {
      const hubResponse = await axios.get('https://api.hubapi.com/oauth/v1/access-tokens/' + access_token);
      hub_id = hubResponse.data.hub_id;
    } catch (err: any) {
      throw new Error(`Hub ID Fetch Failed: ${JSON.stringify(err.response?.data || err.message)}`);
    }

    if (userId) {
      try {
        const db = getDb();
        await db.collection('hubspot_connections').doc(userId as string).set({
          userId,
          access_token,
          refresh_token,
          expires_in,
          hub_id,
          hubDomain: `HubSpot ID: ${hub_id}`,
          createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (err: any) {
        throw new Error(`Firebase Write Failed: ${err.message}`);
      }
    }

    console.log("OAuth SUCCESS:", { code, state: userId });

    return res.redirect("https://wixhubsync.vercel.app/?hubspot_connected=success");
  } catch (error: any) {
    console.error('HubSpot OAuth Error:', error.message);
    const encodedError = encodeURIComponent(error.message);
    return res.redirect(`https://wixhubsync.vercel.app/?hubspot_connected=error&details=${encodedError}`);
  }
}
