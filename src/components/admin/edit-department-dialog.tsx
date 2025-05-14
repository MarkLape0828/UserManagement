
'use client';

import type { Department } from '@/lib/schemas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EditDepartmentForm } from './edit-department-form';

interface EditDepartmentDialogProps {
  department: Department | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDepartmentUpdated: (updatedDepartment: Department) => void;
}

export function EditDepartmentDialog({ department, open, onOpenChange, onDepartmentUpdated }: EditDepartmentDialogProps) {
  if (!department) return null;

  const handleSuccess = (updatedDepartment: Department) => {
    onDepartmentUpdated(updatedDepartment);
    // onOpenChange(false); // Form will call onCancel which closes dialog
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Department: {department.name}</DialogTitle>
          <DialogDescription>
            Modify the department name and status.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <EditDepartmentForm 
            department={department} 
            onSuccess={handleSuccess} 
            onCancel={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
