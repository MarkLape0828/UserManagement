
'use server';

import { z } from 'zod';
import { LoginSchema, RegisterSchema, type LoginFormData, type RegisterFormData, AdminAddUserSchema, type AdminAddUserFormData, AdminEditUserSchema, type AdminEditUserFormData } from '@/lib/schemas';
import { setUserSession, clearUserSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ADMIN_DASHBOARD_PATH, EMPLOYEE_PROFILE_PATH } from '@/lib/constants';
import { auth as firebaseAuth } from '@/lib/firebase'; // Import Firebase Auth instance
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { 
  getUserProfileById, 
  getUserProfileByEmail, 
  createUserProfile, 
  updateUserProfile, 
  getAllUserProfiles,
  type AppUserProfile 
} from '@/services/userService'; // Updated imports

// In-memory user store is REMOVED. Data will be in Firestore.

const INITIAL_ADMIN_EMAIL = 'admin@example.com';
const INITIAL_ADMIN_FIRSTNAME = 'Admin';
const INITIAL_ADMIN_LASTNAME = 'User';


export async function login(data: LoginFormData): Promise<{ success: boolean; message: string }> {
  try {
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
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        return { success: false, message: 'Invalid email or password.' };
      }
      return { success: false, message: 'Failed to authenticate with Firebase.' };
    }
    
    const firebaseUser = firebaseUserCredential.user;

    // Step 2: Fetch user profile from Firestore
    let appUserProfile = await getUserProfileById(firebaseUser.uid);

    // Special handling for initial admin: if profile doesn't exist, create it.
    if (!appUserProfile && email === INITIAL_ADMIN_EMAIL) {
      console.log(`Profile for initial admin ${email} not found in Firestore. Creating...`);
      try {
        appUserProfile = await createUserProfile(firebaseUser.uid, {
          firstName: INITIAL_ADMIN_FIRSTNAME,
          lastName: INITIAL_ADMIN_LASTNAME,
          email: firebaseUser.email!,
          role: 'admin',
          status: 'active',
        });
        console.log(`Profile for initial admin ${email} created in Firestore.`);
      } catch (profileError) {
        console.error(`Failed to create Firestore profile for initial admin ${email}:`, profileError);
        // Log out the Firebase user as we couldn't set up their profile
        if (firebaseAuth.currentUser) await firebaseAuth.signOut();
        return { success: false, message: 'Admin setup failed. Could not create profile.' };
      }
    }

    if (appUserProfile && appUserProfile.status === 'active') {
      await setUserSession({
        id: appUserProfile.uid, // Use Firestore UID for session ID
        firstName: appUserProfile.firstName,
        lastName: appUserProfile.lastName,
        email: appUserProfile.email,
        role: appUserProfile.role,
      });
      if (appUserProfile.role === 'admin') {
        redirect(ADMIN_DASHBOARD_PATH);
      } else {
        redirect(EMPLOYEE_PROFILE_PATH);
      }
      return { success: true, message: 'Logged in successfully.' };
    } else if (appUserProfile && appUserProfile.status !== 'active') {
      // Log out the Firebase user if their app profile is inactive
      if (firebaseAuth.currentUser) await firebaseAuth.signOut();
      return { success: false, message: 'Account is inactive.' };
    } else {
      // Authenticated with Firebase, but no app profile found (and not the initial admin case)
      console.warn(`User ${email} authenticated with Firebase but no app profile found in Firestore.`);
      if (firebaseAuth.currentUser) await firebaseAuth.signOut();
      return { success: false, message: 'User application profile not found.' };
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

    // Step 1: Check if user profile already exists in Firestore by email (optional, Firebase handles email uniqueness)
    const existingProfile = await getUserProfileByEmail(email);
    if (existingProfile) {
      return { success: false, message: 'User with this email already has a profile.' };
    }

    // Step 2: Create user in Firebase Authentication
    let firebaseUserCredential;
    try {
      firebaseUserCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    } catch (error: any) {
      console.error("[Register Action Error - Firebase Auth]:", error.code, error.message);
      if (error.code === 'auth/email-already-in-use') {
        return { success: false, message: 'This email is already registered.' };
      }
      return { success: false, message: 'Failed to create Firebase user account.' };
    }
    
    const firebaseUser = firebaseUserCredential.user;

    // Step 3: Create user profile in Firestore
    let newAppUserProfile;
    try {
      newAppUserProfile = await createUserProfile(firebaseUser.uid, {
        firstName,
        lastName,
        email: firebaseUser.email!,
        role,
        status: 'active',
      });
    } catch (profileError) {
      console.error(`Failed to create Firestore profile for new user ${email}:`, profileError);
      // Potentially delete the Firebase Auth user if profile creation fails (complex, needs careful handling)
      return { success: false, message: 'Firebase account created, but failed to create application profile.' };
    }
    
    if (!newAppUserProfile) {
        return { success: false, message: 'Failed to create application profile after Firebase registration.' };
    }

    await setUserSession({
      id: newAppUserProfile.uid,
      firstName: newAppUserProfile.firstName,
      lastName: newAppUserProfile.lastName,
      email: newAppUserProfile.email,
      role: newAppUserProfile.role,
    });

    if (newAppUserProfile.role === 'admin') {
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
  try {
    if (firebaseAuth && firebaseAuth.currentUser) {
      await firebaseAuth.signOut();
    }
  } catch (error) {
    console.error("Error signing out from Firebase:", error);
    // Continue to clear cookie session even if Firebase signout fails
  }
  await clearUserSession();
  redirect('/login');
}

// --- Admin User Management Actions ---

// Returns AppUserProfile[] which includes uid, createdAt, updatedAt
export async function getUsers(): Promise<AppUserProfile[]> {
  try {
    return await getAllUserProfiles();
  } catch (error) {
    console.error("[GetUsers Action Error]:", error);
    return []; // Return empty array on error
  }
}

export async function addUserByAdmin(data: AdminAddUserFormData): Promise<{ success: boolean; message: string; user?: AppUserProfile }> {
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

    const existingProfile = await getUserProfileByEmail(email);
    if (existingProfile) {
      return { success: false, message: 'User with this email already has a profile.' };
    }
    
    // Step 1: Create user in Firebase Authentication
    // We need to temporarily sign out any current admin to create a new user, then sign admin back in. This is a Firebase client SDK limitation.
    // Ideally, admin operations use Firebase Admin SDK on a backend.
    // For this client-side approach, it's complex. A simpler approach: admin creates user, tells them to set password via "Forgot Password" flow.
    // Or, for now, we'll assume this is for a system where admin setting initial password is okay.
    // THIS IS A SIMPLIFICATION AND HAS SECURITY IMPLICATIONS IF NOT HANDLED CAREFULLY.
    let firebaseUserCredential;
    try {
      // This operation (createUserWithEmailAndPassword) signs in the new user.
      // This is problematic if an admin is performing this.
      // For true admin "add user", Firebase Admin SDK is required.
      // Let's proceed with the caveat that this isn't ideal for multi-admin scenarios from client.
      firebaseUserCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    } catch (error: any) {
      console.error("[AddUserByAdmin Action Error - Firebase Auth]:", error.code, error.message);
      if (error.code === 'auth/email-already-in-use') {
        return { success: false, message: 'This email is already registered with Firebase.' };
      }
      // It's possible the error is due to admin already being signed in.
      // This part is tricky with client SDK.
      return { success: false, message: 'Failed to create Firebase user account. Ensure you are not logged in or try again.' };
    }
    const firebaseUser = firebaseUserCredential.user;

    // Step 2: Create user profile in Firestore
    let newAppUserProfile;
    try {
        newAppUserProfile = await createUserProfile(firebaseUser.uid, {
        firstName,
        lastName,
        email: firebaseUser.email!,
        role,
        status: 'active',
      });
    } catch (profileError) {
        console.error(`Failed to create Firestore profile for user ${email} added by admin:`, profileError);
        // Consider cleaning up the Firebase Auth user here if profile creation fails.
        return { success: false, message: 'Firebase account created, but failed to create application profile.' };
    }

    // After creating the user, the new user is now signed in via Firebase.
    // The admin needs to be signed back in. This flow is problematic.
    // For simplicity, we'll assume the admin has to log back in after adding a user if they want to continue admin tasks.
    // OR we don't sign out the current user here but this isn't standard createUserWithEmailAndPassword behavior.
    // For the prototype, we'll let the new user be signed in and the admin will effectively be "logged out" of Firebase Auth.
    // The cookie session of the admin remains until they explicitly log out via UI or it expires.

    if (!newAppUserProfile) {
      return { success: false, message: 'Failed to create application profile for user added by admin.' };
    }
    
    return { success: true, message: 'User added successfully. Firebase account created and Firestore profile stored.', user: newAppUserProfile };
  } catch (error) {
    console.error("[AddUserByAdmin Action Error - General]:", error);
    return { success: false, message: "An unexpected server error occurred while adding the user." };
  }
}

export async function adminUpdateUserDetails(userId: string, data: AdminEditUserFormData): Promise<{ success: boolean; message: string; user?: AppUserProfile }> {
   try {
    const validation = AdminEditUserSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, message: 'Invalid input for updating user.' };
    }

    // userId here is the Firebase UID.
    const existingProfile = await getUserProfileById(userId);
    if (!existingProfile) {
      return { success: false, message: 'User profile not found in Firestore.' };
    }

    const { firstName, lastName, email, role, status } = validation.data;
    
    // Check for email conflict if email is being changed
    if (email && email !== existingProfile.email) {
      const conflictingProfile = await getUserProfileByEmail(email);
      if (conflictingProfile && conflictingProfile.uid !== userId) {
        return { success: false, message: 'Another user profile with this email already exists.' };
      }
      // Note: Changing email in Firestore profile does NOT change it in Firebase Auth.
      // This requires Firebase Admin SDK or user re-authentication.
      // For this prototype, we'll update Firestore only and log a warning.
      console.warn(`Email for user ${userId} changed in Firestore to ${email}. Firebase Auth email remains ${existingProfile.email}. This requires separate Firebase Auth update.`);
    }
    
    const updatedProfile = await updateUserProfile(userId, {
      firstName,
      lastName,
      email, // Email from form
      role,
      status,
    });
    
    if (!updatedProfile) {
        return { success: false, message: 'Failed to update user profile in Firestore.' };
    }
    
    return { success: true, message: 'User Firestore profile details updated.', user: updatedProfile };
  } catch (error) {
    console.error("[AdminUpdateUserDetails Action Error]:", error);
    return { success: false, message: "An unexpected server error occurred while updating user details." };
  }
}

// Helper to map AppUserProfile to the old AppUser structure if needed by client, for smoother transition.
// However, it's better for clients to adapt to AppUserProfile.
// For UserManagementTable, it expects AppUser with 'id'.
// AppUserProfile has 'uid'.
// So, UserManagementTable will need to be updated to use `user.uid` as key and for passing to edit.
// And it will expect AppUserProfile[] from getUsers().
// The fields (firstName, lastName, email, role, status) are compatible.
    