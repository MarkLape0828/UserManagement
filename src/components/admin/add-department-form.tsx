
'use client';

import type { Department } from '@/lib/schemas';
import { addDepartment } from '@/actions/departments';
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
import { useToast } from '@/hooks/use-toast';
import { AddDepartmentSchema, type AddDepartmentFormData } from '@/lib/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';

interface AddDepartmentFormProps {
  onSuccess: (newDepartment: Department) => void;
  onCancel: () => void;
}

export function AddDepartmentForm({ onSuccess, onCancel }: AddDepartmentFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<AddDepartmentFormData>({
    resolver: zodResolver(AddDepartmentSchema),
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = (data: AddDepartmentFormData) => {
    startTransition(async () => {
      const result = await addDepartment(data);
      if (result.success && result.department) {
        toast({
          title: 'Department Added',
          description: result.message,
        });
        onSuccess(result.department);
        form.reset();
        onCancel(); // Close dialog
      } else {
        toast({
          title: 'Failed to Add Department',
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Engineering" {...field} disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
              </>
            ) : (
              'Add Department'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
