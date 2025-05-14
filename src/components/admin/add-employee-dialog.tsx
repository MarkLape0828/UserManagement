
'use client';

import type { EnrichedEmployee } from '@/actions/employees';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AddEmployeeForm } from './add-employee-form';
import type { AppUserProfile } from '@/services/userService'; // Updated import
import type { Department } from '@/lib/schemas';

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmployeeAdded: (newEmployee: EnrichedEmployee) => void;
  adminUserId: string;
  availableUsers: AppUserProfile[]; // Updated type
  availableDepartments: Department[];
}

export function AddEmployeeDialog({ 
  open, 
  onOpenChange, 
  onEmployeeAdded, 
  adminUserId,
  availableUsers,
  availableDepartments 
}: AddEmployeeDialogProps) {
  
  const handleSuccess = (newEmployee: EnrichedEmployee) => {
    onEmployeeAdded(newEmployee);
    onOpenChange(false); 
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>
            Fill in the details to add a new employee record.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <AddEmployeeForm 
            onSuccess={handleSuccess} 
            onCancel={() => onOpenChange(false)} 
            adminUserId={adminUserId}
            availableUsers={availableUsers}
            availableDepartments={availableDepartments}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
