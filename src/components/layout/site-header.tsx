import Link from 'next/link';
import { UserNav } from './user-nav';
import type { UserSession } from '@/lib/auth';
import { Building2 } from 'lucide-react'; // Using a generic icon for the app logo

interface SiteHeaderProps {
  user: UserSession;
}

export function SiteHeader({ user }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block">
            User Management
          </span>
        </Link>
        
        {/* Placeholder for MainNav if needed in the future
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/docs"
            className="text-foreground/60 transition-colors hover:text-foreground/80"
          >
            Documentation
          </Link>
        </nav> 
        */}

        <div className="flex flex-1 items-center justify-end space-x-4">
          <UserNav user={user} />
        </div>
      </div>
    </header>
  );
}
