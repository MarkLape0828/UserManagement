
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logout } from '@/actions/auth';
import type { UserSession } from '@/lib/auth';
import { LogOut } from 'lucide-react';
import { useTransition } from 'react';

interface UserNavProps {
  user: UserSession;
}

export function UserNav({ user }: UserNavProps) {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    const firstInitial = firstName ? firstName[0] : '';
    const lastInitial = lastName ? lastName[0] : '';
    return (firstInitial + lastInitial).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            {/* Placeholder for user image if available */}
            {/* <AvatarImage src="/avatars/01.png" alt={`${user.firstName} ${user.lastName}`} /> */}
            <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.firstName} {user.lastName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* Removed Dashboard/Profile Link Group */}
        <DropdownMenuItem onClick={handleLogout} disabled={isPending}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isPending ? 'Logging out...' : 'Log out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
