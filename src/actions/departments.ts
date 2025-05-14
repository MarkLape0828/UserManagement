
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
  // Simulate fetching from a database
  // In a real app, you'd calculate employeeCount here or it would be part of the DB query
  return JSON.parse(JSON.stringify(departments.map(dept => ({
    ...dept,
    employeeCount: dept.employeeCount || 0 // Ensure employeeCount is a number
  }))));
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
  if (name.toLowerCase() !== departments[departmentIndex].name.toLowerCase()) {
    if (departments.some(d => d.name.toLowerCase() === name.toLowerCase() && d.id !== departmentId)) {
      return { success: false, message: 'Another department with this name already exists.' };
    }
  }

  departments[departmentIndex] = {
    ...departments[departmentIndex],
    name,
    status,
  };

  return { success: true, message: 'Department updated successfully.', department: departments[departmentIndex] };
}

// Placeholder for future: function to delete a department
// export async function deleteDepartment(departmentId: string): Promise<{ success: boolean; message: string }> {
//   departments = departments.filter(d => d.id !== departmentId);
//   return { success: true, message: 'Department deleted successfully.' };
// }
