'use client';

import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter
} from '@/components/ui/sidebar';
import { 
  Home, 
  Phone, 
  PhoneCall, 
  Mic, 
  Users, 
  Settings, 
  BarChart3, 
  Shield, 
  Database,
  Headphones,
  FileText,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

// Navigation items with permissions
const navigationItems = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard',
        icon: Home,
        permission: 'dashboard:read',
      },
      {
        title: 'Live Calls',
        url: '/dashboard/calls',
        icon: PhoneCall,
        permission: 'calls:read',
      },
    ],
  },
  {
    title: 'Call Management',
    items: [
      {
        title: 'Call History',
        url: '/dashboard/cdr',
        icon: Phone,
        permission: 'cdr:read',
      },
      {
        title: 'Recordings',
        url: '/dashboard/recordings',
        icon: Mic,
        permission: 'recordings:read',
      },
      {
        title: 'Call Analytics',
        url: '/dashboard/analytics',
        icon: BarChart3,
        permission: 'analytics:read',
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        title: 'Users',
        url: '/dashboard/users',
        icon: Users,
        permission: 'users:read',
      },
      {
        title: 'Extensions',
        url: '/dashboard/extensions',
        icon: Headphones,
        permission: 'extensions:read',
      },
      {
        title: 'Reports',
        url: '/dashboard/reports',
        icon: FileText,
        permission: 'reports:read',
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        title: 'System Status',
        url: '/dashboard/status',
        icon: Activity,
        permission: 'system:read',
      },
      {
        title: 'Database',
        url: '/dashboard/database',
        icon: Database,
        permission: 'database:read',
      },
      {
        title: 'Security',
        url: '/dashboard/security',
        icon: Shield,
        permission: 'security:read',
      },
      {
        title: 'Settings',
        url: '/dashboard/settings',
        icon: Settings,
        permission: 'settings:read',
      },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  // Mock user for now - will be replaced with server-side user data
  const user = {
    name: 'Admin User',
    role: 'admin'
  };

  // Simple permission check - will be replaced with server-side RBAC
  const canAccess = (resource: string, action: string) => {
    // For now, admin can access everything
    return user.role === 'admin';
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <Phone className="h-6 w-6" />
          <div>
            <h2 className="text-lg font-semibold">FreeSWITCH PBX</h2>
            <p className="text-sm text-muted-foreground">Management System</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navigationItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items
                  .filter((item) => canAccess(item.permission.split(':')[0], item.permission.split(':')[1]))
                  .map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.url}
                        className={cn(
                          'w-full justify-start',
                          pathname === item.url && 'bg-accent text-accent-foreground'
                        )}
                      >
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-2 text-sm">
          <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user?.name || 'User'}</p>
            <p className="text-muted-foreground truncate">{user?.role || 'user'}</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
