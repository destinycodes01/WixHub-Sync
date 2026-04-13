import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import config from '../../firebase-applet-config.json' with { type: "json" };

// Read the config file to get the correct database ID
const databaseId = config.firestoreDatabaseId || '(default)';

function getFirebaseAdmin() {
  if (!admin.apps.length) {
    try {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const projectId = process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0596835782';

      if (privateKey && clientEmail) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
      } else {
        // Fallback for local development or if ADC is somehow available
        admin.initializeApp({ projectId });
      }
    } catch (error) {
      console.error('Firebase Admin initialization error:', error);
    }
  }
  return admin;
}

export function getDb() {
  const adminInstance = getFirebaseAdmin();
  // Use the specific named database ID from the config
  return getFirestore(adminInstance.app(), databaseId);
}

export { admin as firebaseAdmin };
