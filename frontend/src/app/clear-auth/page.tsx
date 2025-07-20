'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, LogOut, Trash2 } from 'lucide-react';

export default function ClearAuthPage() {
  const [isClearing, setIsClearing] = useState(false);
  const [isCleared, setIsCleared] = useState(false);
  const [authStatus, setAuthStatus] = useState<{
    hasToken: boolean;
    hasUser: boolean;
    hasRefreshToken: boolean;
  }>({ hasToken: false, hasUser: false, hasRefreshToken: false });
  const router = useRouter();

  // Check current auth status
  useEffect(() => {
    try {
      const hasToken = !!localStorage.getItem('auth_token');
      const hasUser = !!localStorage.getItem('user');
      const hasRefreshToken = !!localStorage.getItem('refresh_token');
      
      setAuthStatus({ hasToken, hasUser, hasRefreshToken });
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
  }, []);

  const handleClearAuth = async () => {
    setIsClearing(true);
    try {
      // Force clear all auth data
      authService.forceClearAuth();
      
      // Also try to clear session cookie
      try {
        await fetch('/api/auth/session', {
          method: 'DELETE',
        });
      } catch (error) {
        console.warn('Failed to clear session cookie:', error);
      }
      
      setIsCleared(true);
      setAuthStatus({ hasToken: false, hasUser: false, hasRefreshToken: false });
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      console.error('Error clearing auth:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleGoToLogin = () => {
    router.push('/login');
  };

  const handleRefreshStatus = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Clear Authentication
          </CardTitle>
          <CardDescription>
            Fix authentication loops and clear stored credentials
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Current Auth Status */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Current Status:</h4>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>Auth Token:</span>
                <span className={authStatus.hasToken ? 'text-green-600' : 'text-gray-400'}>
                  {authStatus.hasToken ? 'Present' : 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>User Data:</span>
                <span className={authStatus.hasUser ? 'text-green-600' : 'text-gray-400'}>
                  {authStatus.hasUser ? 'Present' : 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Refresh Token:</span>
                <span className={authStatus.hasRefreshToken ? 'text-green-600' : 'text-gray-400'}>
                  {authStatus.hasRefreshToken ? 'Present' : 'None'}
                </span>
              </div>
            </div>
          </div>

          {isCleared && (
            <Alert>
              <AlertDescription>
                Authentication data cleared successfully! Redirecting to login...
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Button
              onClick={handleClearAuth}
              disabled={isClearing || isCleared}
              className="w-full"
              variant="destructive"
            >
              {isClearing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All Auth Data
                </>
              )}
            </Button>

            <Button
              onClick={handleRefreshStatus}
              variant="outline"
              className="w-full"
              disabled={isClearing}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Status
            </Button>

            <Button
              onClick={handleGoToLogin}
              variant="outline"
              className="w-full"
              disabled={isClearing}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Go to Login
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            <p>Use this page if you're experiencing authentication loops</p>
            <p>or if the app keeps redirecting between login and dashboard.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
