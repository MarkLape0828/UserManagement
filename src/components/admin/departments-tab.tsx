
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DepartmentManagementTable } from './department-management-table';

export function DepartmentsTab() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Company Departments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <DepartmentManagementTable />
      </CardContent>
    </Card>
  );
}
