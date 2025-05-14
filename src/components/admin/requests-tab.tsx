import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

export function RequestsTab() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">User Requests and Support</CardTitle>
        <CardDescription>
          Track and manage various requests submitted by users.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          This area is for handling support tickets, access requests, leave applications, or any other type of formal request from employees.
        </p>
        <div className="rounded-lg border p-6 bg-secondary/30">
          <h3 className="font-semibold text-lg mb-2 text-primary">Request Management System:</h3>
          <ul className="list-disc list-inside space-y-1 text-foreground">
            <li>View pending, in-progress, and resolved requests.</li>
            <li>Assign requests to relevant personnel or departments.</li>
            <li>Update request statuses and add comments or resolutions.</li>
            <li>Generate reports on request types, resolution times, and workloads.</li>
            <li>Automate notifications for request updates.</li>
          </ul>
        </div>
        <div className="flex justify-center items-center p-4">
            <Image 
              src="https://placehold.co/600x400.png" 
              alt="Requests Management Visual"
              data-ai-hint="support tickets"
              width={600} 
              height={400} 
              className="rounded-lg shadow-md" 
            />
        </div>
        <p className="text-sm text-muted-foreground pt-4 border-t">
          Timely and efficient handling of user requests contributes to overall employee satisfaction and operational smoothness.
        </p>
      </CardContent>
    </Card>
  );
}
