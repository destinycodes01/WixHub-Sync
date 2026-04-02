import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'WixHub Sync Backend is running' });
  });

  // Mock OAuth endpoints for HubSpot
  app.get('/api/hubspot/auth', (req, res) => {
    // In a real app, this redirects to HubSpot OAuth URL
    // For this demo, we'll just return a mock URL that the frontend can redirect to
    const mockAuthUrl = `/api/hubspot/callback?code=mock_auth_code_123`;
    res.json({ url: mockAuthUrl });
  });

  app.get('/api/hubspot/callback', (req, res) => {
    // In a real app, we'd exchange the code for an access token and save it to Firebase
    // For this demo, we'll redirect back to the app with a success flag
    res.redirect('/?hubspot_connected=true');
  });

  app.post('/api/sync/wix-to-hubspot', (req, res) => {
    console.log('Received Wix webhook:', req.body);
    // Process sync logic here
    res.json({ success: true, message: 'Contact synced to HubSpot' });
  });

  app.post('/api/sync/hubspot-to-wix', (req, res) => {
    console.log('Received HubSpot webhook:', req.body);
    // Process sync logic here
    res.json({ success: true, message: 'Contact synced to Wix' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
