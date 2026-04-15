import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { getDb, firebaseAdmin } from '../_lib/firebase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("WIX CALLBACK HIT");
  const { code, state: userId } = req.query;
  if (!code || !userId) return res.status(400).send('Missing code or state');

  const WIX_CLIENT_ID = process.env.WIX_CLIENT_ID;
  const WIX_REDIRECT_URI = 'https://wixhubsync.vercel.app/api/wix/callback';

  try {
    const response = await axios.post('https://www.wixapis.com/oauth2/token', {
      grant_type: 'authorization_code',
      client_id: WIX_CLIENT_ID,
      code,
      redirect_uri: WIX_REDIRECT_URI,
    });

    console.log("WIX TOKEN SUCCESS");
    const { access_token, refresh_token } = response.data;

    try {
      const db = getDb();
      await db.collection('wix_connections').doc(userId as string).set({
        userId,
        access_token,
        refresh_token,
        createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      });
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
