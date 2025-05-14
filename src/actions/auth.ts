
'use server';

import { z } from 'zod';
import { LoginSchema, RegisterSchema, type LoginFormData, type RegisterFormData } from '@/lib/schemas';
import { setUserSession, clearUserSession, type UserSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ADMIN_DASHBOARD_PATH, EMPLOYEE_PROFILE_PATH } from '@/lib/constants';

// In-memory store for demo purposes. Replace with a database in a real app.
const users: UserSession[] = [
  { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
  { id: '2', name: 'Employee User', email: 'employee@example.com', role: 'employee' },
  { id: '3', name: 'User', email: 'user@example.com', role: 'employee' }, // Added new employee
  { id: '4', name: 'Admin', email: 'admin@example.com', role: 'admin' }, // Added new admin
];

export async function login(data: LoginFormData): Promise<{ success: boolean; message: string }> {
  const validation = LoginSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, message: 'Invalid input.' };
  }

  const { email, password } = validation.data;

  // Simulate database lookup
  const user = users.find((u) => u.email === email);

  // Simulate password check (in a real app, use hashed passwords)
  // For the new users, we'll use their specified passwords.
  let passwordMatch = false;
  if (user) {
    if (user.email === 'user@example.com' && password === 'userpass') {
      passwordMatch = true;
    } else if (user.email === 'admin@example.com' && password === 'amdminpass' && user.id === '4') { // Ensure we check the new admin
      passwordMatch = true;
    } else if (password === 'password123') { // Fallback for existing users
      passwordMatch = true;
    }
  }


  if (user && passwordMatch) { 
    await setUserSession(user);
    if (user.role === 'admin') {
      redirect(ADMIN_DASHBOARD_PATH);
    } else {
      redirect(EMPLOYEE_PROFILE_PATH);
    }
    // Note: redirect() throws an error, so the return below might not be reached.
    // It's good practice for server actions to return a serializable object.
    return { success: true, message: 'Logged in successfully.' }; 
  }

  return { success: false, message: 'Invalid email or password.' };
}

export async function register(data: RegisterFormData): Promise<{ success: boolean; message: string }> {
  const validation = RegisterSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, message: 'Invalid input.' };
  }

  const { name, email, password, role } = validation.data;

  // Simulate checking if user exists
  if (users.some((u) => u.email === email)) {
    return { success: false, message: 'User with this email already exists.' };
  }

  // Simulate creating new user
  const newUser: UserSession = {
    id: String(users.length + 1), // This will now be 5 if both new users are added before registration
    name,
    email,
    role,
  };
  users.push(newUser); // Add to in-memory store

  await setUserSession(newUser);
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

