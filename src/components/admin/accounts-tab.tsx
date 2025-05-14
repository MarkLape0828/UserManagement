import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

export function AccountsTab() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">User Accounts Management</CardTitle>
        <CardDescription>
          Oversee and manage all user accounts within the system.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          This section provides tools to view, edit, and manage user roles and permissions. 
          You can also add new users or deactivate existing accounts.
        </p>
        <div className="rounded-lg border p-6 bg-secondary/30">
          <h3 className="font-semibold text-lg mb-2 text-primary">Key Features:</h3>
          <ul className="list-disc list-inside space-y-1 text-foreground">
            <li>View a comprehensive list of all registered users.</li>
            <li>Filter and search for specific users.</li>
            <li>Modify user details, roles, and access levels.</li>
            <li>Activate or deactivate user accounts.</li>
            <li>Reset user passwords (with appropriate security measures).</li>
          </ul>
        </div>
        <div className="flex justify-center items-center p-4">
            <Image 
              src="https://placehold.co/600x400.png" 
              alt="Accounts Management Visual"
              data-ai-hint="user interface management" 
              width={600} 
              height={400} 
              className="rounded-lg shadow-md" 
            />
        </div>
        <p className="text-sm text-muted-foreground pt-4 border-t">
          Ensure all account modifications are performed with caution and adhere to security best practices.
        </p>
      </CardContent>
    </Card>
  );
}
