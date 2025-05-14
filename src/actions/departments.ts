
'use server';

import type { Department, AddDepartmentFormData, EditDepartmentFormData } from '@/lib/schemas';

// IMPORTANT: Data Persistence
// This version uses an IN-MEMORY array for departments. Data will be RESET on server restart.
let departmentsStore: Department[] = []; // Initialize as empty

export async function getDepartments(): Promise<Department[]> {
  try {
    // Return a deep copy to prevent direct mutation of the in-memory store from client-side expectations
    // and to ensure serializability if Date objects are used.
    return JSON.parse(JSON.stringify(departmentsStore));
  } catch (error) {
    console.error("[GetDepartments Action] Error fetching departments:", error);
    return []; 
  }
}

export async function addDepartment(data: AddDepartmentFormData): Promise<{ success: boolean; message: string; department?: Department }> {
  try {
    const existingDepartment = departmentsStore.find(
      (dept) => dept.name.toLowerCase() === data.name.toLowerCase()
    );
    if (existingDepartment) {
      return { success: false, message: 'Department with this name already exists.' };
    }

    const newDepartment: Department = {
      id: `dept_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: data.name,
      nameLower: data.name.toLowerCase(),
      status: 'active', // New departments are active by default
      // createdAt and updatedAt can be added here if needed for in-memory version
      // createdAt: new Date().toISOString(),
      // updatedAt: new Date().toISOString(),
    };
    departmentsStore.push(newDepartment);
    return { success: true, message: 'Department added successfully.', department: JSON.parse(JSON.stringify(newDepartment)) };
  } catch (error) {
    console.error("[AddDepartment Action] Error adding department:", error);
    return { success: false, message: 'Failed to add department due to a server error.' };
  }
}

export async function updateDepartment(departmentId: string, data: EditDepartmentFormData): Promise<{ success: boolean; message: string; department?: Department }> {
  try {
    const deptIndex = departmentsStore.findIndex(d => d.id === departmentId);
    if (deptIndex === -1) {
      return { success: false, message: 'Department not found.' };
    }

    if (data.name) {
      const nameLower = data.name.toLowerCase();
      if (departmentsStore.some(d => d.nameLower === nameLower && d.id !== departmentId)) {
        return { success: false, message: 'Another department with this name already exists.' };
      }
      departmentsStore[deptIndex].name = data.name;
      departmentsStore[deptIndex].nameLower = nameLower;
    }

    if (data.status) {
      departmentsStore[deptIndex].status = data.status;
    }
    // departmentsStore[deptIndex].updatedAt = new Date().toISOString();
    
    return { success: true, message: 'Department updated successfully.', department: JSON.parse(JSON.stringify(departmentsStore[deptIndex])) };
  } catch (error) {
    console.error("[UpdateDepartment Action] Error updating department:", error);
    return { success: false, message: 'Failed to update department due to a server error.' };
  }
}

// Helper function that might be used by other actions (e.g., employees)
export async function getDepartmentById(departmentId: string): Promise<Department | null> {
  try {
    const department = departmentsStore.find(d => d.id === departmentId);
    return department ? JSON.parse(JSON.stringify(department)) : null;
  } catch (error) {
    console.error(`[GetDepartmentById Action] Error fetching department ${departmentId}:`, error);
    return null;
  }
}
