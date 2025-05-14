import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

export function DepartmentsTab() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Company Departments</CardTitle>
        <CardDescription>
          Organize and manage the structure of company departments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Define new departments, assign heads of department, and view departmental hierarchies and employee distributions.
        </p>
        <div className="rounded-lg border p-6 bg-secondary/30">
          <h3 className="font-semibold text-lg mb-2 text-primary">Departmental Tools:</h3>
          <ul className="list-disc list-inside space-y-1 text-foreground">
            <li>Create, edit, or remove company departments.</li>
            <li>Assign managers or heads to each department.</li>
            <li>Visualize the organizational chart and departmental structures.</li>
            <li>Allocate resources and budgets at the department level.</li>
            <li>Track departmental goals and performance metrics.</li>
          </ul>
        </div>
        <div className="flex justify-center items-center p-4">
            <Image 
              src="https://placehold.co/600x400.png" 
              alt="Department Management Visual"
              data-ai-hint="organization chart"
              width={600} 
              height={400} 
              className="rounded-lg shadow-md" 
            />
        </div>
        <p className="text-sm text-muted-foreground pt-4 border-t">
          Effective department management is key to organizational efficiency and clear communication channels.
        </p>
      </CardContent>
    </Card>
  );
}
