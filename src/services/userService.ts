
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

export async function getUserByEmail(email: string): Promise<AppUser | null> {
  const usersRef = collection(db, USERS_COLLECTION);
  const q = query(usersRef, where('email', '==', email));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }
  const userDoc = querySnapshot.docs[0];
  return { id: userDoc.id, ...userDoc.data() } as AppUser;
}

export async function getUserById(userId: string): Promise<AppUser | null> {
  const userDocRef = doc(db, USERS_COLLECTION, userId);
  const userDocSnap = await getDoc(userDocRef);

  if (!userDocSnap.exists()) {
    return null;
  }
  return { id: userDocSnap.id, ...userDocSnap.data() } as AppUser;
}

export async function createUser(userData: Omit<AppUser, 'id'>): Promise<AppUser> {
  // In a real app, hash password here before saving if not using Firebase Auth
  const usersRef = collection(db, USERS_COLLECTION);
  const docRef = await addDoc(usersRef, userData);
  return { id: docRef.id, ...userData };
}

// Used for creating a user with a specific ID (e.g., initial admin)
export async function createUserWithId(userId: string, userData: Omit<AppUser, 'id'>): Promise<AppUser> {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(userDocRef, userData);
    return { id: userId, ...userData };
}


export async function adminUpdateUser(userId: string, userData: Partial<Omit<AppUser, 'id' | 'password'>>): Promise<AppUser | null> {
  const userDocRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(userDocRef, userData);
  const updatedUser = await getUserById(userId);
  return updatedUser;
}

export async function getAllUsers(): Promise<AppUser[]> {
  const usersRef = collection(db, USERS_COLLECTION);
  const querySnapshot = await getDocs(usersRef);
  const usersList: AppUser[] = [];
  querySnapshot.forEach((doc) => {
    usersList.push({ id: doc.id, ...doc.data() } as AppUser);
  });
  return usersList;
}
