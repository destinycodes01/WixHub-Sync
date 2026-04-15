import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log("WIX AUTH HIT");
  try {
    const WIX_CLIENT_ID = process.env.WIX_CLIENT_ID;
    const WIX_REDIRECT_URI = 'https://wixhubsync.vercel.app/api/wix/callback';

    const userId = req.query.userId as string | undefined;
    const stateParam = userId ? `&state=${userId}` : '';

    const authUrl = `https://www.wix.com/oauth/authorize?client_id=${WIX_CLIENT_ID}&redirect_uri=${encodeURIComponent(WIX_REDIRECT_URI)}&response_type=code&scope=offline_access${stateParam}`;
    res.redirect(authUrl);
  } catch (error) {
    console.error("Wix OAuth Error:", error);
    return res.status(500).json({
      error: "OAuth initialization failed",
    });
  }
}
