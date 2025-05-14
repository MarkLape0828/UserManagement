
'use server';

import type { Employee, AuditLogEntry, AddEmployeeFormData, EditEmployeeFormData } from '@/lib/schemas';
import { getUsers as getAllAppUsers, type AppUser } from './auth'; 
import { getDepartments as getAllActiveDepartments } from './departments'; // Import corrected path
import { 
    getAllEmployees as fetchAllEmployeesService,
    getEmployeeById as fetchEmployeeByIdService,
    createEmployee as persistEmployeeService,
    updateExistingEmployee as persistUpdateEmployeeService,
    createAuditLogEntry as createAuditLogEntryService,
    // getAuditLogsForEmployee as fetchAuditLogs // To be used later
} from '@/services/employeeService';
import { getDepartmentById as getDepartmentByIdService } from '@/services/departmentService'; // For enriching department name
import type { Department } from '@/lib/schemas'; // Ensure Department type is imported

// --- Audit Log ---
async function addAuditLog(employeeId: string, action: string, details: string, changedByUserId: string): Promise<void> {
  try {
    await createAuditLogEntryService(employeeId, action, details, changedByUserId);
  } catch (error) {
    console.error(`[Audit Log] Failed to add audit log for employee ${employeeId}:`, error);
    // Decide if this failure should propagate or be silently handled
  }
}

// --- Employee Data with User and Department Info ---
export interface EnrichedEmployee extends Employee {
  userEmail?: string;
  userName?: string; // firstName + lastName
  departmentName?: string;
}

export async function getEnrichedEmployees(): Promise<EnrichedEmployee[]> {
  try {
    const [allEmployees, allUsers, allDepartments] = await Promise.all([
      fetchAllEmployeesService(),
      getAllAppUsers(), 
      getAllActiveDepartments() 
    ]);

    // Enrich employee data
    const enrichedEmployeesPromises = allEmployees.map(async (emp) => {
      const user = allUsers.find(u => u.id === emp.userId);
      // Fetch department directly if not found in allDepartments or if allDepartments might be stale
      // For simplicity, using the allDepartments list first.
      let department = allDepartments.find(d => d.id === emp.departmentId);
      if (!department && emp.departmentId) { // If departmentId exists but not found in list, try fetching directly
          department = await getDepartmentByIdService(emp.departmentId) ?? undefined; // Handle null from service
      }

      return {
        ...emp,
        userEmail: user?.email,
        userName: user ? `${user.firstName} ${user.lastName}` : 'N/A',
        departmentName: department?.name,
      };
    });
    
    const resolvedEnrichedEmployees = await Promise.all(enrichedEmployeesPromises);
    return resolvedEnrichedEmployees.sort((a, b) => a.id.localeCompare(b.id));

  } catch (error) {
    console.error("[GetEnrichedEmployees Action] Error enriching employees:", error);
    return [];
  }
}

export async function getEmployeeById(employeeId: string): Promise<Employee | undefined> {
  try {
    return await fetchEmployeeByIdService(employeeId) ?? undefined;
  } catch (error) {
     console.error(`[GetEmployeeById Action] Error fetching employee ${employeeId}:`, error);
    return undefined;
  }
}

export async function getUsersNotYetEmployees(): Promise<AppUser[]> {
 try {
    const [allUsers, currentEmployees] = await Promise.all([
      getAllAppUsers(), 
      fetchAllEmployeesService()
    ]);
    const employeeUserIds = new Set(currentEmployees.map(e => e.userId));
    return allUsers.filter(user => !employeeUserIds.has(user.id) && user.role === 'employee');
  } catch (error) {
    console.error("[GetUsersNotYetEmployees Action] Error fetching users not yet employees:", error);
    return [];
  }
}


export async function addEmployee(data: AddEmployeeFormData, adminUserId: string): Promise<{ success: boolean; message: string; employee?: EnrichedEmployee }> {
  try {
    // Schema validation can be added here for server-side check if desired.
    
    // Employee ID generation is now handled by Firestore or service layer if specific format is needed.
    // For this example, we assume Firestore generates ID or service layer handles custom ID format from persistEmployeeService.
    const createdEmployee = await persistEmployeeService(data); // Removed employeeId from args

    if (!createdEmployee) {
      return { success: false, message: 'This user is already registered as an employee, or an error occurred during creation.' };
    }

    await addAuditLog(createdEmployee.id, 'EMPLOYEE_CREATED', `Employee ${createdEmployee.id} created for user ${data.userId}.`, adminUserId);
    
    // Re-fetch enriched data to return the complete object
    const user = (await getAllAppUsers()).find(u => u.id === createdEmployee.userId);
    const department = await getDepartmentByIdService(createdEmployee.departmentId);

    const enrichedEmployee: EnrichedEmployee = {
        ...createdEmployee,
        userEmail: user?.email,
        userName: user ? `${user.firstName} ${user.lastName}` : 'N/A',
        departmentName: department?.name,
    };
    
    return { success: true, message: 'Employee added successfully.', employee: enrichedEmployee };
  } catch (error) {
    console.error("[AddEmployee Action] Error adding employee:", error);
    return { success: false, message: "An unexpected server error occurred while adding the employee." };
  }
}

export async function updateEmployee(employeeId: string, data: EditEmployeeFormData, adminUserId: string): Promise<{ success: boolean; message: string; employee?: EnrichedEmployee }> {
  try {
    const oldEmployee = await fetchEmployeeByIdService(employeeId);
    if (!oldEmployee) {
      return { success: false, message: 'Employee not found.' };
    }

    const updatedEmployee = await persistUpdateEmployeeService(employeeId, data);
    if (!updatedEmployee) {
      return { success: false, message: 'Failed to update employee record in the database (service layer).' };
    }

    // Audit logging for changes
    const changes: string[] = [];
    if (oldEmployee.position !== updatedEmployee.position) {
      changes.push(`Position: '${oldEmployee.position}' to '${updatedEmployee.position}'`);
    }
    if (oldEmployee.departmentId !== updatedEmployee.departmentId) {
      const oldDeptName = (await getDepartmentByIdService(oldEmployee.departmentId))?.name || oldEmployee.departmentId;
      const newDeptName = (await getDepartmentByIdService(updatedEmployee.departmentId))?.name || updatedEmployee.departmentId;
      changes.push(`Department: '${oldDeptName}' to '${newDeptName}'`);
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
    const user = (await getAllAppUsers()).find(u => u.id === updatedEmployee.userId);
    const department = await getDepartmentByIdService(updatedEmployee.departmentId);
    
    const enrichedEmployee: EnrichedEmployee = {
      ...updatedEmployee,
      userEmail: user?.email,
      userName: user ? `${user.firstName} ${user.lastName}` : 'N/A',
      departmentName: department?.name,
    };

    return { success: true, message: 'Employee updated successfully.', employee: enrichedEmployee };
  } catch (error) {
    console.error(`[UpdateEmployee Action] Error updating employee ${employeeId}:`, error);
    return { success: false, message: "An unexpected server error occurred while updating the employee." };
  }
}
