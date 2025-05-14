
'use server';

import { z } from 'zod';
import { LoginSchema, RegisterSchema, type LoginFormData, type RegisterFormData, AdminAddUserSchema, type AdminAddUserFormData, AdminEditUserSchema, type AdminEditUserFormData } from '@/lib/schemas';
import { setUserSession, clearUserSession, type UserSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ADMIN_DASHBOARD_PATH, EMPLOYEE_PROFILE_PATH } from '@/lib/constants';

// IMPORTANT: Password Handling & Data Persistence
// This version uses an IN-MEMORY array for users. Data will be RESET on server restart.
// Passwords are stored in plaintext for simplicity. DO NOT DO THIS IN PRODUCTION.
export interface AppUser extends Omit<UserSession, 'firstName' | 'lastName'> {
  firstName: string;
  lastName: string;
  status: 'active' | 'inactive';
  password?: string; 
}

// In-memory store for users
let users: AppUser[] = [];

// Initial Admin User - This user will be available by default.
const INITIAL_ADMIN_ID = 'initial-admin-user';
const INITIAL_ADMIN_EMAIL = 'admin@example.com';
const INITIAL_ADMIN_PASSWORD = 'password123';
const INITIAL_ADMIN_FIRSTNAME = 'Admin';
const INITIAL_ADMIN_LASTNAME = 'User';

// Function to ensure the initial admin exists in the in-memory store
function ensureInitialAdminExists() {
  if (!users.find(u => u.id === INITIAL_ADMIN_ID)) {
    users.push({
      id: INITIAL_ADMIN_ID,
      firstName: INITIAL_ADMIN_FIRSTNAME,
      lastName: INITIAL_ADMIN_LASTNAME,
      email: INITIAL_ADMIN_EMAIL,
      role: 'admin',
      status: 'active',
      password: INITIAL_ADMIN_PASSWORD,
    });
    console.log(`Initial admin user ${INITIAL_ADMIN_EMAIL} (ID: ${INITIAL_ADMIN_ID}) created in-memory.`);
  }
}
// Ensure admin exists when module is loaded (e.g., on server start)
ensureInitialAdminExists();


export async function login(data: LoginFormData): Promise<{ success: boolean; message: string }> {
  try {
    ensureInitialAdminExists(); // Ensure admin is there on login attempt
    const validation = LoginSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, message: 'Invalid input.' };
    }

    const { email, password } = validation.data;
    const user = users.find(u => u.email === email);

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
  } catch (error) {
    console.error("[Login Action Error]:", error);
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

    if (users.find(u => u.email === email)) {
      return { success: false, message: 'User with this email already exists.' };
    }

    const newUser: AppUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, // Generate unique ID
      firstName,
      lastName,
      email,
      role,
      status: 'active', // New users are active by default
      password,
    };
    users.push(newUser);

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
  } catch (error) {
    console.error("[Register Action Error]:", error);
    return { success: false, message: "An unexpected server error occurred during registration." };
  }
}

export async function logout(): Promise<void> {
  await clearUserSession();
  redirect('/login');
}

// --- Admin User Management Actions ---

export async function getUsers(): Promise<AppUser[]> {
  try {
    // Return a copy to prevent direct mutation of the in-memory store
    return JSON.parse(JSON.stringify(users.map(u => {
      const { password, ...userWithoutPassword } = u; // Don't send password to client
      return userWithoutPassword;
    })));
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

    if (users.find(u => u.email === email)) {
      return { success: false, message: 'User with this email already exists.' };
    }

    const newUser: AppUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      firstName,
      lastName,
      email,
      password,
      role,
      status: 'active',
    };
    users.push(newUser);
    
    const { password: _, ...newUserClientSafe } = newUser;
    return { success: true, message: 'User added successfully.', user: newUserClientSafe };
  } catch (error) {
    console.error("[AddUserByAdmin Action Error]:", error);
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
      return { success: false, message: 'User not found.' };
    }

    const { firstName, lastName, email, role, status } = validation.data;

    // Ensure email uniqueness if changed
    if (email && email !== users[userIndex].email) {
      if (users.some(u => u.email === email && u.id !== userId)) {
        return { success: false, message: 'Another user with this email already exists.' };
      }
    }
    
    users[userIndex] = {
      ...users[userIndex],
      firstName,
      lastName,
      email,
      role,
      status,
    };
    
    const { password: _, ...updatedUserClientSafe } = users[userIndex];
    return { success: true, message: 'User details updated.', user: updatedUserClientSafe };
  } catch (error) {
    console.error("[AdminUpdateUserDetails Action Error]:", error);
    return { success: false, message: "An unexpected server error occurred while updating user details." };
  }
}
