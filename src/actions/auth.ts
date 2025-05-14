
'use server';

import { z } from 'zod';
import { LoginSchema, RegisterSchema, type LoginFormData, type RegisterFormData, AdminAddUserSchema, type AdminAddUserFormData, AdminEditUserSchema, type AdminEditUserFormData } from '@/lib/schemas';
import { setUserSession, clearUserSession, type UserSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ADMIN_DASHBOARD_PATH, EMPLOYEE_PROFILE_PATH } from '@/lib/constants';
import { getUserByEmail, createUser, getAllUsers, adminUpdateUser, createUserWithId } from '@/services/userService';

// Extended user type for internal management, UserSession is the shape for the cookie
// IMPORTANT: Password Handling
// In a real application, passwords should NEVER be stored in plaintext.
// They should be hashed securely on the server before being stored.
// Firebase Authentication is the recommended way to handle users and passwords.
// For this prototype, we are storing plaintext passwords for simplicity.
export interface AppUser extends Omit<UserSession, 'firstName' | 'lastName'> { 
  firstName: string;
  lastName: string;
  status: 'active' | 'inactive';
  password?: string; // Stored in plaintext for demo, DO NOT DO THIS IN PRODUCTION
}

// Admin user credentials (will be created in Firestore if it doesn't exist on first login)
const INITIAL_ADMIN_EMAIL = 'admin@example.com';
const INITIAL_ADMIN_PASSWORD = 'password123'; // Keep this simple for initial setup
const INITIAL_ADMIN_FIRSTNAME = 'Admin';
const INITIAL_ADMIN_LASTNAME = 'User';


export async function login(data: LoginFormData): Promise<{ success: boolean; message: string }> {
  const validation = LoginSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, message: 'Invalid input.' };
  }

  const { email, password } = validation.data;
  let user = await getUserByEmail(email);

  // Auto-create initial admin if it's the first login attempt for this user and they don't exist
  if (!user && email === INITIAL_ADMIN_EMAIL && password === INITIAL_ADMIN_PASSWORD) {
    console.log(`Admin user ${INITIAL_ADMIN_EMAIL} not found, creating...`);
    const newAdminData: Omit<AppUser, 'id'> = {
      firstName: INITIAL_ADMIN_FIRSTNAME,
      lastName: INITIAL_ADMIN_LASTNAME,
      email: INITIAL_ADMIN_EMAIL,
      role: 'admin',
      status: 'active',
      password: INITIAL_ADMIN_PASSWORD, // Store plaintext password
    };
    // Generate a predictable ID for the initial admin or let Firestore auto-generate.
    // For simplicity and ensuring it's always the same admin "account", we can try to use a fixed ID.
    // However, Firestore typically auto-generates IDs. For this auto-creation, we'll let it auto-generate.
    // Or, if we want a specific ID, we'd use a different service function like `createUserWithId`.
    // Let's use a more general ID for this first admin user.
    const adminId = 'initial-admin-user'; // Fixed ID for the first admin
    try {
        user = await createUserWithId(adminId, newAdminData); // Using a specific ID
        console.log(`Admin user ${INITIAL_ADMIN_EMAIL} created with ID ${user.id}.`);
    } catch (error) {
        console.error("Error creating initial admin user:", error);
        return { success: false, message: "Error setting up initial admin account." };
    }
  }


  if (user && user.password === password && user.status === 'active') {
    await setUserSession({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    });
    if (user.role === 'admin') {
      redirect(ADMIN_DASHBOARD_PATH);
    } else {
      redirect(EMPLOYEE_PROFILE_PATH);
    }
    return { success: true, message: 'Logged in successfully.' };
  }

  return { success: false, message: 'Invalid email or password, or account inactive.' };
}

export async function register(data: RegisterFormData): Promise<{ success: boolean; message: string }> {
  const validation = RegisterSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, message: 'Invalid input.' };
  }

  const { firstName, lastName, email, password, role } = validation.data;

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return { success: false, message: 'User with this email already exists.' };
  }

  const newUserDate: Omit<AppUser, 'id'> = {
    firstName,
    lastName,
    email,
    role,
    status: 'active', // New users are active by default
    password, // Store password directly for demo
  };
  
  let newUser;
  try {
    newUser = await createUser(newUserDate);
  } catch (error) {
    console.error("Error registering user:", error);
    return { success: false, message: "Failed to register user due to a server error."};
  }


  await setUserSession({
    id: newUser.id,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    email: newUser.email,
    role: newUser.role,
  });

  if (newUser.role === 'admin') {
    redirect(ADMIN_DASHBOARD_PATH);
  } else {
    redirect(EMPLOYEE_PROFILE_PATH);
  }
  return { success: true, message: 'Registered successfully.' };
}

export async function logout(): Promise<void> {
  await clearUserSession();
  redirect('/login');
}

// --- Admin User Management Actions ---

export async function getUsers(): Promise<AppUser[]> {
  const usersFromDb = await getAllUsers();
  // Remove password before sending to client
  return usersFromDb.map(u => {
    const { password, ...userWithoutPassword } = u;
    return userWithoutPassword;
  });
}

export async function addUserByAdmin(data: AdminAddUserFormData): Promise<{ success: boolean; message: string; user?: AppUser }> {
  const validation = AdminAddUserSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, message: 'Invalid input provided for adding user.' };
  }

  const { firstName, lastName, email, password, role } = validation.data;

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return { success: false, message: 'User with this email already exists.' };
  }

  const newUserPayload: Omit<AppUser, 'id'> = {
    firstName,
    lastName,
    email,
    role,
    status: 'active',
    password, // Storing plaintext password
  };

  let createdUser;
  try {
    createdUser = await createUser(newUserPayload);
  } catch (error) {
     console.error("Error adding user by admin:", error);
     return { success: false, message: "Failed to add user due to a server error." };
  }
  

  const { password: _, ...newUserClientSafe } = createdUser;
  return { success: true, message: 'User added successfully.', user: newUserClientSafe };
}


export async function adminUpdateUserDetails(userId: string, data: AdminEditUserFormData): Promise<{ success: boolean; message: string; user?: AppUser }> {
   const validation = AdminEditUserSchema.safeParse(data);
   if (!validation.success) {
     return { success: false, message: 'Invalid input for updating user.' };
   }

   const currentUser = await getUserById(userId);
   if (!currentUser) {
     return { success: false, message: 'User not found.' };
   }

   const { firstName, lastName, email, role, status } = validation.data;

   // Ensure email uniqueness if changed
   if (email && email !== currentUser.email) {
     const existingUserWithEmail = await getUserByEmail(email);
     if (existingUserWithEmail && existingUserWithEmail.id !== userId) {
       return { success: false, message: 'Another user with this email already exists.' };
     }
   }
   
   const updatePayload: Partial<Omit<AppUser, 'id' | 'password'>> = {
     firstName,
     lastName,
     email,
     role,
     status,
   };

  let updatedUser;
  try {
    updatedUser = await adminUpdateUser(userId, updatePayload);
    if (!updatedUser) {
        return { success: false, message: 'User not found after update.' };
    }
  } catch (error) {
    console.error("Error updating user details by admin:", error);
    return { success: false, message: "Failed to update user due to a server error." };
  }

   const { password: _, ...updatedUserClientSafe } = updatedUser;
   return { success: true, message: 'User details updated.', user: updatedUserClientSafe };
}
