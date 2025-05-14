
'use client';

import type { EnrichedEmployee } from '@/actions/employees';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EditEmployeeForm } from './edit-employee-form';
import type { Department } from '@/lib/schemas';

interface EditEmployeeDialogProps {
  employee: EnrichedEmployee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmployeeUpdated: (updatedEmployee: EnrichedEmployee) => void;
  adminUserId: string;
  availableDepartments: Department[];
}

export function EditEmployeeDialog({ 
  employee, 
  open, 
  onOpenChange, 
  onEmployeeUpdated, 
  adminUserId,
  availableDepartments
}: EditEmployeeDialogProps) {
  if (!employee) return null;

  const handleSuccess = (updatedEmployee: EnrichedEmployee) => {
    onEmployeeUpdated(updatedEmployee);
    onOpenChange(false); // Close dialog
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Employee: {employee.userName} ({employee.id})</DialogTitle>
          <DialogDescription>
            Modify the employee's details below.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <EditEmployeeForm 
            employee={employee}
            onSuccess={handleSuccess} 
            onCancel={() => onOpenChange(false)} 
            adminUserId={adminUserId}
            availableDepartments={availableDepartments}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
