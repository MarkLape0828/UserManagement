import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountsTab } from './accounts-tab';
import { EmployeesTab } from './employees-tab';
import { DepartmentsTab } from './departments-tab';
import { RequestsTab } from './requests-tab';
import { Users, Briefcase, Building, FileText } from 'lucide-react';

export function AdminDashboard() {
  return (
    <Tabs defaultValue="accounts" className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto md:h-12 rounded-lg shadow-sm">
        <TabsTrigger value="accounts" className="py-2 md:py-3 text-sm md:text-base">
          <Users className="mr-2 h-5 w-5" /> Accounts
        </TabsTrigger>
        <TabsTrigger value="employees" className="py-2 md:py-3 text-sm md:text-base">
          <Briefcase className="mr-2 h-5 w-5" /> Employees
        </TabsTrigger>
        <TabsTrigger value="departments" className="py-2 md:py-3 text-sm md:text-base">
          <Building className="mr-2 h-5 w-5" /> Departments
        </TabsTrigger>
        <TabsTrigger value="requests" className="py-2 md:py-3 text-sm md:text-base">
          <FileText className="mr-2 h-5 w-5" /> Requests
        </TabsTrigger>
      </TabsList>
      <TabsContent value="accounts" className="mt-6">
        <AccountsTab />
      </TabsContent>
      <TabsContent value="employees" className="mt-6">
        <EmployeesTab />
      </TabsContent>
      <TabsContent value="departments" className="mt-6">
        <DepartmentsTab />
      </TabsContent>
      <TabsContent value="requests" className="mt-6">
        <RequestsTab />
      </TabsContent>
    </Tabs>
  );
}
