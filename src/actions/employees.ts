
'use server';

import type { Employee, AuditLogEntry, AddEmployeeFormData, EditEmployeeFormData } from '@/lib/schemas';
import { getUsers as getAllAppUsers, type AppUser } from './auth'; 
import { getDepartments as getAllActiveDepartments, getDepartmentById as getDepartmentByIdFromAction } from './departments';
import type { Department } from '@/lib/schemas';

// IMPORTANT: Data Persistence
// This version uses IN-MEMORY arrays for employees and audit logs. Data will be RESET on server restart.
let employees: Employee[] = [];
let auditLog: AuditLogEntry[] = [];

// --- Audit Log ---
async function addAuditLog(employeeId: string, action: string, details: string, changedByUserId: string): Promise<void> {
  try {
    const newLogEntry: AuditLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      employeeId,
      timestamp: new Date().toISOString(),
      action,
      details,
      changedByUserId,
    };
    auditLog.push(newLogEntry);
  } catch (error) {
    console.error(`[Audit Log] Failed to add audit log for employee ${employeeId}:`, error);
  }
}

// --- Employee Data with User and Department Info ---
export interface EnrichedEmployee extends Employee {
  userEmail?: string;
  userName?: string; // firstName + lastName
  departmentName?: string;
}

// Internal helper to get all employees from the in-memory store
async function fetchAllEmployeesFromStore(): Promise<Employee[]> {
  // Return a deep copy
  return JSON.parse(JSON.stringify(employees));
}


export async function getEnrichedEmployees(): Promise<EnrichedEmployee[]> {
  try {
    const [allEmployeesFromStore, allUsers, allDepts] = await Promise.all([
      fetchAllEmployeesFromStore(),
      getAllAppUsers(), 
      getAllActiveDepartments() 
    ]);

    const enrichedEmployeesPromises = allEmployeesFromStore.map(async (emp) => {
      const user = allUsers.find(u => u.id === emp.userId);
      let department = allDepts.find(d => d.id === emp.departmentId);
      // If not found in the list (e.g. department became inactive), try getting by ID directly
      if (!department && emp.departmentId) {
          department = await getDepartmentByIdFromAction(emp.departmentId) ?? undefined;
      }

      return {
        ...emp,
        // Convert hireDate back to Date object if it was stringified
        hireDate: new Date(emp.hireDate), 
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
    const employee = employees.find(e => e.id === employeeId);
    if (employee) {
      // Return a deep copy with hireDate as Date object
      const empCopy = JSON.parse(JSON.stringify(employee));
      empCopy.hireDate = new Date(empCopy.hireDate);
      return empCopy;
    }
    return undefined;
  } catch (error) {
     console.error(`[GetEmployeeById Action] Error fetching employee ${employeeId}:`, error);
    return undefined;
  }
}

export async function getUsersNotYetEmployees(): Promise<AppUser[]> {
 try {
    const [allUsers, currentEmployeesFromStore] = await Promise.all([
      getAllAppUsers(), 
      fetchAllEmployeesFromStore()
    ]);
    const employeeUserIds = new Set(currentEmployeesFromStore.map(e => e.userId));
    // Filter out password before sending to client
    return allUsers
        .filter(user => !employeeUserIds.has(user.id) && user.role === 'employee')
        .map(u => {
            const {password, ...userWithoutPassword} = u;
            return userWithoutPassword;
        });
  } catch (error) {
    console.error("[GetUsersNotYetEmployees Action] Error fetching users not yet employees:", error);
    return [];
  }
}


export async function addEmployee(data: AddEmployeeFormData, adminUserId: string): Promise<{ success: boolean; message: string; employee?: EnrichedEmployee }> {
  try {
    if (employees.some(e => e.userId === data.userId)) {
      return { success: false, message: 'This user is already registered as an employee.' };
    }
    
    const newEmployee: Employee = {
      id: `emp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: data.userId,
      position: data.position,
      departmentId: data.departmentId,
      hireDate: data.hireDate, // Already a Date object from the form
      status: data.status,
      // createdAt: new Date().toISOString(),
      // updatedAt: new Date().toISOString(),
    };
    employees.push(newEmployee);

    await addAuditLog(newEmployee.id, 'EMPLOYEE_CREATED', `Employee ${newEmployee.id} created for user ${data.userId}.`, adminUserId);
    
    const user = (await getAllAppUsers()).find(u => u.id === newEmployee.userId);
    const department = await getDepartmentByIdFromAction(newEmployee.departmentId);

    const enrichedEmployee: EnrichedEmployee = {
        ...newEmployee,
        hireDate: new Date(newEmployee.hireDate), // Ensure it's a date object for return
        userEmail: user?.email,
        userName: user ? `${user.firstName} ${user.lastName}` : 'N/A',
        departmentName: department?.name,
    };
    
    return { success: true, message: 'Employee added successfully.', employee: JSON.parse(JSON.stringify(enrichedEmployee)) };
  } catch (error) {
    console.error("[AddEmployee Action] Error adding employee:", error);
    return { success: false, message: "An unexpected server error occurred while adding the employee." };
  }
}

export async function updateEmployee(employeeId: string, data: EditEmployeeFormData, adminUserId: string): Promise<{ success: boolean; message: string; employee?: EnrichedEmployee }> {
  try {
    const empIndex = employees.findIndex(e => e.id === employeeId);
    if (empIndex === -1) {
      return { success: false, message: 'Employee not found.' };
    }

    const oldEmployee = { ...employees[empIndex] }; // Shallow copy for comparison
    oldEmployee.hireDate = new Date(oldEmployee.hireDate); // Ensure old hireDate is Date object

    const updatedEmployeeData: Employee = {
        ...employees[empIndex],
        position: data.position,
        departmentId: data.departmentId,
        hireDate: data.hireDate, // Already a Date object from the form
        status: data.status,
        // updatedAt: new Date().toISOString(),
    };
    employees[empIndex] = updatedEmployeeData;
    
    const changes: string[] = [];
    if (oldEmployee.position !== updatedEmployeeData.position) {
      changes.push(`Position: '${oldEmployee.position}' to '${updatedEmployeeData.position}'`);
    }
    if (oldEmployee.departmentId !== updatedEmployeeData.departmentId) {
      const oldDeptName = (await getDepartmentByIdFromAction(oldEmployee.departmentId))?.name || oldEmployee.departmentId;
      const newDeptName = (await getDepartmentByIdFromAction(updatedEmployeeData.departmentId))?.name || updatedEmployeeData.departmentId;
      changes.push(`Department: '${oldDeptName}' to '${newDeptName}'`);
    }
    
    const oldHireDateStr = oldEmployee.hireDate instanceof Date ? oldEmployee.hireDate.toLocaleDateString() : new Date(oldEmployee.hireDate).toLocaleDateString();
    const newHireDateStr = updatedEmployeeData.hireDate instanceof Date ? updatedEmployeeData.hireDate.toLocaleDateString() : new Date(updatedEmployeeData.hireDate).toLocaleDateString();

    if (oldHireDateStr !== newHireDateStr) {
       changes.push(`Hire Date: '${oldHireDateStr}' to '${newHireDateStr}'`);
    }

    if (oldEmployee.status !== updatedEmployeeData.status) {
      changes.push(`Status: '${oldEmployee.status}' to '${updatedEmployeeData.status}'`);
    }

    if (changes.length > 0) {
      await addAuditLog(employeeId, 'EMPLOYEE_UPDATED', changes.join('; '), adminUserId);
    }
    
    const user = (await getAllAppUsers()).find(u => u.id === updatedEmployeeData.userId);
    const department = await getDepartmentByIdFromAction(updatedEmployeeData.departmentId);
    
    const enrichedEmployee: EnrichedEmployee = {
      ...updatedEmployeeData,
      hireDate: new Date(updatedEmployeeData.hireDate), // Ensure it's a date object for return
      userEmail: user?.email,
      userName: user ? `${user.firstName} ${user.lastName}` : 'N/A',
      departmentName: department?.name,
    };

    return { success: true, message: 'Employee updated successfully.', employee: JSON.parse(JSON.stringify(enrichedEmployee)) };
  } catch (error) {
    console.error(`[UpdateEmployee Action] Error updating employee ${employeeId}:`, error);
    return { success: false, message: "An unexpected server error occurred while updating the employee." };
  }
}
