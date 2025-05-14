
'use client';

import type { AppUser } from '@/actions/auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EditUserForm } from './edit-user-form';

interface EditUserDialogProps {
  user: AppUser | null; // User to edit, null if dialog is not for editing
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: (updatedUser: AppUser) => void;
}

export function EditUserDialog({ user, open, onOpenChange, onUserUpdated }: EditUserDialogProps) {
  if (!user) return null; // Don't render if no user is selected for editing

  const handleSuccess = (updatedUser: AppUser) => {
    onUserUpdated(updatedUser);
    onOpenChange(false); // Close dialog on success
  };

  const handleCancel = () => {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User: {user.name}</DialogTitle>
          <DialogDescription>
            Modify the details for this user. Password cannot be changed here.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <EditUserForm user={user} onSuccess={handleSuccess} onCancel={handleCancel} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
