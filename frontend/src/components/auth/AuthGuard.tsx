'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = true,
  redirectTo = '/login',
  fallback
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isLoading) {
      // Still checking authentication status
      return;
    }

    if (requireAuth && !isAuthenticated) {
      // Need auth but not authenticated - redirect to login
      console.log('🚫 Not authenticated, redirecting to login');
      const loginUrl = `${redirectTo}?from=${encodeURIComponent(pathname)}`;
      router.push(loginUrl);
      return;
    }

    if (!requireAuth && isAuthenticated && pathname === '/login') {
      // Don't need auth but authenticated and on login page - redirect to dashboard
      console.log('✅ Already authenticated, redirecting to dashboard');
      router.push('/dashboard');
      return;
    }

    // All checks passed, render the component
    setShouldRender(true);
  }, [isAuthenticated, isLoading, requireAuth, pathname, router, redirectTo]);

  // Show loading while checking authentication
  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting
  if (!shouldRender) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Convenience components
export const ProtectedPage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthGuard requireAuth={true}>
    {children}
  </AuthGuard>
);

export const PublicPage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthGuard requireAuth={false}>
    {children}
  </AuthGuard>
);
