# WixHub Sync

WixHub Sync is a bi-directional contact and form synchronization tool connecting Wix and HubSpot.

## Features

- **Real OAuth 2.0 Integration**: Securely connect to HubSpot and Wix using official OAuth flows.
- **Bi-Directional Sync**: Sync contacts from Wix to HubSpot and vice-versa.
- **Loop Prevention**: Built-in logic to prevent infinite sync loops between platforms.
- **Audit Logs**: Real-time sync logs stored in Firestore and displayed in the UI.
- **Secure Token Storage**: Tokens are stored securely in Firebase Firestore and never exposed to the frontend.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- Firebase Project (Firestore enabled)
- HubSpot Developer Account (for creating a public app)
- Wix Developer Account (for creating an app)

### Environment Variables
Create a `.env` file in the root directory (or use the provided AI Studio Secrets panel) and add the following variables:

```env
HUBSPOT_CLIENT_ID=your_hubspot_client_id
HUBSPOT_CLIENT_SECRET=your_hubspot_client_secret
HUBSPOT_REDIRECT_URI=http://localhost:3000/oauth-callback

WIX_CLIENT_ID=your_wix_client_id
WIX_CLIENT_SECRET=your_wix_client_secret
WIX_REDIRECT_URI=http://localhost:3000/wix/oauth-callback
```

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

## Testing the Integration

1. **Connect Accounts**:
   - Navigate to the Dashboard.
   - Click "Connect HubSpot" and complete the OAuth flow.
   - Click "Connect Wix" and complete the OAuth flow.
2. **Trigger Sync**:
   - The backend exposes two webhook endpoints:
     - `POST /api/sync/wix-to-hubspot`
     - `POST /api/sync/hubspot-to-wix`
   - You can test these by sending a POST request with a payload like:
     ```json
     {
       "userId": "your_firebase_user_id",
       "contact": {
         "id": "12345",
         "email": "test@example.com",
         "firstName": "John",
         "lastName": "Doe",
         "phone": "555-1234"
       }
     }
     ```
3. **View Logs**:
   - Check the "Sync Logs" panel in the dashboard to see the real-time audit trail of your sync operations.

## Architecture

- **Frontend**: React, Tailwind CSS, Vite
- **Backend**: Express.js (running alongside Vite in development, serving static files in production)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (Google Login)
