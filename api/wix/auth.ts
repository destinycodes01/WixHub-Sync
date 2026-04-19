import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import axios from 'axios';
import { getDb, firebaseAdmin } from '../_lib/firebase.js';

const createPkcePair = () => {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
};

const createState = () => crypto.randomBytes(24).toString('base64url');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("WIX AUTH HIT");
  try {
    const WIX_CLIENT_ID = process.env.WIX_CLIENT_ID;
    const WIX_REDIRECT_URI = 'https://wixhubsync.vercel.app/api/wix/callback';

    const userId = req.query.userId as string | undefined;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const { codeVerifier, codeChallenge } = createPkcePair();
    const state = createState();

    // Store state and PKCE verifier securely in Firebase
    try {
      const db = getDb();
      await db.collection('wix_oauth_states').doc(state).set({
        userId,
        codeVerifier,
        createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.error("Firebase State Error:", err);
      throw new Error("Failed to save auth state");
    }

    // 1. Get anonymous token from Wix
    const tokenResponse = await axios.post('https://www.wixapis.com/oauth2/token', {
      clientId: WIX_CLIENT_ID,
      grantType: 'anonymous',
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });

    const accessToken = tokenResponse.data.access_token;

    // 2. Request redirect session using the anonymous token
    const redirectResponse = await axios.post('https://www.wixapis.com/_api/redirects-api/v1/redirect-session', {
      auth: {
        authRequest: {
          redirectUri: WIX_REDIRECT_URI,
          clientId: WIX_CLIENT_ID,
          codeChallenge,
          codeChallengeMethod: 'S256',
          responseMode: 'query', // Server-side callbacks require query, not fragment
          responseType: 'code',
          scope: 'offline_access',
          state,
        },
      },
    }, {
      headers: {
        'Accept': 'application/json',
        'Authorization': accessToken,
        'Content-Type': 'application/json',
      }
    });

    const fullUrl = redirectResponse.data?.redirectSession?.fullUrl;

    if (!fullUrl) {
      throw new Error(`Missing fullUrl in response: ${JSON.stringify(redirectResponse.data)}`);
    }

    res.redirect(fullUrl);
  } catch (error: any) {
    console.error("Wix OAuth Error:", error.response?.data || error.message);
    return res.status(500).json({
      error: "OAuth initialization failed",
      details: error.response?.data || error.message
    });
  }
}
