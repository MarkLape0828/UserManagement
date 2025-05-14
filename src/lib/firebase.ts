
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// import { getAuth } from 'firebase/auth'; // We'll manage auth via server actions for now

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Initialize Firebase
let app;
let db: ReturnType<typeof getFirestore> | null = null;

if (!firebaseConfig.projectId) {
  console.error(
    'CRITICAL: Firebase projectId is missing or undefined in environment variables. Firebase will not be initialized. Ensure NEXT_PUBLIC_FIREBASE_PROJECT_ID is correctly set in your .env.local file and the Next.js server has been restarted.'
  );
} else {
  try {
    if (!getApps().length) {
      console.log('Initializing new Firebase app...');
      app = initializeApp(firebaseConfig);
    } else {
      console.log('Getting existing Firebase app.');
      app = getApp();
    }
    db = getFirestore(app);
    console.log('Firebase app initialized and Firestore instance obtained successfully.');
  } catch (error) {
    console.error('CRITICAL: Firebase initialization failed catastrophically. Error:', error);
    // app will be undefined and db will remain null
  }
}

if (!db) {
    // This log will appear if db is still null after the initialization block.
    console.error("CRITICAL: Firestore database (db) instance is null after initialization attempt. Database operations will fail. Review Firebase configuration and previous logs.");
}

export { app, db /*, auth */ };
