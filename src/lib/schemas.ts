import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export type LoginFormData = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  role: z.enum(['employee', 'admin'], { required_error: 'Role is required.' }),
});

export type RegisterFormData = z.infer<typeof RegisterSchema>;

export const AdminAddUserSchema = z.object({
  name: z.string().min(2, { message: 'Full name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  role: z.enum(['employee', 'admin'], { required_error: 'Role is required.' }),
});

export type AdminAddUserFormData = z.infer<typeof AdminAddUserSchema>;

export const AdminEditUserSchema = z.object({
  // ID is not part of the form but needed for the action
  // id: z.string(), 
  name: z.string().min(2, { message: 'Full name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  role: z.enum(['employee', 'admin'], { required_error: 'Role is required.' }),
  // Password is not directly edited here for simplicity, status is handled by toggle
});

export type AdminEditUserFormData = z.infer<typeof AdminEditUserSchema>;
