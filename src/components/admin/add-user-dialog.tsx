
'use client';

import type { AppUser } from '@/actions/auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AddUserForm } from './add-user-form';

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserAdded: (newUser: AppUser) => void;
}

export function AddUserDialog({ open, onOpenChange, onUserAdded }: AddUserDialogProps) {
  const handleSuccess = (newUser: AppUser) => {
    onUserAdded(newUser);
    onOpenChange(false); // Close dialog on success
  };

  const handleCancel = () => {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new user account.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <AddUserForm onSuccess={handleSuccess} onCancel={handleCancel} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
