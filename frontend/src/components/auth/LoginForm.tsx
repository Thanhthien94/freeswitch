'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Phone, Shield, Clock, Building, Eye, EyeOff, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { testApiConnection } from '@/utils/api-test';

export const LoginForm: React.FC = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Test API connection on mount
  useEffect(() => {
    const checkApiConnection = async () => {
      const result = await testApiConnection();
      setApiStatus(result.success ? 'connected' : 'disconnected');

      if (!result.success) {
        console.error('API Connection Failed:', result);
      }
    };

    checkApiConnection();
  }, []);

  // Demo accounts for easy testing
  const demoAccounts = [
    {
      id: 'admin',
      name: 'System Administrator',
      email: 'admin@localhost',
      password: 'admin123',
      role: 'SuperAdmin',
      description: 'Full system access with all permissions',
      icon: Shield,
      clearance: 'CRITICAL',
      color: 'bg-red-100 text-red-800',
    },
    {
      id: 'manager',
      name: 'Department Manager',
      email: 'manager@localhost',
      password: 'manager123',
      role: 'DepartmentManager',
      description: 'Department management and team oversight',
      icon: Building,
      clearance: 'HIGH',
      color: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'agent',
      name: 'Call Center Agent',
      email: 'agent@localhost',
      password: 'agent123',
      role: 'Agent',
      description: 'Basic call handling and customer service',
      icon: Phone,
      clearance: 'LOW',
      color: 'bg-green-100 text-green-800',
    },
  ];

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

  const handleDemoLogin = async (account: typeof demoAccounts[0]) => {
    clearError();
    setEmailOrUsername(account.email);
    setPassword(account.password);
    
    try {
      await login({ 
        emailOrUsername: account.email, 
        password: account.password, 
        rememberMe 
      });
    } catch (err) {
      console.error('Demo login failed:', err);
    }
  };

  const getCurrentTimeStatus = () => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    const isBusinessHours = day >= 1 && day <= 5 && hour >= 9 && hour < 18;

    return (
      <div className="flex items-center justify-center space-x-2 text-sm">
        <Clock className="w-4 h-4" />
        <span className={isBusinessHours ? 'text-green-600' : 'text-orange-600'}>
          {isBusinessHours ? 'Business Hours' : 'Outside Business Hours'}
        </span>
      </div>
    );
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
            Advanced ABAC/RBAC Authentication System
          </p>
          <div className="flex items-center justify-center space-x-4 mt-2">
            {getCurrentTimeStatus()}
            <div className="flex items-center space-x-2 text-sm">
              {apiStatus === 'checking' && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-gray-600">Checking API...</span>
                </>
              )}
              {apiStatus === 'connected' && (
                <>
                  <Wifi className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">API Connected</span>
                </>
              )}
              {apiStatus === 'disconnected' && (
                <>
                  <WifiOff className="w-4 h-4 text-red-600" />
                  <span className="text-red-600">API Disconnected</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* API Status Alert */}
        {apiStatus === 'disconnected' && (
          <Alert variant="destructive" className="mb-6">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>Backend API Disconnected</strong></p>
                <p className="text-sm">
                  Cannot connect to NestJS backend at <code>{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}</code>
                </p>
                <p className="text-sm">
                  Demo accounts will work with mock data. Real authentication requires backend connection.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Login Form */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Enter your credentials to access the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emailOrUsername">Email or Username</Label>
                  <Input
                    id="emailOrUsername"
                    type="text"
                    placeholder="admin@localhost or admin"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
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
                    Remember me (7 days)
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
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Demo Accounts */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Demo Accounts</CardTitle>
              <CardDescription>
                Quick access to test different roles and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {demoAccounts.map((account) => (
                <div
                  key={account.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <account.icon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{account.name}</h3>
                        <p className="text-sm text-gray-500">{account.description}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="outline" className={account.color}>
                            {account.role}
                          </Badge>
                          <Badge variant="outline">
                            <Shield className="w-3 h-3 mr-1" />
                            {account.clearance}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDemoLogin(account)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Login'
                      )}
                    </Button>
                  </div>
                  <div className="mt-3 text-xs text-gray-400">
                    <div>Email: {account.email}</div>
                    <div>Password: {account.password}</div>
                  </div>
                </div>
              ))}

              <Separator />

              <div className="text-xs text-gray-500 space-y-1">
                <p><strong>Security Features:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Role-based access control (RBAC)</li>
                  <li>Attribute-based access control (ABAC)</li>
                  <li>Business hours restrictions</li>
                  <li>Security clearance levels</li>
                  <li>Domain isolation</li>
                  <li>Comprehensive audit logging</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>FreeSWITCH PBX Enterprise Management System</p>
          <p>Powered by Advanced ABAC/RBAC Security Framework</p>
        </div>
      </div>
    </div>
  );
};
