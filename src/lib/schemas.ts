
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
  status: z.enum(['active', 'inactive']),
  employeeCount: z.number().optional(), // Optional, as it's a placeholder for now
});
export type Department = z.infer<typeof DepartmentSchema>;

export const AddDepartmentSchema = z.object({
  name: z.string().min(1, { message: 'Department name is required.' }).max(100, { message: 'Department name cannot exceed 100 characters.' }),
});
export type AddDepartmentFormData = z.infer<typeof AddDepartmentSchema>;

export const EditDepartmentSchema = z.object({
  name: z.string().min(1, { message: 'Department name is required.' }).max(100, { message: 'Department name cannot exceed 100 characters.' }),
  status: z.enum(['active', 'inactive'], { required_error: 'Status is required.' }),
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
  hireDate: z.date({
    required_error: "Hire date is required.",
    invalid_type_error: "Invalid date format for hire date.",
  }),
  status: EmployeeStatusSchema,
});
export type Employee = z.infer<typeof EmployeeSchema>;

export const AddEmployeeSchema = z.object({
  userId: z.string().min(1, "User account is required."),
  position: z.string().min(1, "Position is required.").max(100),
  departmentId: z.string().min(1, "Department is required."),
  hireDate: z.date({
    required_error: "Hire date is required.",
    invalid_type_error: "Invalid date format for hire date.",
  }),
  status: EmployeeStatusSchema.default('active'),
});
export type AddEmployeeFormData = z.infer<typeof AddEmployeeSchema>;

export const EditEmployeeSchema = z.object({
  // userId is not editable directly here as it links the employee record to a user account
  position: z.string().min(1, "Position is required.").max(100),
  departmentId: z.string().min(1, "Department is required."),
  hireDate: z.date({
    required_error: "Hire date is required.",
    invalid_type_error: "Invalid date format for hire date.",
  }),
  status: EmployeeStatusSchema,
});
export type EditEmployeeFormData = z.infer<typeof EditEmployeeSchema>;


// Audit Log Schema (for footprint)
export const AuditLogEntrySchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  timestamp: z.string(), // ISO datetime string
  action: z.string(), // e.g., "EMPLOYEE_CREATED", "DEPARTMENT_TRANSFER", "STATUS_CHANGE"
  details: z.string(), // Could be a JSON string of { field, oldValue, newValue } or a descriptive message
  changedByUserId: z.string(), // Admin user ID who made the change
});
export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;
