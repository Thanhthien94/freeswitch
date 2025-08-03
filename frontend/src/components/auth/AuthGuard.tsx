'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUserClient } from '@/lib/auth-client';
import { User } from '@/types/auth';
import { UserProvider } from '@/components/providers/UserProvider';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = '/login' 
}: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 AuthGuard: Checking authentication...');
        console.log('🔍 AuthGuard: Current pathname:', window.location.pathname);
        console.log('🔍 AuthGuard: requireAuth:', requireAuth);
        console.log('🔍 AuthGuard: redirectTo:', redirectTo);

        const currentUser = await getCurrentUserClient();
        console.log('🔍 AuthGuard: User found:', currentUser ? 'YES' : 'NO');

        setUser(currentUser);

        if (requireAuth && !currentUser) {
          console.log('🔍 AuthGuard: Redirecting to login - no user');
          router.push(redirectTo);
          return;
        }

        if (!requireAuth && currentUser) {
          console.log('🔍 AuthGuard: Redirecting to dashboard - user already authenticated');
          console.log('🔍 AuthGuard: Current path starts with /dashboard?', window.location.pathname.startsWith('/dashboard'));
          // Only redirect if we're on a public route, not if we're already on dashboard
          if (!window.location.pathname.startsWith('/dashboard')) {
            console.log('🔍 AuthGuard: Executing redirect to /dashboard');
            router.push('/dashboard');
          } else {
            console.log('🔍 AuthGuard: Already on dashboard, no redirect needed');
          }
          return;
        }

        console.log('🔍 AuthGuard: No redirect needed, proceeding normally');
        
      } catch (error) {
        console.error('🔍 AuthGuard: Error checking auth:', error);
        if (requireAuth) {
          router.push(redirectTo);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [requireAuth, redirectTo, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null; // Will redirect
  }

  if (!requireAuth && user) {
    return null; // Will redirect
  }

  return (
    <UserProvider initialUser={user}>
      {children}
    </UserProvider>
  );
}

// Convenience components
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth={true}>
      {children}
    </AuthGuard>
  );
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth={false}>
      {children}
    </AuthGuard>
  );
}
