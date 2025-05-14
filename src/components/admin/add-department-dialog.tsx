
'use client';

import type { Department } from '@/lib/schemas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AddDepartmentForm } from './add-department-form';

interface AddDepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDepartmentAdded: (newDepartment: Department) => void;
}

export function AddDepartmentDialog({ open, onOpenChange, onDepartmentAdded }: AddDepartmentDialogProps) {
  
  const handleSuccess = (newDepartment: Department) => {
    onDepartmentAdded(newDepartment);
    // onOpenChange(false); // Form will call onCancel which closes dialog
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Department</DialogTitle>
          <DialogDescription>
            Enter the name for the new department. It will be active by default.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <AddDepartmentForm onSuccess={handleSuccess} onCancel={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
