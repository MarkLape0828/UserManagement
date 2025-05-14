
'use server';

import type { Employee, AuditLogEntry, AddEmployeeFormData, EditEmployeeFormData } from '@/lib/schemas';
import { getUsers as getAllAppUsers, type AppUser } from './auth'; 
import { getDepartments as getAllActiveDepartments, type Department } from './departments';
import { 
    getAllEmployees as fetchAllEmployees,
    getEmployeeById as fetchEmployeeById,
    createEmployee as persistEmployee,
    updateExistingEmployee as persistUpdateEmployee,
    createAuditLogEntry,
    // getAuditLogsForEmployee as fetchAuditLogs // To be used later
} from '@/services/employeeService';
import { getDepartmentById } from '@/services/departmentService'; // For enriching department name

// Data is now managed by Firestore via services. In-memory arrays are removed.

function generateEmployeeId(): string {
  const prefix = "EMP";
  // For Firestore, IDs are typically auto-generated or can be custom.
  // This function provides a consistent format if we decide to generate custom IDs.
  // For now, we'll let Firestore auto-generate IDs for employees,
  // but if a specific format is needed, this can be adapted.
  // For simplicity, we will generate a client-side unique ID for now.
  // A more robust solution might involve a Firestore counter or UUIDs.
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  const timestampSuffix = Date.now().toString().slice(-5);
  return `${prefix}${timestampSuffix}${randomSuffix}`;
}

// --- Audit Log ---
async function addAuditLog(employeeId: string, action: string, details: string, changedByUserId: string): Promise<void> {
  await createAuditLogEntry(employeeId, action, details, changedByUserId);
}

// --- Employee Data with User and Department Info ---
export interface EnrichedEmployee extends Employee {
  userEmail?: string;
  userName?: string; // firstName + lastName
  departmentName?: string;
}

export async function getEnrichedEmployees(): Promise<EnrichedEmployee[]> {
  const [allEmployees, allUsers, allDepartments] = await Promise.all([
    fetchAllEmployees(),
    getAllAppUsers(), // This fetches all users (already without passwords)
    getAllActiveDepartments() // This fetches all departments
  ]);

  return allEmployees.map(emp => {
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
  return await fetchEmployeeById(employeeId);
}

export async function getUsersNotYetEmployees(): Promise<AppUser[]> {
  const [allUsers, currentEmployees] = await Promise.all([
    getAllAppUsers(), // Fetches AppUser without password
    fetchAllEmployees()
  ]);
  const employeeUserIds = new Set(currentEmployees.map(e => e.userId));
  return allUsers.filter(user => !employeeUserIds.has(user.id) && user.role === 'employee');
}


export async function addEmployee(data: AddEmployeeFormData, adminUserId: string): Promise<{ success: boolean; message: string; employee?: EnrichedEmployee }> {
  const newEmployeeId = generateEmployeeId(); // Generate our custom formatted ID
  
  const createdEmployee = await persistEmployee(data, newEmployeeId);

  if (!createdEmployee) {
    // This can happen if the userId is already linked to an employee
    return { success: false, message: 'This user is already registered as an employee or an error occurred.' };
  }

  await addAuditLog(createdEmployee.id, 'EMPLOYEE_CREATED', `Employee ${createdEmployee.id} created.`, adminUserId);
  
  // Re-fetch enriched data to return the complete object
  const allUsers = await getAllAppUsers();
  const department = await getDepartmentById(createdEmployee.departmentId);

  const user = allUsers.find(u => u.id === createdEmployee.userId);
  const enrichedEmployee: EnrichedEmployee = {
      ...createdEmployee,
      userEmail: user?.email,
      userName: user ? `${user.firstName} ${user.lastName}` : 'N/A',
      departmentName: department?.name,
  };
  
  return { success: true, message: 'Employee added successfully.', employee: enrichedEmployee };
}

export async function updateEmployee(employeeId: string, data: EditEmployeeFormData, adminUserId: string): Promise<{ success: boolean; message: string; employee?: EnrichedEmployee }> {
  const oldEmployee = await fetchEmployeeById(employeeId);
  if (!oldEmployee) {
    return { success: false, message: 'Employee not found.' };
  }

  const updatedEmployee = await persistUpdateEmployee(employeeId, data);
  if (!updatedEmployee) {
    return { success: false, message: 'Failed to update employee record in the database.' };
  }

  // Audit logging for changes
  const changes: string[] = [];
  if (oldEmployee.position !== updatedEmployee.position) {
    changes.push(`Position: '${oldEmployee.position}' to '${updatedEmployee.position}'`);
  }
  if (oldEmployee.departmentId !== updatedEmployee.departmentId) {
    const oldDept = (await getDepartmentById(oldEmployee.departmentId))?.name || oldEmployee.departmentId;
    const newDept = (await getDepartmentById(updatedEmployee.departmentId))?.name || updatedEmployee.departmentId;
    changes.push(`Department: '${oldDept}' to '${newDept}'`);
  }
  
  const oldHireDateStr = oldEmployee.hireDate instanceof Date ? oldEmployee.hireDate.toLocaleDateString() : new Date(oldEmployee.hireDate).toLocaleDateString();
  const newHireDateStr = updatedEmployee.hireDate instanceof Date ? updatedEmployee.hireDate.toLocaleDateString() : new Date(updatedEmployee.hireDate).toLocaleDateString();
  if (oldHireDateStr !== newHireDateStr) {
     changes.push(`Hire Date: '${oldHireDateStr}' to '${newHireDateStr}'`);
  }

  if (oldEmployee.status !== updatedEmployee.status) {
    changes.push(`Status: '${oldEmployee.status}' to '${updatedEmployee.status}'`);
  }

  if (changes.length > 0) {
    await addAuditLog(employeeId, 'EMPLOYEE_UPDATED', changes.join('; '), adminUserId);
  }
  
  // Re-fetch enriched data
  const allUsers = await getAllAppUsers();
  const department = await getDepartmentById(updatedEmployee.departmentId);
  const user = allUsers.find(u => u.id === updatedEmployee.userId);
  
  const enrichedEmployee: EnrichedEmployee = {
    ...updatedEmployee,
    userEmail: user?.email,
    userName: user ? `${user.firstName} ${user.lastName}` : 'N/A',
    departmentName: department?.name,
  };

  return { success: true, message: 'Employee updated successfully.', employee: enrichedEmployee };
}
