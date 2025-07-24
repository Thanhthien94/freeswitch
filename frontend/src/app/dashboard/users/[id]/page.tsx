'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Edit,
  Shield,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  User as UserIcon,
  Building,
  Settings,
  Activity,
  Key,
  Smartphone,
  Globe,
  UserCheck,
  UserX,
  AlertTriangle
} from 'lucide-react';
import { userService, User } from '@/services/user.service';
import { useToast } from '@/hooks/use-toast';

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const userId = parseInt(params.id as string);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userActivity, setUserActivity] = useState<any[]>([]);
  const [userSessions, setUserSessions] = useState<any[]>([]);

  useEffect(() => {
    if (userId) {
      loadUserDetails();
      loadUserActivity();
      loadUserSessions();
    }
  }, [userId]);

  const loadUserDetails = async () => {
    try {
      setLoading(true);
      const userData = await userService.getUserById(userId);
      setUser(userData);
    } catch (error) {
      console.error('Error loading user details:', error);
      toast({
        title: "Error",
        description: "Failed to load user details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserActivity = async () => {
    try {
      const activity = await userService.getUserActivity(userId, 30);
      setUserActivity(activity);
    } catch (error) {
      console.error('Error loading user activity:', error);
    }
  };

  const loadUserSessions = async () => {
    try {
      const sessions = await userService.getUserSessions(userId);
      setUserSessions(sessions);
    } catch (error) {
      console.error('Error loading user sessions:', error);
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    
    try {
      await userService.toggleUserStatus(userId, newStatus as any);
      toast({
        title: "Success",
        description: `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
      });
      loadUserDetails();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async () => {
    if (!confirm('Are you sure you want to reset this user\'s password?')) {
      return;
    }

    try {
      const result = await userService.resetPassword(userId);
      toast({
        title: "Password Reset",
        description: `Temporary password: ${result.temporaryPassword}`,
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: "Failed to reset password",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'suspended': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">User Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested user could not be found.</p>
          <Button onClick={() => router.push('/dashboard/users')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push('/dashboard/users')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
            <p className="text-muted-foreground">
              Manage user information and settings
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleResetPassword}>
            <Key className="mr-2 h-4 w-4" />
            Reset Password
          </Button>
          <Button 
            variant={user.status === 'active' ? 'destructive' : 'default'}
            onClick={handleToggleStatus}
          >
            {user.status === 'active' ? (
              <>
                <UserX className="mr-2 h-4 w-4" />
                Deactivate
              </>
            ) : (
              <>
                <UserCheck className="mr-2 h-4 w-4" />
                Activate
              </>
            )}
          </Button>
          <Button onClick={() => router.push(`/dashboard/users/${userId}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit User
          </Button>
        </div>
      </div>

      {/* User Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.profilePicture} alt={user.displayName} />
              <AvatarFallback className="text-lg">
                {getInitials(user.displayName)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-2xl font-bold">{user.displayName}</h2>
                <Badge className={`${getStatusColor(user.status)} text-white`}>
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </Badge>
                {user.twoFactorEnabled && (
                  <Badge variant="outline">
                    <Shield className="mr-1 h-3 w-3" />
                    2FA Enabled
                  </Badge>
                )}
              </div>
              
              <p className="text-muted-foreground mb-4">@{user.username}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user.email}</span>
                  {user.isEmailVerified && (
                    <Badge variant="outline" className="text-xs">Verified</Badge>
                  )}
                </div>
                
                {user.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user.phone}</span>
                    {user.isPhoneVerified && (
                      <Badge variant="outline" className="text-xs">Verified</Badge>
                    )}
                  </div>
                )}
                
                {user.department && (
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user.department}</span>
                  </div>
                )}
                
                {user.position && (
                  <div className="flex items-center space-x-2">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user.position}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user.domain?.displayName || user.domain?.name}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <p className="text-sm">
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user.displayName
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm">{user.email}</p>
                </div>
                {user.phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="text-sm">{user.phone}</p>
                  </div>
                )}
                {user.timezone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Timezone</label>
                    <p className="text-sm">{user.timezone}</p>
                  </div>
                )}
                {user.language && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Language</label>
                    <p className="text-sm">{user.language}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Username</label>
                  <p className="text-sm">@{user.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Domain</label>
                  <p className="text-sm">{user.domain?.displayName || user.domain?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge className={`${getStatusColor(user.status)} text-white`}>
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm">{new Date(user.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="text-sm">{new Date(user.updatedAt).toLocaleString()}</p>
                </div>
                {user.lastLoginAt && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Login</label>
                    <p className="text-sm">{new Date(user.lastLoginAt).toLocaleString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Roles & Permissions</CardTitle>
              <CardDescription>
                User roles and associated permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Primary Role</label>
                  <div className="mt-1">
                    <Badge variant="default">{user.primaryRole}</Badge>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">All Roles</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {user.roles.map(role => (
                      <Badge key={role} variant="secondary">{role}</Badge>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Permissions</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                    {user.permissions.map(permission => (
                      <div key={permission} className="text-sm bg-muted p-2 rounded">
                        {permission}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                User activity over the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userActivity.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No recent activity found
                </p>
              ) : (
                <div className="space-y-4">
                  {userActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border rounded">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Current and recent user sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userSessions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No active sessions found
                </p>
              ) : (
                <div className="space-y-4">
                  {userSessions.map((session, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{session.device || 'Unknown Device'}</p>
                          <p className="text-xs text-muted-foreground">
                            {session.ipAddress} • {new Date(session.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => userService.terminateUserSession(userId, session.id)}
                      >
                        Terminate
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to the account
                  </p>
                </div>
                <Badge variant={user.twoFactorEnabled ? "default" : "secondary"}>
                  {user.twoFactorEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Verification</p>
                  <p className="text-sm text-muted-foreground">
                    Email address verification status
                  </p>
                </div>
                <Badge variant={user.isEmailVerified ? "default" : "secondary"}>
                  {user.isEmailVerified ? "Verified" : "Unverified"}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Phone Verification</p>
                  <p className="text-sm text-muted-foreground">
                    Phone number verification status
                  </p>
                </div>
                <Badge variant={user.isPhoneVerified ? "default" : "secondary"}>
                  {user.isPhoneVerified ? "Verified" : "Unverified"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
