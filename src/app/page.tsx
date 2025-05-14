import { getUserSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ADMIN_DASHBOARD_PATH, EMPLOYEE_PROFILE_PATH } from '@/lib/constants';
import { LogIn, UserPlus } from 'lucide-react';

export default async function HomePage() {
  const session = await getUserSession();

  if (session) {
    if (session.role === 'admin') {
      redirect(ADMIN_DASHBOARD_PATH);
    } else {
      redirect(EMPLOYEE_PROFILE_PATH);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <header>
          <h1 className="text-5xl font-bold tracking-tight text-primary">
            User Management System
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Streamlining access and roles with efficiency and clarity.
          </p>
        </header>
        
        <section className="space-y-6 rounded-lg bg-card p-8 shadow-xl">
          <h2 className="text-2xl font-semibold text-card-foreground">
            Welcome!
          </h2>
          <p className="text-muted-foreground">
            Please log in to access your dashboard or register for a new account.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/login">
                <LogIn className="mr-2 h-5 w-5" /> Log In
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/register">
                <UserPlus className="mr-2 h-5 w-5" /> Register
              </Link>
            </Button>
          </div>
        </section>

        <footer className="mt-12 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} User Management App. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
