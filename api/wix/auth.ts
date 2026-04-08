import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).send('Missing userId');

    const WIX_CLIENT_ID = process.env.WIX_CLIENT_ID;
    const WIX_REDIRECT_URI = process.env.WIX_REDIRECT_URI || 'http://localhost:3000/wix/oauth-callback';

    const authUrl = `https://www.wix.com/oauth/authorize?client_id=${WIX_CLIENT_ID}&redirect_uri=${encodeURIComponent(WIX_REDIRECT_URI)}&response_type=code&state=${userId}`;
    res.redirect(authUrl);
  } catch (error) {
    console.error("Wix OAuth Error:", error);
    return res.status(500).json({
      error: "OAuth initialization failed",
    });
  }
}
