
'use client';

import type { AppUserProfile } from '@/services/userService'; // Updated import
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EditUserForm } from './edit-user-form';

interface EditUserDialogProps {
  user: AppUserProfile | null; 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: (updatedUser: AppUserProfile) => void; // Updated type
}

export function EditUserDialog({ user, open, onOpenChange, onUserUpdated }: EditUserDialogProps) {
  if (!user) return null; 

  const handleSuccess = (updatedUser: AppUserProfile) => { // Updated type
    onUserUpdated(updatedUser);
    onOpenChange(false); 
  };

  const handleCancel = () => {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User: {user.firstName} {user.lastName}</DialogTitle>
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
