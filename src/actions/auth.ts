
'use server';

import { z } from 'zod';
import { LoginSchema, RegisterSchema, type LoginFormData, type RegisterFormData, AdminAddUserSchema, type AdminAddUserFormData, AdminEditUserSchema, type AdminEditUserFormData } from '@/lib/schemas';
import { setUserSession, clearUserSession, type UserSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ADMIN_DASHBOARD_PATH, EMPLOYEE_PROFILE_PATH } from '@/lib/constants';
import { auth as firebaseAuth } from '@/lib/firebase'; // Import Firebase Auth instance
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

// IMPORTANT: Data Persistence & Password Handling
// This version uses an IN-MEMORY array for storing user profile details (name, role, status).
// Passwords are now managed by Firebase Authentication.
// User profile data (first name, last name, role, status) will be RESET on server restart.
export interface AppUser extends Omit<UserSession, 'firstName' | 'lastName'> {
  firstName: string;
  lastName: string;
  status: 'active' | 'inactive';
  // Password is no longer stored here
}

// In-memory store for user profile details
let users: AppUser[] = [];

// Initial Admin User - Profile details.
// The actual Firebase Auth user (admin@example.com, password123) MUST BE CREATED MANUALLY in the Firebase Console.
const INITIAL_ADMIN_ID = 'initial-admin-user';
const INITIAL_ADMIN_EMAIL = 'admin@example.com';
const INITIAL_ADMIN_FIRSTNAME = 'Admin';
const INITIAL_ADMIN_LASTNAME = 'User';

// Function to ensure the initial admin's profile exists in the in-memory store
function ensureInitialAdminProfileExists() {
  if (!users.find(u => u.id === INITIAL_ADMIN_ID)) {
    users.push({
      id: INITIAL_ADMIN_ID,
      firstName: INITIAL_ADMIN_FIRSTNAME,
      lastName: INITIAL_ADMIN_LASTNAME,
      email: INITIAL_ADMIN_EMAIL,
      role: 'admin',
      status: 'active',
    });
    console.log(`Initial admin user profile for ${INITIAL_ADMIN_EMAIL} (ID: ${INITIAL_ADMIN_ID}) created in-memory. Ensure this user exists in Firebase Authentication.`);
  }
}
// Ensure admin profile exists when module is loaded
ensureInitialAdminProfileExists();


export async function login(data: LoginFormData): Promise<{ success: boolean; message: string }> {
  try {
    ensureInitialAdminProfileExists(); // Ensure local profile record for admin exists
    const validation = LoginSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, message: 'Invalid input.' };
    }

    const { email, password } = validation.data;

    if (!firebaseAuth) {
      console.error("[Login Action Error]: Firebase Auth is not initialized.");
      return { success: false, message: "Authentication service is unavailable." };
    }

    // Step 1: Authenticate with Firebase
    let firebaseUserCredential;
    try {
      firebaseUserCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    } catch (error: any) {
      console.error("[Login Action Error - Firebase Auth]:", error.code, error.message);
      // Map Firebase error codes to user-friendly messages
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        return { success: false, message: 'Invalid email or password.' };
      }
      return { success: false, message: 'Failed to authenticate with Firebase.' };
    }

    // Step 2: Find user profile in our in-memory store
    const appUser = users.find(u => u.email === email);

    if (appUser && appUser.status === 'active') {
      await setUserSession({
        id: appUser.id, // Using our internal ID for session
        firstName: appUser.firstName,
        lastName: appUser.lastName,
        email: appUser.email, // email from our record, should match Firebase
        role: appUser.role,
      });
      if (appUser.role === 'admin') {
        redirect(ADMIN_DASHBOARD_PATH);
      } else {
        redirect(EMPLOYEE_PROFILE_PATH);
      }
      return { success: true, message: 'Logged in successfully.' };
    } else if (appUser && appUser.status !== 'active') {
      return { success: false, message: 'Account is inactive.' };
    } else {
      // Authenticated with Firebase, but no local profile found (should not happen if register/addUserByAdmin is correct)
      console.warn(`User ${email} authenticated with Firebase but no local profile found.`);
      return { success: false, message: 'User profile not found after authentication.' };
    }

  } catch (error) {
    console.error("[Login Action Error - General]:", error);
    return { success: false, message: "An unexpected server error occurred during login." };
  }
}

export async function register(data: RegisterFormData): Promise<{ success: boolean; message: string }> {
  try {
    const validation = RegisterSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, message: 'Invalid input.' };
    }

    const { firstName, lastName, email, password, role } = validation.data;

    if (!firebaseAuth) {
      console.error("[Register Action Error]: Firebase Auth is not initialized.");
      return { success: false, message: "Authentication service is unavailable." };
    }

    // Step 1: Check if user already exists in our in-memory store by email
    if (users.find(u => u.email === email)) {
      return { success: false, message: 'User with this email already has a profile.' };
    }

    // Step 2: Create user in Firebase Authentication
    let firebaseUserCredential;
    try {
      firebaseUserCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    } catch (error: any) {
      console.error("[Register Action Error - Firebase Auth]:", error.code, error.message);
      if (error.code === 'auth/email-already-in-use') {
        return { success: false, message: 'This email is already registered with Firebase.' };
      }
      return { success: false, message: 'Failed to create user account with Firebase.' };
    }
    
    const firebaseUser = firebaseUserCredential.user;

    // Step 3: Create user profile in our in-memory store
    const newAppUser: AppUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, // Our internal ID
      firstName,
      lastName,
      email: firebaseUser.email!, // Use email from Firebase user
      role,
      status: 'active', // New users are active by default
    };
    users.push(newAppUser);

    await setUserSession({
      id: newAppUser.id,
      firstName: newAppUser.firstName,
      lastName: newAppUser.lastName,
      email: newAppUser.email,
      role: newAppUser.role,
    });

    if (newAppUser.role === 'admin') {
      redirect(ADMIN_DASHBOARD_PATH);
    } else {
      redirect(EMPLOYEE_PROFILE_PATH);
    }
    return { success: true, message: 'Registered successfully.' };
  } catch (error) {
    console.error("[Register Action Error - General]:", error);
    return { success: false, message: "An unexpected server error occurred during registration." };
  }
}

export async function logout(): Promise<void> {
  // For Firebase Auth, you might also want to call firebaseAuth.signOut() if managing client-side state
  // but since we manage session via cookie, clearing cookie is primary for server.
  await clearUserSession();
  redirect('/login');
}

// --- Admin User Management Actions ---

export async function getUsers(): Promise<AppUser[]> {
  try {
    // Return a copy to prevent direct mutation of the in-memory store
    return JSON.parse(JSON.stringify(users));
  } catch (error) {
    console.error("[GetUsers Action Error]:", error);
    return [];
  }
}

export async function addUserByAdmin(data: AdminAddUserFormData): Promise<{ success: boolean; message: string; user?: AppUser }> {
  try {
    const validation = AdminAddUserSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, message: 'Invalid input provided for adding user.' };
    }

    const { firstName, lastName, email, password, role } = validation.data;

    if (!firebaseAuth) {
      console.error("[AddUserByAdmin Action Error]: Firebase Auth is not initialized.");
      return { success: false, message: "Authentication service is unavailable." };
    }

    if (users.find(u => u.email === email)) {
      return { success: false, message: 'User with this email already has a profile in the local store.' };
    }
    
    // Step 1: Create user in Firebase Authentication
    let firebaseUserCredential;
    try {
      firebaseUserCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    } catch (error: any) {
      console.error("[AddUserByAdmin Action Error - Firebase Auth]:", error.code, error.message);
      if (error.code === 'auth/email-already-in-use') {
        return { success: false, message: 'This email is already registered with Firebase.' };
      }
      return { success: false, message: 'Failed to create user account with Firebase.' };
    }
    const firebaseUser = firebaseUserCredential.user;

    // Step 2: Create user profile in our in-memory store
    const newAppUser: AppUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      firstName,
      lastName,
      email: firebaseUser.email!,
      role,
      status: 'active',
    };
    users.push(newAppUser);
    
    return { success: true, message: 'User added successfully. Firebase account created and local profile stored.', user: newAppUser };
  } catch (error) {
    console.error("[AddUserByAdmin Action Error - General]:", error);
    return { success: false, message: "An unexpected server error occurred while adding the user." };
  }
}

export async function adminUpdateUserDetails(userId: string, data: AdminEditUserFormData): Promise<{ success: boolean; message: string; user?: AppUser }> {
   try {
    const validation = AdminEditUserSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, message: 'Invalid input for updating user.' };
    }

    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return { success: false, message: 'User profile not found in local store.' };
    }

    const { firstName, lastName, email, role, status } = validation.data;

    // Note: Changing email for a Firebase Auth user programmatically is complex and often requires re-authentication or Admin SDK.
    // This update only affects the local in-memory profile.
    // If email is changed here, it will mismatch the Firebase Auth email unless also changed there (manually or via Admin SDK).
    if (email && email !== users[userIndex].email) {
      if (users.some(u => u.email === email && u.id !== userId)) {
        return { success: false, message: 'Another user profile with this email already exists in the local store.' };
      }
      console.warn(`Email for user ${userId} changed in local store to ${email}, but Firebase Auth email remains ${users[userIndex].email}. Manual Firebase update needed if primary email should change.`);
    }
    
    users[userIndex] = {
      ...users[userIndex],
      firstName,
      lastName,
      email, // email from form
      role,
      status,
    };
    
    return { success: true, message: 'User local profile details updated.', user: users[userIndex] };
  } catch (error) {
    console.error("[AdminUpdateUserDetails Action Error]:", error);
    return { success: false, message: "An unexpected server error occurred while updating user details." };
  }
}
