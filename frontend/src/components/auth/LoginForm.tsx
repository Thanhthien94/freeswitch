'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Phone, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const LoginForm: React.FC = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle redirect after successful login
  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = searchParams.get('from') || '/dashboard';
      console.log('✅ Login successful, redirecting to:', redirectTo);
      router.push(redirectTo);
    }
  }, [isAuthenticated, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!emailOrUsername || !password) {
      return;
    }

    try {
      await login({ emailOrUsername, password, rememberMe });
      // Redirect will happen automatically via useEffect
    } catch (err) {
      // Error is handled by useAuth hook
      console.error('Login failed:', err);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-blue-600 p-3 rounded-full">
              <Phone className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            FreeSWITCH PBX Enterprise
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Hệ thống quản lý tổng đài doanh nghiệp
          </p>
        </div>

        <div className="flex justify-center">
          {/* Login Form */}
          <Card className="shadow-lg max-w-md w-full">
            <CardHeader>
              <CardTitle>Đăng nhập</CardTitle>
              <CardDescription>
                Nhập thông tin đăng nhập để truy cập hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emailOrUsername">Email hoặc Tên đăng nhập</Label>
                  <Input
                    id="emailOrUsername"
                    type="text"
                    placeholder="Nhập email hoặc tên đăng nhập"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Nhập mật khẩu"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="rememberMe" className="text-sm">
                    Ghi nhớ đăng nhập (7 ngày)
                  </Label>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !emailOrUsername || !password}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang đăng nhập...
                    </>
                  ) : (
                    'Đăng nhập'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <p>FreeSWITCH PBX Enterprise Management System</p>
          <p>Hệ thống quản lý tổng đài doanh nghiệp</p>
        </div>
      </div>
    </div>
  );
};
