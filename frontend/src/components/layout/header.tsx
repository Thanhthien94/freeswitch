'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bell, LogOut, Settings, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/providers/UserProvider';
import { ModeToggle } from '@/components/mode-toggle';

export function Header() {
  const router = useRouter();
  const { user, clearUser } = useUser();

  return (
    <header className="flex h-16 items-center justify-between border-b px-6 header-glass">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {user?.displayName || user?.username || 'User'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <ModeToggle />

        {/* Notifications */}
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {user?.displayName?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.displayName || user?.username || 'User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={async () => {
              try {
                console.log('🔍 Logout clicked - clearing user session');

                // 1. Clear user state immediately for better UX
                clearUser();

                // 2. Call backend logout API directly
                const response = await fetch('/api/auth/logout', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                });

                console.log('🔍 Logout API response:', response.status);

                // 3. Navigate to login page
                console.log('🔍 Redirecting to login...');
                router.push('/login');

              } catch (error) {
                console.error('🔍 Logout error:', error);
                // Clear user state and redirect even on error
                clearUser();
                router.push('/login');
              }
            }}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
