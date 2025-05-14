
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmployeeManagementTable } from './employee-management-table';
import { getUserSession } from '@/lib/auth'; // Needed to pass adminUserId for audit logging

export async function EmployeesTab() {
  const session = await getUserSession();
  const adminUserId = session?.id || 'unknown_admin'; // Fallback if session is somehow null

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Employee Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <EmployeeManagementTable adminUserId={adminUserId} />
      </CardContent>
    </Card>
  );
}
