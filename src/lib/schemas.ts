
import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export type LoginFormData = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required.' }).max(50, { message: 'First name cannot exceed 50 characters.' }),
  lastName: z.string().min(1, { message: 'Last name is required.' }).max(50, { message: 'Last name cannot exceed 50 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  role: z.enum(['employee', 'admin'], { required_error: 'Role is required.' }),
});

export type RegisterFormData = z.infer<typeof RegisterSchema>;

export const AdminAddUserSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required.' }).max(50, { message: 'First name cannot exceed 50 characters.' }),
  lastName: z.string().min(1, { message: 'Last name is required.' }).max(50, { message: 'Last name cannot exceed 50 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  role: z.enum(['employee', 'admin'], { required_error: 'Role is required.' }),
});

export type AdminAddUserFormData = z.infer<typeof AdminAddUserSchema>;

export const AdminEditUserSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required.' }).max(50, { message: 'First name cannot exceed 50 characters.' }),
  lastName: z.string().min(1, { message: 'Last name is required.' }).max(50, { message: 'Last name cannot exceed 50 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  role: z.enum(['employee', 'admin'], { required_error: 'Role is required.' }),
  status: z.enum(['active', 'inactive'], { required_error: 'Status is required.'}),
});

export type AdminEditUserFormData = z.infer<typeof AdminEditUserSchema>;
