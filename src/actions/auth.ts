
'use server';

import { z } from 'zod';
import { LoginSchema, RegisterSchema, type LoginFormData, type RegisterFormData, type AdminAddUserFormData, AdminEditUserSchema, type AdminEditUserFormData } from '@/lib/schemas';
import { setUserSession, clearUserSession, type UserSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ADMIN_DASHBOARD_PATH, EMPLOYEE_PROFILE_PATH } from '@/lib/constants';

// Extended user type for internal management, UserSession is the shape for the cookie
export interface AppUser extends UserSession {
  status: 'active' | 'inactive';
  password?: string; // In a real app, this would be a hashedPassword
}

// In-memory store for demo purposes. Replace with a database in a real app.
const users: AppUser[] = [
  { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin', status: 'active', password: 'password123' },
  { id: '2', name: 'Employee User', email: 'employee@example.com', role: 'employee', status: 'active', password: 'password123' },
  { id: '3', name: 'User One', email: 'user@example.com', role: 'employee', status: 'active', password: 'userpass' },
  { id: '4', name: 'Admin Two', email: 'admin2@example.com', role: 'admin', status: 'active', password: 'amdminpass' }, 
];

export async function login(data: LoginFormData): Promise<{ success: boolean; message: string }> {
  const validation = LoginSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, message: 'Invalid input.' };
  }

  const { email, password } = validation.data;
  const user = users.find((u) => u.email === email && u.status === 'active');

  if (user && user.password === password) { 
    await setUserSession({
      id: user.id,
      name: user.name,
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

  const { name, email, password, role } = validation.data;

  if (users.some((u) => u.email === email)) {
    return { success: false, message: 'User with this email already exists.' };
  }

  const newUser: AppUser = {
    id: String(users.length + 1 + Date.now()), // More unique ID
    name,
    email,
    role,
    status: 'active', // New users are active by default
    password, // Store password directly for demo
  };
  users.push(newUser);

  await setUserSession({
    id: newUser.id,
    name: newUser.name,
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
  // In a real app, this would fetch from a database
  // For now, return a copy to prevent direct mutation if the array is passed around.
  return JSON.parse(JSON.stringify(users.map(u => {
    const { password, ...userWithoutPassword } = u; // Don't send password to client
    return userWithoutPassword;
  })));
}

export async function addUserByAdmin(data: AdminAddUserFormData): Promise<{ success: boolean; message: string; user?: AppUser }> {
  const validation = AdminAddUserSchema.safeParse(data);
  if (!validation.success) {
    // This case should ideally be caught by client-side validation, but good to have a server check.
    return { success: false, message: 'Invalid input provided for adding user.' };
  }
  
  const { name, email, password, role } = validation.data;

  if (users.some((u) => u.email === email)) {
    return { success: false, message: 'User with this email already exists.' };
  }

  const newUser: AppUser = {
    id: String(users.length + 1 + Date.now()), 
    name,
    email,
    role,
    status: 'active', 
    password, 
  };
  users.push(newUser);

  const { password: _, ...newUserClientSafe } = newUser;

  return { success: true, message: 'User added successfully.', user: newUserClientSafe };
}

export async function adminUpdateUserStatus(userId: string, newStatus: 'active' | 'inactive'): Promise<{ success: boolean; message: string }> {
  const user = users.find(u => u.id === userId);
  if (!user) {
    return { success: false, message: 'User not found.' };
  }
  user.status = newStatus;
  return { success: true, message: `User status updated to ${newStatus}.` };
}

export async function adminUpdateUserDetails(userId: string, data: AdminEditUserFormData): Promise<{ success: boolean; message: string; user?: AppUser }> {
   const validation = AdminEditUserSchema.safeParse(data);
   if (!validation.success) {
     return { success: false, message: 'Invalid input for updating user.' };
   }

   const userIndex = users.findIndex(u => u.id === userId);
   if (userIndex === -1) {
     return { success: false, message: 'User not found.' };
   }
 
   const { name, email, role } = validation.data;
 
   // Ensure email uniqueness if changed
   if (email && email !== users[userIndex].email) {
     if (users.some(u => u.email === email && u.id !== userId)) {
       return { success: false, message: 'Another user with this email already exists.' };
     }
   }
   
   users[userIndex] = { 
     ...users[userIndex], 
     name: name ?? users[userIndex].name,
     email: email ?? users[userIndex].email,
     role: role ?? users[userIndex].role,
     // status and password are not changed here
   };
   
   const { password, ...updatedUserClientSafe } = users[userIndex];
   return { success: true, message: 'User details updated.', user: updatedUserClientSafe };
}
