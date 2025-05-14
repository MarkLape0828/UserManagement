
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { getUserSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminPage() {
  const session = await getUserSession();

  if (!session || session.role !== 'admin') {
    // This should ideally be caught by middleware, but as a fallback:
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight text-primary">Admin Panel</CardTitle>
          <CardDescription className="text-lg">
            Welcome, {session.firstName} {session.lastName}. Manage users, departments, and system settings.
          </CardDescription>
        </CardHeader>
      </Card>
      <AdminDashboard />
    </div>
  );
}
