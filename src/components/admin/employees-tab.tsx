import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

export function EmployeesTab() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Employee Records</CardTitle>
        <CardDescription>
          Manage and view detailed information about all employees.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Access and update employee profiles, track employment history, and manage employee-specific data.
        </p>
        <div className="rounded-lg border p-6 bg-secondary/30">
          <h3 className="font-semibold text-lg mb-2 text-primary">Functionalities:</h3>
          <ul className="list-disc list-inside space-y-1 text-foreground">
            <li>Maintain up-to-date employee contact information and personal details.</li>
            <li>Track job roles, departments, and reporting structures.</li>
            <li>Manage employment start dates, contract details, and performance reviews.</li>
            <li>Oversee leave requests and attendance records.</li>
            <li>Securely store and access employee-related documents.</li>
          </ul>
        </div>
         <div className="flex justify-center items-center p-4">
            <Image 
              src="https://placehold.co/600x400.png" 
              alt="Employee Management Visual"
              data-ai-hint="team office"
              width={600} 
              height={400} 
              className="rounded-lg shadow-md" 
            />
        </div>
        <p className="text-sm text-muted-foreground pt-4 border-t">
          Handle all employee data with strict confidentiality and in compliance with data protection regulations.
        </p>
      </CardContent>
    </Card>
  );
}
