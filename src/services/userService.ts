
'use server';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';

const USER_PROFILES_COLLECTION = 'userProfiles';

export interface AppUserProfile {
  uid: string; // Firebase Auth UID, also serves as document ID in Firestore
  firstName: string;
  lastName: string;
  email: string; // This email should match the Firebase Auth email
  role: 'admin' | 'employee';
  status: 'active' | 'inactive';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function ensureDbInitialized() {
  if (!db) {
    console.error("FATAL: Firestore DB is not initialized in userService. Throwing error.");
    throw new Error("Database service is not available. Firebase initialization may have failed. Check server logs.");
  }
}

// Helper to map Firestore doc data to AppUserProfile, ensuring dates are JS Dates
function mapFirestoreDocToProfile(docId: string, data: any): AppUserProfile {
  return {
    uid: docId,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    role: data.role,
    status: data.status,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
  } as unknown as AppUserProfile; // Cast to AppUserProfile after mapping
}


export async function getUserProfileById(uid: string): Promise<AppUserProfile | null> {
  ensureDbInitialized();
  try {
    const profileDocRef = doc(db!, USER_PROFILES_COLLECTION, uid);
    const docSnap = await getDoc(profileDocRef);
    if (docSnap.exists()) {
      return mapFirestoreDocToProfile(docSnap.id, docSnap.data());
    }
    return null;
  } catch (error) {
    console.error(`Error fetching user profile by UID ${uid}:`, error);
    throw error; // Re-throw to be handled by the calling server action
  }
}

export async function getUserProfileByEmail(email: string): Promise<AppUserProfile | null> {
  ensureDbInitialized();
  try {
    const profilesRef = collection(db!, USER_PROFILES_COLLECTION);
    const q = query(profilesRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      return mapFirestoreDocToProfile(docSnap.id, docSnap.data());
    }
    return null;
  } catch (error) {
    console.error(`Error fetching user profile by email ${email}:`, error);
    throw error;
  }
}

export async function createUserProfile(
  uid: string,
  profileData: Omit<AppUserProfile, 'uid' | 'createdAt' | 'updatedAt'>
): Promise<AppUserProfile> {
  ensureDbInitialized();
  try {
    const profileDocRef = doc(db!, USER_PROFILES_COLLECTION, uid);
    const now = Timestamp.now();
    const fullProfileData = {
      ...profileData,
      uid, // ensure uid is part of the document data too
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(profileDocRef, fullProfileData);
    // Re-fetch to get Timestamps correctly converted if needed, or construct manually
    const newDocSnap = await getDoc(profileDocRef);
    if (!newDocSnap.exists()) {
        throw new Error("Failed to retrieve created user profile.");
    }
    return mapFirestoreDocToProfile(newDocSnap.id, newDocSnap.data());
  } catch (error) {
    console.error(`Error creating user profile for UID ${uid}:`, error);
    throw error;
  }
}

export async function updateUserProfile(
  uid: string,
  profileUpdateData: Partial<Omit<AppUserProfile, 'uid' | 'createdAt' | 'updatedAt'>>
): Promise<AppUserProfile | null> {
  ensureDbInitialized();
  try {
    const profileDocRef = doc(db!, USER_PROFILES_COLLECTION, uid);
    const updateData = {
      ...profileUpdateData,
      updatedAt: Timestamp.now(),
    };
    await updateDoc(profileDocRef, updateData);
    const updatedDocSnap = await getDoc(profileDocRef);
    if (updatedDocSnap.exists()) {
      return mapFirestoreDocToProfile(updatedDocSnap.id, updatedDocSnap.data());
    }
    return null;
  } catch (error) {
    console.error(`Error updating user profile for UID ${uid}:`, error);
    throw error;
  }
}

export async function getAllUserProfiles(): Promise<AppUserProfile[]> {
  ensureDbInitialized();
  try {
    const profilesRef = collection(db!, USER_PROFILES_COLLECTION);
    const querySnapshot = await getDocs(profilesRef);
    const profiles: AppUserProfile[] = [];
    querySnapshot.forEach((docSnap) => {
      profiles.push(mapFirestoreDocToProfile(docSnap.id, docSnap.data()));
    });
    return profiles;
  } catch (error) {
    console.error('Error fetching all user profiles:', error);
    throw error;
  }
}
