
'use server';

import type { Department, AddDepartmentFormData, EditDepartmentFormData } from '@/lib/schemas';

// In-memory store for demo purposes.
// Data will be reset on server restarts or new server instances.
let departmentsStore: Department[] = [];

export async function getDepartments(): Promise<Department[]> {
  // Ensure departmentsStore is always an array at the very start.
  if (!Array.isArray(departmentsStore)) {
    console.error("[Server Action] getDepartments: departmentsStore was not an array. Re-initializing.", typeof departmentsStore);
    departmentsStore = []; // Re-initialize to prevent error with stringify
  }
  
  try {
    // Return a deep copy to prevent mutations and ensure serializability
    return JSON.parse(JSON.stringify(departmentsStore));
  } catch (error) {
    console.error("[Server Action] Error in getDepartments during JSON processing:", error);
    return []; // Fallback to empty array on any error during stringify/parse
  }
}

export async function addDepartment(data: AddDepartmentFormData): Promise<{ success: boolean; message: string; department?: Department }> {
  // Ensure departmentsStore is always an array
  if (!Array.isArray(departmentsStore)) {
    console.error("[Server Action] addDepartment: departmentsStore was not an array. Re-initializing.");
    departmentsStore = [];
  }

  const { name } = data;

  if (departmentsStore.some(d => d.name.toLowerCase() === name.toLowerCase())) {
    return { success: false, message: 'Department with this name already exists.' };
  }

  const newDepartment: Department = {
    id: `dept_${Date.now()}_${departmentsStore.length + 1}`,
    name,
    status: 'active', 
  };
  departmentsStore.push(newDepartment);
  // Return a serializable copy
  return { success: true, message: 'Department added successfully.', department: JSON.parse(JSON.stringify(newDepartment)) };
}

export async function updateDepartment(departmentId: string, data: EditDepartmentFormData): Promise<{ success: boolean; message: string; department?: Department }> {
  // Ensure departmentsStore is always an array
  if (!Array.isArray(departmentsStore)) {
     console.error("[Server Action] updateDepartment: departmentsStore was not an array. Re-initializing.");
    departmentsStore = [];
    // If the store is corrupted, we probably can't update.
    return { success: false, message: 'Department data store is unavailable.' };
  }

  const { name, status } = data;

  const departmentIndex = departmentsStore.findIndex(d => d.id === departmentId);
  if (departmentIndex === -1) {
    return { success: false, message: 'Department not found.' };
  }

  // Ensure name uniqueness if changed
  if (name && name.toLowerCase() !== departmentsStore[departmentIndex].name.toLowerCase()) {
    if (departmentsStore.some(d => d.name.toLowerCase() === name.toLowerCase() && d.id !== departmentId)) {
      return { success: false, message: 'Another department with this name already exists.' };
    }
  }
  
  departmentsStore[departmentIndex] = {
    ...departmentsStore[departmentIndex],
    name: name ?? departmentsStore[departmentIndex].name,
    status: status ?? departmentsStore[departmentIndex].status,
  };

  // Return a serializable copy
  return { success: true, message: 'Department updated successfully.', department: JSON.parse(JSON.stringify(departmentsStore[departmentIndex])) };
}
