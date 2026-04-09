import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const clientId = process.env.HUBSPOT_CLIENT_ID;
    const redirectUri = process.env.HUBSPOT_REDIRECT_URI || 'http://localhost:3000/oauth-callback';

    if (!clientId || !redirectUri) {
      return res.status(500).json({
        error: "Missing environment variables",
      });
    }

    const scope = encodeURIComponent('crm.objects.contacts.read crm.objects.contacts.write');
    
    // Make userId optional so direct visits to the URL don't fail with 400
    const userId = req.query.userId as string | undefined;
    const stateParam = userId ? `&state=${userId}` : '';

    const authUrl =
      "https://app.hubspot.com/oauth/authorize" +
      `?client_id=${clientId}` +
      `&scope=${scope}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      stateParam;

    return res.redirect(authUrl);
  } catch (error) {
    console.error("HubSpot OAuth Error:", error);
    return res.status(500).json({
      error: "OAuth initialization failed",
    });
  }
}
