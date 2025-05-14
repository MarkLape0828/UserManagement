
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserManagementTable } from './user-management-table';

export function AccountsTab() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">User Accounts</CardTitle>
        {/* CardDescription and other descriptive text removed */}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* "Key Features" section and placeholder image removed */}
        <UserManagementTable />
        {/* Final descriptive paragraph removed */}
      </CardContent>
    </Card>
  );
}
