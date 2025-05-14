
'use server';

import { z } from 'zod';
import type { Department, AddDepartmentFormData, EditDepartmentFormData } from '@/lib/schemas';

// In-memory store for demo purposes. Replace with a database in a real app.
let departments: Department[] = [
  { id: 'dept_1', name: 'Human Resources', status: 'active', employeeCount: 0 },
  { id: 'dept_2', name: 'Engineering', status: 'active', employeeCount: 0 },
  { id: 'dept_3', name: 'Marketing', status: 'inactive', employeeCount: 0 },
];

export async function getDepartments(): Promise<Department[]> {
  let resultData: Department[] = []; // Initialize with a default empty array

  try {
    const currentDepartments = departments; // Work with a local reference

    if (!Array.isArray(currentDepartments)) {
      // This case should ideally not happen if 'departments' is always an array.
      // Log a warning if it's not an array, but still proceed to return empty resultData.
      console.warn("'departments' source is not an array in getDepartments. Returning empty list. Value:", currentDepartments);
    } else {
      const deptsToProcess = currentDepartments.map(dept => {
        // Basic sanitization/defaulting for each property to ensure serializability
        // and prevent errors if a department object is malformed.
        const safeDept = {
          id: String(dept.id || `unknown_id_${Math.random().toString(36).substring(7)}`),
          name: String(dept.name || 'Unnamed Department'),
          status: (dept.status === 'active' || dept.status === 'inactive') ? dept.status : 'inactive' as 'active' | 'inactive',
          employeeCount: Number(dept.employeeCount) || 0,
        };
        return safeDept;
      });

      // Deep copy to simulate API response and ensure data integrity
      const stringified = JSON.stringify(deptsToProcess);
      const parsed = JSON.parse(stringified);

      // Final check to ensure parsed data is an array
      if (Array.isArray(parsed)) {
        resultData = parsed;
      } else {
        console.warn("Parsed department data is not an array in getDepartments. Returning empty list. Parsed value:", parsed);
        // resultData remains empty as initialized
      }
    }
  } catch (error) {
    console.error("Error within getDepartments server action:", error);
    // resultData remains as the initialized empty array in case of any error
  }
  
  // This function must always return a Promise<Department[]>
  // resultData is guaranteed to be an array here due to initialization and checks.
  return resultData;
}

export async function addDepartment(data: AddDepartmentFormData): Promise<{ success: boolean; message: string; department?: Department }> {
  // Validation is handled by the form resolver, but good practice to have server-side too for direct API calls.
  // For simplicity, we'll rely on client-side validation for this demo.

  const { name } = data;

  if (departments.some(d => d.name.toLowerCase() === name.toLowerCase())) {
    return { success: false, message: 'Department with this name already exists.' };
  }

  const newDepartment: Department = {
    id: `dept_${Date.now()}_${departments.length + 1}`,
    name,
    status: 'active', // New departments are active by default
    employeeCount: 0,
  };
  departments.push(newDepartment);
  return { success: true, message: 'Department added successfully.', department: newDepartment };
}

export async function updateDepartment(departmentId: string, data: EditDepartmentFormData): Promise<{ success: boolean; message: string; department?: Department }> {
  const { name, status } = data;

  const departmentIndex = departments.findIndex(d => d.id === departmentId);
  if (departmentIndex === -1) {
    return { success: false, message: 'Department not found.' };
  }

  // Ensure name uniqueness if changed
  if (name && name.toLowerCase() !== departments[departmentIndex].name.toLowerCase()) {
    if (departments.some(d => d.name.toLowerCase() === name.toLowerCase() && d.id !== departmentId)) {
      return { success: false, message: 'Another department with this name already exists.' };
    }
  }
  
  departments[departmentIndex] = {
    ...departments[departmentIndex],
    name: name ?? departments[departmentIndex].name,
    status: status ?? departments[departmentIndex].status,
  };

  return { success: true, message: 'Department updated successfully.', department: departments[departmentIndex] };
}

// Placeholder for future: function to delete a department
// export async function deleteDepartment(departmentId: string): Promise<{ success: boolean; message: string }> {
//   departments = departments.filter(d => d.id !== departmentId);
//   return { success: true, message: 'Department deleted successfully.' };
// }
