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
  Headphones,
  FileText,
  Activity,
  DollarSign,
  Monitor,
  Lock,
  Building,
  Network,
  Link as LinkIcon
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

import { PermissionGate } from '@/components/auth/PermissionGate';

// Navigation items with permissions and role requirements
const navigationItems = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard',
        icon: Home,
        permission: 'calls:read', // Basic permission for dashboard access
      },
      {
        title: 'Live Calls',
        url: '/dashboard/live-calls',
        icon: PhoneCall,
        permission: 'calls:read',
      },
    ],
  },
  {
    title: 'Call Management',
    items: [
      {
        title: 'Call History (CDR)',
        url: '/dashboard/cdr',
        icon: Phone,
        permission: 'cdr:read',
        requireBusinessHours: true,
      },
      {
        title: 'Recordings',
        url: '/dashboard/recordings',
        icon: Mic,
        permission: 'recordings:read',
        requireMinimumClearance: 'HIGH',
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
    title: 'User Management',
    items: [
      {
        title: 'Users',
        url: '/dashboard/users',
        icon: Users,
        permission: 'users:read',
        requireAnyRole: ['SuperAdmin', 'DomainAdmin', 'DepartmentManager', 'Supervisor'],
      },
      {
        title: 'Extensions',
        url: '/dashboard/extensions',
        icon: Headphones,
        permission: 'extensions:read',
        requireAnyRole: ['SuperAdmin', 'DomainAdmin', 'TechnicalManager', 'NetworkAdmin', 'PBXAdmin'],
      },
      {
        title: 'SIP Profiles',
        url: '/dashboard/sip-profiles',
        icon: Network,
        permission: 'sip-profiles:read',
        requireAnyRole: ['SuperAdmin', 'DomainAdmin', 'TechnicalManager', 'NetworkAdmin', 'PBXAdmin'],
      },
      {
        title: 'Extension-Profile Management',
        url: '/dashboard/extension-profiles',
        icon: LinkIcon,
        permission: 'extensions:read',
        requireAnyRole: ['SuperAdmin', 'DomainAdmin', 'TechnicalManager', 'NetworkAdmin', 'PBXAdmin'],
      },
    ],
  },
  {
    title: 'Reports & Analytics',
    items: [
      {
        title: 'Reports',
        url: '/dashboard/reports',
        icon: FileText,
        permission: 'reports:read',
      },
      {
        title: 'Advanced Analytics',
        url: '/dashboard/analytics/advanced',
        icon: BarChart3,
        permission: 'analytics:execute',
        requireAnyRole: ['SuperAdmin', 'DomainAdmin', 'DepartmentManager', 'ReportAnalyst'],
      },
    ],
  },
  {
    title: 'Financial',
    items: [
      {
        title: 'Billing',
        url: '/dashboard/billing',
        icon: DollarSign,
        permission: 'billing:read',
        requireMinimumClearance: 'HIGH',
        requireBusinessHours: true,
        requireAnyRole: ['SuperAdmin', 'BillingAdmin', 'DomainAdmin'],
      },
    ],
  },
  {
    title: 'System Administration',
    items: [
      {
        title: 'System Status',
        url: '/dashboard/status',
        icon: Activity,
        permission: 'monitoring:read',
        requireAnyRole: ['SuperAdmin', 'SystemAdmin', 'TechnicalManager'],
      },
      {
        title: 'Configuration',
        url: '/dashboard/config',
        icon: Settings,
        permission: 'config:read',
        requireAnyRole: ['SuperAdmin', 'SystemAdmin', 'TechnicalManager'],
      },
      {
        title: 'Monitoring',
        url: '/dashboard/monitoring',
        icon: Monitor,
        permission: 'monitoring:execute',
        requireAnyRole: ['SuperAdmin', 'SystemAdmin', 'TechnicalManager'],
      },
    ],
  },
  {
    title: 'Security & Compliance',
    items: [
      {
        title: 'Security Dashboard',
        url: '/dashboard/security',
        icon: Shield,
        permission: 'security:read',
        requireMinimumClearance: 'HIGH',
        requireAnyRole: ['SuperAdmin', 'SecurityAdmin', 'DomainAdmin'],
      },
      {
        title: 'Audit Logs',
        url: '/dashboard/audit',
        icon: Lock,
        permission: 'security:read',
        requireMinimumClearance: 'HIGH',
        requireAnyRole: ['SuperAdmin', 'SecurityAdmin', 'DomainAdmin'],
      },
    ],
  },
  {
    title: 'Domain Management',
    items: [
      {
        title: 'Domains',
        url: '/dashboard/domains',
        icon: Building,
        permission: 'domain:read',
        requireAnyRole: ['SuperAdmin', 'DomainAdmin'],
      },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

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
                {group.items.map((item) => {
                  const isActive = pathname === item.url;

                  return (
                    <PermissionGate
                      key={item.title}
                      requirePermissions={item.permission ? [item.permission] : undefined}
                    >
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className={cn(
                            'w-full justify-start',
                            isActive && 'bg-accent text-accent-foreground'
                          )}
                        >
                          <Link href={item.url}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </PermissionGate>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-2 text-sm">
          <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
            {user?.displayName?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user?.displayName || user?.username || 'User'}</p>
            <p className="text-muted-foreground truncate">{user?.primaryRole || 'user'}</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
