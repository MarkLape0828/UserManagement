
'use server';

import { z } from 'zod';
import type { Department, AddDepartmentFormData, EditDepartmentFormData } from '@/lib/schemas';

// Renamed to avoid conflict if 'departments' is used as a parameter or local var elsewhere.
let departmentsStore: Department[] = [
  { id: 'dept_1', name: 'Human Resources', status: 'active', employeeCount: 0 },
  { id: 'dept_2', name: 'Engineering', status: 'active', employeeCount: 0 },
  { id: 'dept_3', name: 'Marketing', status: 'inactive', employeeCount: 0 },
];

export async function getDepartments(): Promise<Department[]> {
  // console.log("Server Action: getDepartments called. Current store state:", JSON.stringify(departmentsStore));
  try {
    // Ensure we're working with a copy and it's serializable
    // Handle if departmentsStore is null or undefined, though it's initialized as an array.
    const currentData = departmentsStore || [];
    const dataToReturn = JSON.parse(JSON.stringify(currentData));
    
    if (!Array.isArray(dataToReturn)) {
      console.error("Server Action: getDepartments - dataToReturn is not an array after processing:", dataToReturn);
      return []; // Fallback to empty array
    }
    // console.log("Server Action: getDepartments returning (a copy):", JSON.stringify(dataToReturn));
    return dataToReturn;
  } catch (e) {
    console.error("Server Action: getDepartments encountered an error during processing:", e);
    return []; // Always return an array on error
  }
}

export async function addDepartment(data: AddDepartmentFormData): Promise<{ success: boolean; message: string; department?: Department }> {
  const { name } = data;

  if (departmentsStore.some(d => d.name.toLowerCase() === name.toLowerCase())) {
    return { success: false, message: 'Department with this name already exists.' };
  }

  const newDepartment: Department = {
    id: `dept_${Date.now()}_${departmentsStore.length + 1}`,
    name,
    status: 'active', 
    employeeCount: 0,
  };
  departmentsStore.push(newDepartment);
  // Return a serializable copy
  return { success: true, message: 'Department added successfully.', department: JSON.parse(JSON.stringify(newDepartment)) };
}

export async function updateDepartment(departmentId: string, data: EditDepartmentFormData): Promise<{ success: boolean; message: string; department?: Department }> {
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

// Placeholder for future: function to delete a department
// export async function deleteDepartment(departmentId: string): Promise<{ success: boolean; message: string }> {
//   departmentsStore = departmentsStore.filter(d => d.id !== departmentId);
//   return { success: true, message: 'Department deleted successfully.' };
// }
