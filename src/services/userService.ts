
'use server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import type { AppUser } from '@/actions/auth'; // Assuming AppUser includes password

const USERS_COLLECTION = 'users';

// IMPORTANT: Password Handling
// In a real application, passwords should NEVER be stored in plaintext.
// They should be hashed securely on the server before being stored.
// Firebase Authentication is the recommended way to handle users and passwords.
// For this prototype, we are storing plaintext passwords for simplicity.

function ensureDbInitialized() {
  if (!db) {
    console.error("FATAL: Firestore DB is not initialized in userService. Throwing error.");
    throw new Error("Database service is not available. Firebase initialization may have failed. Check server logs.");
  }
}

export async function getUserByEmail(email: string): Promise<AppUser | null> {
  ensureDbInitialized();
  const usersRef = collection(db!, USERS_COLLECTION);
  const q = query(usersRef, where('email', '==', email));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }
  const userDoc = querySnapshot.docs[0];
  return { id: userDoc.id, ...userDoc.data() } as AppUser;
}

export async function getUserById(userId: string): Promise<AppUser | null> {
  ensureDbInitialized();
  const userDocRef = doc(db!, USERS_COLLECTION, userId);
  const userDocSnap = await getDoc(userDocRef);

  if (!userDocSnap.exists()) {
    return null;
  }
  return { id: userDocSnap.id, ...userDocSnap.data() } as AppUser;
}

export async function createUser(userData: Omit<AppUser, 'id'>): Promise<AppUser> {
  ensureDbInitialized();
  // In a real app, hash password here before saving if not using Firebase Auth
  const usersRef = collection(db!, USERS_COLLECTION);
  const docRef = await addDoc(usersRef, userData);
  return { id: docRef.id, ...userData };
}

// Used for creating a user with a specific ID (e.g., initial admin)
export async function createUserWithId(userId: string, userData: Omit<AppUser, 'id'>): Promise<AppUser> {
    ensureDbInitialized();
    const userDocRef = doc(db!, USERS_COLLECTION, userId);
    await setDoc(userDocRef, userData);
    return { id: userId, ...userData };
}


export async function adminUpdateUser(userId: string, userData: Partial<Omit<AppUser, 'id' | 'password'>>): Promise<AppUser | null> {
  ensureDbInitialized();
  const userDocRef = doc(db!, USERS_COLLECTION, userId);
  await updateDoc(userDocRef, userData);
  // Re-fetch to ensure we return the complete, updated user object
  const updatedUserSnap = await getDoc(userDocRef);
  if (!updatedUserSnap.exists()) {
      // This case should ideally not happen if updateDoc didn't throw and ID is correct
      console.error(`User with ID ${userId} not found after update attempt.`);
      return null; 
  }
  return { id: updatedUserSnap.id, ...updatedUserSnap.data() } as AppUser;
}

export async function getAllUsers(): Promise<AppUser[]> {
  ensureDbInitialized();
  const usersRef = collection(db!, USERS_COLLECTION);
  const querySnapshot = await getDocs(usersRef);
  const usersList: AppUser[] = [];
  querySnapshot.forEach((doc) => {
    usersList.push({ id: doc.id, ...doc.data() } as AppUser);
  });
  return usersList;
}
