import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log("AUTH HIT");
  const { userId } = req.query;

  const clientId = process.env.HUBSPOT_CLIENT_ID;
  const redirectUri = process.env.HUBSPOT_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return res.status(500).send("Missing environment variables");
  }

  const scope = encodeURIComponent(
    "crm.objects.contacts.read crm.objects.contacts.write"
  );

  const authUrl =
    "https://app.hubspot.com/oauth/authorize" +
    `?client_id=${clientId}` +
    `&scope=${scope}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${userId || ''}`;

  return res.redirect(authUrl);
}
