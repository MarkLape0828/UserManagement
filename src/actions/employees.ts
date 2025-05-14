
'use server';

import { z } from 'zod';
import type { Employee, AuditLogEntry, AddEmployeeFormData, EditEmployeeFormData } from '@/lib/schemas';
import { getUsers, type AppUser } from './auth'; // To link employees to users
import { getDepartments, type Department } from './departments'; // To link employees to departments

// In-memory store for demo purposes
let employees: Employee[] = [
  { id: 'EMP001', userId: '2', position: 'Software Engineer', departmentId: 'dept_2', hireDate: new Date('2023-01-15'), status: 'active' },
  { id: 'EMP002', userId: '3', position: 'HR Specialist', departmentId: 'dept_1', hireDate: new Date('2022-05-20'), status: 'active' },
  // Removed duplicate sample employee EMP003
];

let auditLog: AuditLogEntry[] = [];

function generateEmployeeId(): string {
  const prefix = "EMP";
  const nextId = employees.length > 0 ? Math.max(...employees.map(e => parseInt(e.id.substring(prefix.length), 10))) + 1 : 1;
  return `${prefix}${String(nextId).padStart(3, '0')}`;
}

// --- Audit Log ---
async function addAuditLogEntry(employeeId: string, action: string, details: string, changedByUserId: string): Promise<void> {
  const newLogEntry: AuditLogEntry = {
    id: `log_${Date.now()}_${auditLog.length + 1}`,
    employeeId,
    timestamp: new Date().toISOString(),
    action,
    details,
    changedByUserId,
  };
  auditLog.push(newLogEntry);
}

// --- Employee Data with User and Department Info ---
export interface EnrichedEmployee extends Employee {
  userEmail?: string;
  userName?: string; // firstName + lastName
  departmentName?: string;
}

export async function getEnrichedEmployees(): Promise<EnrichedEmployee[]> {
  const allUsers = await getUsers();
  const allDepartments = await getDepartments();

  return employees.map(emp => {
    const user = allUsers.find(u => u.id === emp.userId);
    const department = allDepartments.find(d => d.id === emp.departmentId);
    return {
      ...emp,
      userEmail: user?.email,
      userName: user ? `${user.firstName} ${user.lastName}` : 'N/A',
      departmentName: department?.name,
    };
  }).sort((a, b) => a.id.localeCompare(b.id));
}

export async function getEmployeeById(employeeId: string): Promise<Employee | undefined> {
  return employees.find(emp => emp.id === employeeId);
}

export async function getUsersNotYetEmployees(): Promise<AppUser[]> {
  const allUsers = await getUsers();
  const employeeUserIds = new Set(employees.map(e => e.userId));
  return allUsers.filter(user => !employeeUserIds.has(user.id) && user.role === 'employee'); // Only 'employee' role users for now
}


export async function addEmployee(data: AddEmployeeFormData, adminUserId: string): Promise<{ success: boolean; message: string; employee?: EnrichedEmployee }> {
  // Basic validation (more complex validation with Zod schema on client/server boundary)
  if (employees.some(e => e.userId === data.userId)) {
    return { success: false, message: 'This user is already registered as an employee.' };
  }

  const newEmployeeId = generateEmployeeId();
  const newEmployee: Employee = {
    id: newEmployeeId,
    ...data,
  };
  employees.push(newEmployee);

  await addAuditLogEntry(newEmployee.id, 'EMPLOYEE_CREATED', `Employee ${newEmployee.id} created.`, adminUserId);
  
  const enriched = (await getEnrichedEmployees()).find(e => e.id === newEmployee.id);
  return { success: true, message: 'Employee added successfully.', employee: enriched };
}

export async function updateEmployee(employeeId: string, data: EditEmployeeFormData, adminUserId: string): Promise<{ success: boolean; message: string; employee?: EnrichedEmployee }> {
  const employeeIndex = employees.findIndex(e => e.id === employeeId);
  if (employeeIndex === -1) {
    return { success: false, message: 'Employee not found.' };
  }

  const oldEmployee = { ...employees[employeeIndex] }; // Copy for audit
  const updatedEmployee: Employee = {
    ...employees[employeeIndex],
    ...data,
  };
  employees[employeeIndex] = updatedEmployee;

  // Audit logging for changes
  const changes: string[] = [];
  if (oldEmployee.position !== updatedEmployee.position) {
    changes.push(`Position: '${oldEmployee.position}' to '${updatedEmployee.position}'`);
  }
  if (oldEmployee.departmentId !== updatedEmployee.departmentId) {
    const oldDept = (await getDepartments()).find(d => d.id === oldEmployee.departmentId)?.name || oldEmployee.departmentId;
    const newDept = (await getDepartments()).find(d => d.id === updatedEmployee.departmentId)?.name || updatedEmployee.departmentId;
    changes.push(`Department: '${oldDept}' to '${newDept}'`);
  }
  if (oldEmployee.hireDate.toISOString() !== updatedEmployee.hireDate.toISOString()) {
     changes.push(`Hire Date: '${oldEmployee.hireDate.toLocaleDateString()}' to '${updatedEmployee.hireDate.toLocaleDateString()}'`);
  }
  if (oldEmployee.status !== updatedEmployee.status) {
    changes.push(`Status: '${oldEmployee.status}' to '${updatedEmployee.status}'`);
  }

  if (changes.length > 0) {
    await addAuditLogEntry(employeeId, 'EMPLOYEE_UPDATED', changes.join('; '), adminUserId);
  } else {
    // If no data changed, still log an attempt or skip. For now, we'll only log if data changed.
  }
  
  const enriched = (await getEnrichedEmployees()).find(e => e.id === updatedEmployee.id);
  return { success: true, message: 'Employee updated successfully.', employee: enriched };
}

// Placeholder for fetching audit log for an employee (to be used later)
// export async function getAuditLogForEmployee(employeeId: string): Promise<AuditLogEntry[]> {
//   return auditLog.filter(log => log.employeeId === employeeId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
// }

