import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const clientId = process.env.HUBSPOT_CLIENT_ID;
    const redirectUri = process.env.HUBSPOT_REDIRECT_URI || 'http://localhost:3000/oauth-callback';

    if (!clientId || !redirectUri) {
      return res.status(500).json({
        error: "Missing environment variables",
      });
    }

    const scope = encodeURIComponent('crm.objects.contacts.read crm.objects.contacts.write');

    const authUrl =
      "https://app.hubspot.com/oauth/authorize" +
      `?client_id=${clientId}` +
      `&scope=${scope}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${userId}`;

    return res.redirect(authUrl);
  } catch (error) {
    console.error("HubSpot OAuth Error:", error);
    return res.status(500).json({
      error: "OAuth initialization failed",
    });
  }
}
