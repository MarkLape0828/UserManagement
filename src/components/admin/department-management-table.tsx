
'use client';

import type { Department } from '@/lib/schemas';
import { getDepartments } from '@/actions/departments';
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
import { Edit, PlusCircle, RefreshCw, Users, Building, ShieldX, ShieldCheck } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { AddDepartmentDialog } from './add-department-dialog';
import { EditDepartmentDialog } from './edit-department-dialog';

export function DepartmentManagementTable() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const { toast } = useToast();

  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
      const fetchedDepartmentsData = await getDepartments();
      // Ensure fetchedDepartmentsData is an array before sorting
      if (Array.isArray(fetchedDepartmentsData)) {
        setDepartments(fetchedDepartmentsData.sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        console.error("fetchDepartments: getDepartments did not return an array.", fetchedDepartmentsData);
        setDepartments([]); // Set to empty array to prevent further errors
        toast({ title: 'Error', description: 'Failed to fetch departments or data is invalid.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch departments.', variant: 'destructive' });
      console.error("Failed to fetch departments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleDepartmentAdded = (newDepartment: Department) => {
    setDepartments(prev => [...prev, newDepartment].sort((a, b) => a.name.localeCompare(b.name)));
    setIsAddDialogOpen(false);
  };

  const handleOpenEditDialog = (department: Department) => {
    setEditingDepartment(department);
    setIsEditDialogOpen(true);
  };

  const handleDepartmentUpdated = (updatedDepartment: Department) => {
    setDepartments(prev =>
      prev.map(d => d.id === updatedDepartment.id ? updatedDepartment : d)
           .sort((a, b) => a.name.localeCompare(b.name))
    );
    setEditingDepartment(null);
    setIsEditDialogOpen(false);
  };

  if (isLoading && departments.length === 0) {
    return <div className="flex justify-center items-center p-8"><RefreshCw className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading departments...</span></div>;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold inline-flex items-center"><Building className="mr-2 h-5 w-5 text-primary" />Department List</h3>
        <div className="space-x-2">
          <Button onClick={fetchDepartments} variant="outline" size="icon" aria-label="Refresh departments" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Department
          </Button>
        </div>
      </div>
      <div className="rounded-md border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Department Name</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Employees</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.length > 0 ? departments.map((dept) => (
              <TableRow key={dept.id}>
                <TableCell className="font-medium">{dept.name}</TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={dept.status === 'active' ? 'secondary' : 'destructive'}
                    className={`text-xs inline-flex items-center ${dept.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                  >
                    {dept.status === 'active' ? <ShieldCheck className="mr-1 h-3 w-3" /> : <ShieldX className="mr-1 h-3 w-3" />}
                    {dept.status.charAt(0).toUpperCase() + dept.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="inline-flex items-center">
                    <Users className="mr-1 h-4 w-4 text-muted-foreground" />
                    {dept.employeeCount ?? 0}
                  </div>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEditDialog(dept)}
                    aria-label="Edit department"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No departments found. Click "Add Department" to create one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AddDepartmentDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onDepartmentAdded={handleDepartmentAdded}
      />

      {editingDepartment && (
        <EditDepartmentDialog
          department={editingDepartment}
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setEditingDepartment(null);
          }}
          onDepartmentUpdated={handleDepartmentUpdated}
        />
      )}
    </>
  );
}
