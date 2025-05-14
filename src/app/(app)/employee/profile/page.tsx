import { EmployeeProfile } from '@/components/employee/employee-profile';
import { getUserSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function EmployeeProfilePage() {
  const session = await getUserSession();

  if (!session) {
    redirect('/login');
  }

  // Although middleware should handle role access, an additional check here is good practice.
  // If a non-employee (e.g. admin) lands here by mistake, they could be redirected.
  // For now, we assume if they have a session, they are an employee or admin (who might also view their own profile).

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <EmployeeProfile user={session} />
    </div>
  );
}
