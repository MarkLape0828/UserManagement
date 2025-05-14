
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { UserManagementTable } from './user-management-table'; // Updated import

export function AccountsTab() {
  // This component can remain a server component if UserManagementTable fetches its own data.
  // Or, if initial data fetching is preferred here, this would become async.
  // For simplicity and client-side refresh, UserManagementTable will fetch its own data.
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">User Accounts Management</CardTitle>
        <CardDescription>
          Oversee and manage all user accounts within the system. Add new users, modify existing ones, and manage their status and roles.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* The descriptive text and image can be kept or removed based on preference */}
        <div className="rounded-lg border p-4 bg-secondary/30">
          <h3 className="font-semibold text-md mb-1 text-primary">Key Features:</h3>
          <ul className="list-disc list-inside space-y-0.5 text-sm text-foreground">
            <li>View a comprehensive list of all registered users.</li>
            <li>Add new user accounts with specified roles and credentials.</li>
            <li>Filter and search for specific users (future enhancement).</li>
            <li>Modify user details, roles, and access levels (edit coming soon).</li>
            <li>Activate or deactivate user accounts.</li>
          </ul>
        </div>
        
        <UserManagementTable />
        
        <div className="flex justify-center items-center p-4 mt-6 border-t">
            <Image 
              src="https://placehold.co/500x300.png" 
              alt="User management dashboard graphic"
              data-ai-hint="dashboard user management" 
              width={500} 
              height={300} 
              className="rounded-lg shadow-md opacity-75" 
            />
        </div>
        <p className="text-sm text-muted-foreground pt-4 border-t">
          Ensure all account modifications are performed with caution and adhere to security best practices.
        </p>
      </CardContent>
    </Card>
  );
}
