
'use client';

import type { EnrichedEmployee } from '@/actions/employees';
import { getEnrichedEmployees } from '@/actions/employees';
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
import { Edit, PlusCircle, RefreshCw, UserCheck, UserX, CalendarDays, Briefcase, Building } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { AddEmployeeDialog } from './add-employee-dialog';
import { EditEmployeeDialog } from './edit-employee-dialog';
import type { AppUser } from '@/actions/auth';
import type { Department } from '@/lib/schemas';
import { getUsersNotYetEmployees } from '@/actions/employees';
import { getDepartments } from '@/actions/departments';


interface EmployeeManagementTableProps {
  adminUserId: string;
}

export function EmployeeManagementTable({ adminUserId }: EmployeeManagementTableProps) {
  const [employees, setEmployees] = useState<EnrichedEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EnrichedEmployee | null>(null);
  
  const [availableUsers, setAvailableUsers] = useState<AppUser[]>([]);
  const [availableDepartments, setAvailableDepartments] = useState<Department[]>([]);

  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [empsResponse, usersResponse, deptsResponse] = await Promise.all([
        getEnrichedEmployees(),
        getUsersNotYetEmployees(),
        getDepartments()
      ]);

      // Ensure responses are arrays before setting state
      const validEmps = Array.isArray(empsResponse) ? empsResponse : [];
      const validUsers = Array.isArray(usersResponse) ? usersResponse : [];
      const validDepts = Array.isArray(deptsResponse) ? deptsResponse : [];

      setEmployees(validEmps);
      setAvailableUsers(validUsers);
      setAvailableDepartments(validDepts.filter(d => d.status === 'active')); // Only active departments for assignment
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch employee data.', variant: 'destructive' });
      console.error("Failed to fetch employee data:", error);
      // Set to empty arrays in case of error to maintain type consistency and prevent .length errors
      setEmployees([]);
      setAvailableUsers([]);
      setAvailableDepartments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEmployeeAdded = (newEmployee: EnrichedEmployee) => {
    setEmployees(prev => [...prev, newEmployee].sort((a,b) => a.id.localeCompare(b.id)));
    fetchData(); // Refresh available users as one has been assigned
  };

  const handleOpenEditDialog = (employee: EnrichedEmployee) => {
    setEditingEmployee(employee);
    setIsEditDialogOpen(true);
  };

  const handleEmployeeUpdated = (updatedEmployee: EnrichedEmployee) => {
    setEmployees(prev =>
      prev.map(e => e.id === updatedEmployee.id ? updatedEmployee : e)
           .sort((a, b) => a.id.localeCompare(b.id))
    );
    setEditingEmployee(null);
  };

  if (isLoading && employees.length === 0 && availableUsers.length === 0 && availableDepartments.length === 0) {
    return <div className="flex justify-center items-center p-8"><RefreshCw className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading employees...</span></div>;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold inline-flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary" />Employee List</h3>
        <div className="space-x-2">
          <Button onClick={fetchData} variant="outline" size="icon" aria-label="Refresh employees" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} variant="outline" disabled={isLoading || availableUsers.length === 0 || availableDepartments.length === 0}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Employee
          </Button>
           {(availableUsers.length === 0 || availableDepartments.length === 0) && !isLoading && (
            <p className="text-xs text-muted-foreground mt-1">
              Cannot add employee: Ensure there are unassigned users and active departments.
            </p>
          )}
        </div>
      </div>
      <div className="rounded-md border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Emp. ID</TableHead>
              <TableHead>Account (Email)</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Hire Date</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length > 0 ? employees.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell className="font-medium">{emp.id}</TableCell>
                <TableCell>
                  <div>{emp.userName}</div>
                  <div className="text-xs text-muted-foreground">{emp.userEmail || 'N/A'}</div>
                </TableCell>
                <TableCell>{emp.position}</TableCell>
                <TableCell>{emp.departmentName || 'N/A'}</TableCell>
                <TableCell>
                  <div className="inline-flex items-center">
                    <CalendarDays className="mr-1 h-4 w-4 text-muted-foreground" />
                    {new Date(emp.hireDate).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={emp.status === 'active' ? 'secondary' : (emp.status === 'on_leave' ? 'outline' : 'destructive')}
                    className={`text-xs inline-flex items-center ${
                      emp.status === 'active' ? 'bg-green-100 text-green-700' : 
                      emp.status === 'on_leave' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                      'bg-red-100 text-red-700'
                    }`}
                  >
                    {emp.status === 'active' ? <UserCheck className="mr-1 h-3 w-3" /> : <UserX className="mr-1 h-3 w-3" />}
                    {emp.status.charAt(0).toUpperCase() + emp.status.slice(1).replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEditDialog(emp)}
                    aria-label="Edit employee"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No employees found. Click "Add Employee" to create one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AddEmployeeDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onEmployeeAdded={handleEmployeeAdded}
        adminUserId={adminUserId}
        availableUsers={availableUsers}
        availableDepartments={availableDepartments.filter(d => d.status === 'active')}
      />

      {editingEmployee && (
        <EditEmployeeDialog
          employee={editingEmployee}
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setEditingEmployee(null);
          }}
          onEmployeeUpdated={handleEmployeeUpdated}
          adminUserId={adminUserId}
          availableDepartments={availableDepartments.filter(d => d.status === 'active')}
        />
      )}
    </>
  );
}

