import { SiteHeader } from '@/components/layout/site-header';
import { getUserSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const session = await getUserSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <SiteHeader user={session} />
      <main className="flex-1">{children}</main>
      <footer className="py-6 md:px-8 md:py-0 bg-card border-t">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} User Management App.
          </p>
        </div>
      </footer>
    </div>
  );
}
