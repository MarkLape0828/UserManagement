
'use client';

import type { AppUserProfile } from '@/services/userService'; // Updated import
import { getUsers } from '@/actions/auth';
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
import { Edit, PlusCircle, RefreshCw, UserX, UserCheck } from 'lucide-react';
import React, { useState, useEffect } from 'react'; // Removed useTransition
import { AddUserDialog } from './add-user-dialog';
import { EditUserDialog } from './edit-user-dialog';

interface UserManagementTableProps {}

export function UserManagementTable({}: UserManagementTableProps) {
  const [users, setUsers] = useState<AppUserProfile[]>([]); // Updated type
  const [isLoading, setIsLoading] = useState(true);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUserProfile | null>(null); // Updated type
  const { toast } = useToast();

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const fetchedUsers = await getUsers();
      // Ensure fetchedUsers is an array before sorting
      if (Array.isArray(fetchedUsers)) {
        setUsers(fetchedUsers.sort((a, b) => (a.firstName + a.lastName).localeCompare(b.firstName + b.lastName)));
      } else {
        console.error("getUsers did not return an array:", fetchedUsers);
        setUsers([]); // Default to empty array if data is not as expected
        toast({ title: 'Error', description: 'Failed to fetch users or data is invalid.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch users.', variant: 'destructive' });
      console.error("Failed to fetch users:", error);
      setUsers([]); // Default to empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserAdded = (newUser: AppUserProfile) => { // Updated type
    setUsers(prevUsers => [...prevUsers, newUser].sort((a, b) => (a.firstName + a.lastName).localeCompare(b.firstName + b.lastName)));
  };

  const handleOpenEditDialog = (user: AppUserProfile) => { // Updated type
    setEditingUser(user);
    setIsEditUserDialogOpen(true);
  };

  const handleUserUpdated = (updatedUser: AppUserProfile) => { // Updated type
    setUsers(prevUsers =>
      prevUsers.map(u => u.uid === updatedUser.uid ? updatedUser : u) // Use uid
               .sort((a, b) => (a.firstName + a.lastName).localeCompare(b.firstName + b.lastName))
    );
    setEditingUser(null);
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
              <TableRow key={user.uid}> {/* Use uid */}
                <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
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
                  >
                    <Edit className="h-4 w-4" />
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
            if (!open) setEditingUser(null);
          }}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </>
  );
}
