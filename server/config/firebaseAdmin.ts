import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Read Firebase config synchronously
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig: any = {};
if (fs.existsSync(configPath)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (err) {
    console.error(`[FIREBASE_ADMIN] Error parsing config at ${configPath}:`, err);
  }
}

const adminProjectId = process.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId;

if (admin.apps.length === 0) {
  const options: any = {
    credential: admin.credential.applicationDefault(),
  };
  if (adminProjectId) options.projectId = adminProjectId;
  if (firebaseConfig.storageBucket) options.storageBucket = firebaseConfig.storageBucket;
  
  admin.initializeApp(options);
}

const firestore = admin.firestore();
const auth = admin.auth();

export { admin, firestore, auth };
