
'use server';

import { z } from 'zod';
import type { Department, AddDepartmentFormData, EditDepartmentFormData } from '@/lib/schemas';

// Renamed to avoid conflict if 'departments' is used as a parameter or local var elsewhere.
let departmentsStore: Department[] = [
  { id: 'dept_1', name: 'Human Resources', status: 'active' },
  { id: 'dept_2', name: 'Engineering', status: 'active' },
  { id: 'dept_3', name: 'Marketing', status: 'inactive' },
];

export async function getDepartments(): Promise<Department[]> {
  try {
    // Ensure departmentsStore is treated as an array, even if it were unexpectedly null/undefined
    const currentData = Array.isArray(departmentsStore) ? departmentsStore : [];
    // Return a deep copy to prevent direct mutation of the store and ensure serializability
    const dataToReturn = JSON.parse(JSON.stringify(currentData));
    // Final check to ensure the parsed data is an array
    return Array.isArray(dataToReturn) ? dataToReturn : [];
  } catch (error) {
    console.error("Error in getDepartments processing:", error);
    return []; // Fallback to empty array on any error
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
