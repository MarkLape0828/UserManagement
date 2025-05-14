
'use server';

import type { Department, AddDepartmentFormData, EditDepartmentFormData } from '@/lib/schemas';
import { getAllDepartments as getAllDepartmentsService, createDepartment as createDepartmentService, updateExistingDepartment as updateExistingDepartmentService } from '@/services/departmentService';

export async function getDepartments(): Promise<Department[]> {
  try {
    return await getAllDepartmentsService();
  } catch (error) {
    console.error("[GetDepartments Action] Error fetching departments from service:", error);
    return []; 
  }
}

export async function addDepartment(data: AddDepartmentFormData): Promise<{ success: boolean; message: string; department?: Department }> {
  try {
    // Schema validation for AddDepartmentFormData can be added here if needed,
    // though it's typically handled by the form. For server actions, explicit validation is good.
    // For now, assuming data is valid as per form's Zod schema.

    const newDepartment = await createDepartmentService(data);
    if (!newDepartment) {
        // This condition implies the service layer determined a conflict (e.g., name exists)
        return { success: false, message: 'Department with this name already exists or creation failed at service level.' };
    }
    return { success: true, message: 'Department added successfully.', department: newDepartment };
  } catch (error) {
    console.error("[AddDepartment Action] Error adding department:", error);
    return { success: false, message: 'Failed to add department due to a server error. Please try again.' };
  }
}

export async function updateDepartment(departmentId: string, data: EditDepartmentFormData): Promise<{ success: boolean; message: string; department?: Department }> {
  try {
    // Schema validation for EditDepartmentFormData can be added here if needed.

    const updatedDepartment = await updateExistingDepartmentService(departmentId, data);
     if (!updatedDepartment) {
        // This can happen if the new name conflicts with an existing one, or department not found
        // The service layer should ideally provide more specific reasons if possible.
        // For now, we assume service returning null means conflict or not found.
        // A more detailed check might involve re-fetching to see if it's a name conflict.
        return { success: false, message: 'Department not found, or update failed (e.g., name conflict). Check data and try again.' };
    }
    return { success: true, message: 'Department updated successfully.', department: updatedDepartment };
  } catch (error)
 {
    console.error("[UpdateDepartment Action] Error updating department:", error);
    return { success: false, message: 'Failed to update department due to a server error. Please try again.' };
  }
}
