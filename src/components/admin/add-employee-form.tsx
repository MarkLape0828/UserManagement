
'use client';

import type { EnrichedEmployee } from '@/actions/employees';
import { addEmployee } from '@/actions/employees';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useToast } from '@/hooks/use-toast';
import { AddEmployeeSchema, type AddEmployeeFormData, EmployeeStatusSchema } from '@/lib/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, CalendarIcon } from 'lucide-react';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { AppUserProfile } from '@/services/userService'; // Updated import
import type { Department } from '@/lib/schemas';

interface AddEmployeeFormProps {
  onSuccess: (newEmployee: EnrichedEmployee) => void;
  onCancel: () => void;
  adminUserId: string;
  availableUsers: AppUserProfile[]; // Updated type
  availableDepartments: Department[];
}

export function AddEmployeeForm({ 
  onSuccess, 
  onCancel, 
  adminUserId,
  availableUsers,
  availableDepartments
}: AddEmployeeFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<AddEmployeeFormData>({
    resolver: zodResolver(AddEmployeeSchema),
    defaultValues: {
      userId: '',
      position: '',
      departmentId: '',
      hireDate: undefined, 
      status: 'active',
    },
  });

  const onSubmit = (data: AddEmployeeFormData) => {
    startTransition(async () => {
      const result = await addEmployee(data, adminUserId);
      if (result.success && result.employee) {
        toast({
          title: 'Employee Added',
          description: result.message,
        });
        onSuccess(result.employee);
        form.reset();
      } else {
        toast({
          title: 'Failed to Add Employee',
          description: result.message,
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>User Account</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending || availableUsers.length === 0}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user account" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableUsers.map(user => (
                    <SelectItem key={user.uid} value={user.uid}> {/* Use uid */}
                      {user.firstName} {user.lastName} ({user.email})
                    </SelectItem>
                  ))}
                  {availableUsers.length === 0 && <SelectItem value="no_users" disabled>No available users</SelectItem>}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="position"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Position</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Software Engineer" {...field} disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="departmentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending || availableDepartments.length === 0}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a department" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableDepartments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                  {availableDepartments.length === 0 && <SelectItem value="no_depts" disabled>No active departments</SelectItem>}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hireDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Hire Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                      disabled={isPending}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01") || isPending
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {EmployeeStatusSchema.options.map(statusValue => (
                     <SelectItem key={statusValue} value={statusValue}>
                       {statusValue.charAt(0).toUpperCase() + statusValue.slice(1).replace('_', ' ')}
                     </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || availableUsers.length === 0 || availableDepartments.length === 0}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
              </>
            ) : (
              'Add Employee'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
