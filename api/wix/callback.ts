import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { db, admin } from '../_lib/firebase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state: userId } = req.query;
  if (!code || !userId) return res.status(400).send('Missing code or state');

  const WIX_CLIENT_ID = process.env.WIX_CLIENT_ID;
  const WIX_CLIENT_SECRET = process.env.WIX_CLIENT_SECRET;
  const WIX_REDIRECT_URI = process.env.WIX_REDIRECT_URI || 'http://localhost:3000/wix/oauth-callback';

  try {
    const response = await axios.post('https://www.wix.com/oauth/access', {
      grant_type: 'authorization_code',
      client_id: WIX_CLIENT_ID,
      client_secret: WIX_CLIENT_SECRET,
      code,
      redirect_uri: WIX_REDIRECT_URI,
    });

    const { access_token, refresh_token } = response.data;

    await db.collection('wix_connections').doc(userId as string).set({
      userId,
      access_token,
      refresh_token,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.redirect('/?wix_connected=success');
  } catch (error: any) {
    console.error('Wix OAuth Error:', error.response?.data || error.message);
    res.redirect('/?wix_connected=error');
  }
}
