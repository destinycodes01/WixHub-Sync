import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import admin from 'firebase-admin';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    admin.initializeApp({
      projectId: config.projectId,
    });
  } else {
    admin.initializeApp();
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
}

const db = admin.firestore();

// Environment Variables
const HUBSPOT_CLIENT_ID = process.env.HUBSPOT_CLIENT_ID;
const HUBSPOT_CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET;
const HUBSPOT_REDIRECT_URI = process.env.HUBSPOT_REDIRECT_URI || 'http://localhost:3000/oauth-callback';

const WIX_CLIENT_ID = process.env.WIX_CLIENT_ID;
const WIX_CLIENT_SECRET = process.env.WIX_CLIENT_SECRET;
const WIX_REDIRECT_URI = process.env.WIX_REDIRECT_URI || 'http://localhost:3000/wix/oauth-callback';

export const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'WixHub Sync Backend is running' });
});

  // ==========================================
  // HUBSPOT OAUTH
  // ==========================================
  app.get('/api/hubspot/auth', (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).send('Missing userId');
    
    const scope = encodeURIComponent('crm.objects.contacts.read crm.objects.contacts.write');
    const authUrl = `https://app.hubspot.com/oauth/authorize?client_id=${HUBSPOT_CLIENT_ID}&redirect_uri=${encodeURIComponent(HUBSPOT_REDIRECT_URI)}&scope=${scope}&state=${userId}`;
    res.json({ url: authUrl });
  });

  app.get('/oauth-callback', async (req, res) => {
    const { code, state: userId } = req.query;
    if (!code || !userId) return res.status(400).send('Missing code or state');

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
  });

  // ==========================================
  // WIX OAUTH
  // ==========================================
  app.get('/api/wix/auth', (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).send('Missing userId');

    const authUrl = `https://www.wix.com/oauth/authorize?client_id=${WIX_CLIENT_ID}&redirect_uri=${encodeURIComponent(WIX_REDIRECT_URI)}&response_type=code&state=${userId}`;
    res.json({ url: authUrl });
  });

  app.get('/wix/oauth-callback', async (req, res) => {
    const { code, state: userId } = req.query;
    if (!code || !userId) return res.status(400).send('Missing code or state');

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
  });

  // ==========================================
  // SYNC LOGIC & WEBHOOKS
  // ==========================================

  async function logSync(userId: string, source: 'wix' | 'hubspot', status: 'success' | 'error', message: string, wixContactId?: string, hubspotContactId?: string) {
    await db.collection('sync_logs').add({
      userId,
      timestamp: new Date().toISOString(),
      operationType: 'sync',
      source,
      status,
      message,
      wixContactId: wixContactId || null,
      hubspotContactId: hubspotContactId || null,
    });
  }

  app.post('/api/sync/wix-to-hubspot', async (req, res) => {
    const { userId, contact } = req.body;
    if (!userId || !contact) return res.status(400).send('Missing userId or contact');

    try {
      // 1. Get HubSpot Token
      const hsConn = await db.collection('hubspot_connections').doc(userId).get();
      if (!hsConn.exists) throw new Error('HubSpot not connected');
      const { access_token } = hsConn.data()!;

      // 2. Map Fields (Basic mapping for now, can be expanded via users/{userId}/mappings)
      const hsContact = {
        properties: {
          email: contact.email,
          firstname: contact.firstName,
          lastname: contact.lastName,
          phone: contact.phone,
        }
      };

      // 3. Prevent Loop
      const syncId = `wix_${contact.id}`;
      const mappingRef = db.collection('contact_mappings').doc(syncId);
      const mapping = await mappingRef.get();
      if (mapping.exists && Date.now() - mapping.data()!.lastSyncedAt < 60000) {
        return res.json({ success: true, message: 'Skipped to prevent loop' });
      }

      // 4. Send to HubSpot
      const response = await axios.post('https://api.hubapi.com/crm/v3/objects/contacts', hsContact, {
        headers: { Authorization: `Bearer ${access_token}` }
      });

      const hubspotContactId = response.data.id;

      // 5. Save Mapping
      await mappingRef.set({
        wixContactId: contact.id,
        hubspotContactId,
        lastSyncedAt: Date.now(),
        source: 'wix',
        syncId
      });

      await logSync(userId, 'wix', 'success', `Synced contact ${contact.email} to HubSpot`, contact.id, hubspotContactId);
      res.json({ success: true, message: 'Contact synced to HubSpot' });
    } catch (error: any) {
      console.error('Sync Error (Wix -> HubSpot):', error.response?.data || error.message);
      await logSync(userId, 'wix', 'error', `Failed to sync: ${error.message}`);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/sync/hubspot-to-wix', async (req, res) => {
    const { userId, contact } = req.body;
    if (!userId || !contact) return res.status(400).send('Missing userId or contact');

    try {
      // 1. Get Wix Token
      const wixConn = await db.collection('wix_connections').doc(userId).get();
      if (!wixConn.exists) throw new Error('Wix not connected');
      const { access_token } = wixConn.data()!;

      // 2. Prevent Loop
      const syncId = `hs_${contact.id}`;
      const mappingRef = db.collection('contact_mappings').doc(syncId);
      const mapping = await mappingRef.get();
      if (mapping.exists && Date.now() - mapping.data()!.lastSyncedAt < 60000) {
        return res.json({ success: true, message: 'Skipped to prevent loop' });
      }

      // 3. Send to Wix (Mocking the Wix API call structure as per standard Wix CRM API)
      // In a fully real scenario, we'd use the exact Wix CRM endpoint
      /*
      const response = await axios.post('https://www.wixapis.com/contacts/v4/contacts', {
        info: {
          name: { first: contact.firstname, last: contact.lastname },
          emails: [{ email: contact.email }],
          phones: [{ phone: contact.phone }]
        }
      }, {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      const wixContactId = response.data.contact.id;
      */
      const wixContactId = 'wix_mock_id_' + Date.now(); // Placeholder for actual Wix API call

      // 4. Save Mapping
      await mappingRef.set({
        wixContactId,
        hubspotContactId: contact.id,
        lastSyncedAt: Date.now(),
        source: 'hubspot',
        syncId
      });

      await logSync(userId, 'hubspot', 'success', `Synced contact ${contact.email} to Wix`, wixContactId, contact.id);
      res.json({ success: true, message: 'Contact synced to Wix' });
    } catch (error: any) {
      console.error('Sync Error (HubSpot -> Wix):', error.response?.data || error.message);
      await logSync(userId, 'hubspot', 'error', `Failed to sync: ${error.message}`);
      res.status(500).json({ success: false, error: error.message });
    }
  });

// Vite middleware for development
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  }).then((vite) => {
    app.use(vite.middlewares);
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
} else if (!process.env.VERCEL) {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
