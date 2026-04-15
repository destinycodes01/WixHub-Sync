import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const WIX_CLIENT_ID = process.env.WIX_CLIENT_ID;
    const WIX_REDIRECT_URI = process.env.WIX_REDIRECT_URI || 'https://wixhubsync.vercel.app/api/wix/callback';

    const userId = req.query.userId as string | undefined;
    const stateParam = userId ? `&state=${userId}` : '';

    // For Wix Headless apps, the OAuth URL is different than standard Wix Apps
    const authUrl = `https://www.wix.com/installer/install?appId=${WIX_CLIENT_ID}&redirectUrl=${encodeURIComponent(WIX_REDIRECT_URI)}${stateParam}`;
    res.redirect(authUrl);
  } catch (error) {
    console.error("Wix OAuth Error:", error);
    return res.status(500).json({
      error: "OAuth initialization failed",
    });
  }
}
