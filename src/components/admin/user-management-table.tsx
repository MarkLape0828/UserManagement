
'use client';

import type { AppUser } from '@/actions/auth';
import { adminUpdateUserStatus, getUsers } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Edit, PlusCircle, ToggleLeft, ToggleRight, RefreshCw, UserX, UserCheck } from 'lucide-react';
import React, { useState, useEffect, useTransition } from 'react';
import { AddUserDialog } from './add-user-dialog';
import { EditUserDialog } from './edit-user-dialog'; // New import

interface UserManagementTableProps {}

export function UserManagementTable({}: UserManagementTableProps) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [isUpdatingStatus, startUpdateTransition] = useTransition();
  const { toast } = useToast();

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch users.', variant: 'destructive' });
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserAdded = (newUser: AppUser) => {
    setUsers(prevUsers => [...prevUsers, newUser].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleOpenEditDialog = (user: AppUser) => {
    setEditingUser(user);
    setIsEditUserDialogOpen(true);
  };

  const handleUserUpdated = (updatedUser: AppUser) => {
    setUsers(prevUsers => 
      prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u)
               .sort((a, b) => a.name.localeCompare(b.name))
    );
    setEditingUser(null); // Clear editing user
  };

  const handleToggleStatus = async (userId: string, currentStatus: 'active' | 'inactive') => {
    startUpdateTransition(async () => {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const result = await adminUpdateUserStatus(userId, newStatus);
      if (result.success) {
        toast({ title: 'Status Updated', description: result.message });
        setUsers(prevUsers => 
          prevUsers.map(u => u.id === userId ? { ...u, status: newStatus } : u)
        );
      } else {
        toast({ title: 'Update Failed', description: result.message, variant: 'destructive' });
      }
    });
  };
  
  if (isLoading && users.length === 0) {
    return <div className="flex justify-center items-center p-8"><RefreshCw className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading users...</span></div>;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">User List</h3>
        <div className="space-x-2">
          <Button onClick={fetchUsers} variant="outline" size="icon" aria-label="Refresh users" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => setIsAddUserDialogOpen(true)} variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" /> Add User
          </Button>
        </div>
      </div>
      <div className="rounded-md border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={user.status === 'active' ? 'secondary' : 'destructive'} 
                    className={`text-xs ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                  >
                     {user.status === 'active' ? <UserCheck className="mr-1 h-3 w-3" /> : <UserX className="mr-1 h-3 w-3" /> }
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleOpenEditDialog(user)}
                    aria-label="Edit user"
                    disabled={isUpdatingStatus}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleToggleStatus(user.id, user.status)}
                    disabled={isUpdatingStatus}
                    aria-label={user.status === 'active' ? 'Deactivate user' : 'Activate user'}
                  >
                    {isUpdatingStatus && editingUser?.id !== user.id ? ( // Show spinner only for the user being updated if needed, or generally
                       user.status === 'active' ? <ToggleRight className="h-4 w-4 text-red-500" /> : <ToggleLeft className="h-4 w-4 text-green-500" />
                    ) : (
                       user.status === 'active' ? <ToggleRight className="h-4 w-4 text-red-500" /> : <ToggleLeft className="h-4 w-4 text-green-500" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No users found. Click "Add User" to create one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AddUserDialog
        open={isAddUserDialogOpen}
        onOpenChange={setIsAddUserDialogOpen}
        onUserAdded={handleUserAdded}
      />
      
      {editingUser && (
        <EditUserDialog
          user={editingUser}
          open={isEditUserDialogOpen}
          onOpenChange={(open) => {
            setIsEditUserDialogOpen(open);
            if (!open) setEditingUser(null); // Clear user when dialog closes
          }}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </>
  );
}
