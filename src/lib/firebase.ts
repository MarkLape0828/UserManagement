
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';

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
let auth: ReturnType<typeof getAuth> | null = null;
let db = null; // Placeholder for Firestore if re-added later

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
    auth = getAuth(app);
    // db = getFirestore(app); // Firestore not used in this version
    console.log('Firebase app initialized and Auth instance obtained successfully.');
  } catch (error) {
    console.error('CRITICAL: Firebase initialization failed catastrophically. Error:', error);
    // app will be undefined and auth will remain null
  }
}

if (!auth) {
    // This log will appear if auth is still null after the initialization block.
    console.error("CRITICAL: Firebase Auth instance is null after initialization attempt. Authentication operations will fail. Review Firebase configuration and previous logs.");
}


export { app, auth, db };
