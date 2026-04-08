import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { db, admin } from '../_lib/firebase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state: userId } = req.query;
  if (!code || !userId) return res.status(400).send('Missing code or state');

  const HUBSPOT_CLIENT_ID = process.env.HUBSPOT_CLIENT_ID;
  const HUBSPOT_CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET;
  const HUBSPOT_REDIRECT_URI = process.env.HUBSPOT_REDIRECT_URI || 'http://localhost:3000/oauth-callback';

  try {
    const response = await axios.post('https://api.hubapi.com/oauth/v3/token', null, {
      params: {
        grant_type: 'authorization_code',
        client_id: HUBSPOT_CLIENT_ID,
        client_secret: HUBSPOT_CLIENT_SECRET,
        redirect_uri: HUBSPOT_REDIRECT_URI,
        code,
      },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token, refresh_token, expires_in } = response.data;

    // Fetch Hub ID
    const hubResponse = await axios.get('https://api.hubapi.com/oauth/v1/access-tokens/' + access_token);
    const hub_id = hubResponse.data.hub_id;

    await db.collection('hubspot_connections').doc(userId as string).set({
      userId,
      access_token,
      refresh_token,
      expires_in,
      hub_id,
      hubDomain: `HubSpot ID: ${hub_id}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.redirect('/?hubspot_connected=success');
  } catch (error: any) {
    console.error('HubSpot OAuth Error:', error.response?.data || error.message);
    res.redirect('/?hubspot_connected=error');
  }
}
