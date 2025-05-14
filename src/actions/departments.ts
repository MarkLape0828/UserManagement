
'use server';

import type { Department, AddDepartmentFormData, EditDepartmentFormData } from '@/lib/schemas';
import { getAllDepartments, createDepartment, updateExistingDepartment } from '@/services/departmentService';

export async function getDepartments(): Promise<Department[]> {
  try {
    return await getAllDepartments();
  } catch (error) {
    console.error("[Server Action] Error in getDepartments during Firestore fetch:", error);
    return []; 
  }
}

export async function addDepartment(data: AddDepartmentFormData): Promise<{ success: boolean; message: string; department?: Department }> {
  try {
    const newDepartment = await createDepartment(data);
    if (!newDepartment) {
        return { success: false, message: 'Department with this name already exists.' };
    }
    return { success: true, message: 'Department added successfully.', department: newDepartment };
  } catch (error) {
    console.error("[Server Action] Error adding department:", error);
    return { success: false, message: 'Failed to add department due to a server error.' };
  }
}

export async function updateDepartment(departmentId: string, data: EditDepartmentFormData): Promise<{ success: boolean; message: string; department?: Department }> {
  try {
    const updatedDepartment = await updateExistingDepartment(departmentId, data);
     if (!updatedDepartment) {
        // This can happen if the new name conflicts with an existing one
        const existingDept = (await getAllDepartments()).find(d => d.name.toLowerCase() === data.name.toLowerCase() && d.id !== departmentId);
        if (existingDept) {
          return { success: false, message: 'Another department with this name already exists.' };
        }
        return { success: false, message: 'Department not found or update failed.' };
    }
    return { success: true, message: 'Department updated successfully.', department: updatedDepartment };
  } catch (error) {
    console.error("[Server Action] Error updating department:", error);
    return { success: false, message: 'Failed to update department due to a server error.' };
  }
}
