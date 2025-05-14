
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

// Department Schemas
export const DepartmentSchema = z.object({
  id: z.string(),
  name: z.string().min(1, { message: 'Department name is required.' }).max(100, { message: 'Department name cannot exceed 100 characters.' }),
  nameLower: z.string().optional(), // For case-insensitive queries
  status: z.enum(['active', 'inactive']),
  createdAt: z.any().optional(), // Firestore Timestamp or Date
  updatedAt: z.any().optional(), // Firestore Timestamp or Date
});
export type Department = z.infer<typeof DepartmentSchema>;

export const AddDepartmentSchema = z.object({
  name: z.string().min(1, { message: 'Department name is required.' }).max(100, { message: 'Department name cannot exceed 100 characters.' }),
});
export type AddDepartmentFormData = z.infer<typeof AddDepartmentSchema>;

export const EditDepartmentSchema = z.object({
  name: z.string().min(1, { message: 'Department name is required.' }).max(100, { message: 'Department name cannot exceed 100 characters.' }).optional(),
  status: z.enum(['active', 'inactive'], { required_error: 'Status is required.' }).optional(),
});
export type EditDepartmentFormData = z.infer<typeof EditDepartmentSchema>;


// Employee Schemas
export const EmployeeStatusSchema = z.enum(['active', 'inactive', 'on_leave']);
export type EmployeeStatus = z.infer<typeof EmployeeStatusSchema>;

export const EmployeeSchema = z.object({
  id: z.string(), // Employee-specific ID, e.g., EMP001
  userId: z.string(), // Links to AppUser.id
  position: z.string().min(1, "Position is required.").max(100),
  departmentId: z.string().min(1, "Department is required."),
  hireDate: z.date({ // Will be JS Date object after conversion from Firestore Timestamp
    required_error: "Hire date is required.",
    invalid_type_error: "Invalid date format for hire date.",
  }),
  status: EmployeeStatusSchema,
  createdAt: z.any().optional(), // Firestore Timestamp or Date
  updatedAt: z.any().optional(), // Firestore Timestamp or Date
});
export type Employee = z.infer<typeof EmployeeSchema>;

export const AddEmployeeSchema = z.object({
  userId: z.string().min(1, "User account is required."),
  position: z.string().min(1, "Position is required.").max(100),
  departmentId: z.string().min(1, "Department is required."),
  hireDate: z.date({ // Expecting JS Date from the form
    required_error: "Hire date is required.",
    invalid_type_error: "Invalid date format for hire date.",
  }),
  status: EmployeeStatusSchema.default('active'),
});
export type AddEmployeeFormData = z.infer<typeof AddEmployeeSchema>;

export const EditEmployeeSchema = z.object({
  position: z.string().min(1, "Position is required.").max(100),
  departmentId: z.string().min(1, "Department is required."),
  hireDate: z.date({ // Expecting JS Date from the form
    required_error: "Hire date is required.",
    invalid_type_error: "Invalid date format for hire date.",
  }),
  status: EmployeeStatusSchema,
});
export type EditEmployeeFormData = z.infer<typeof EditEmployeeSchema>;


// Audit Log Schema
export const AuditLogEntrySchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  timestamp: z.string(), // Should be ISO datetime string after conversion
  action: z.string(), 
  details: z.string(), 
  changedByUserId: z.string(),
});
export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;
