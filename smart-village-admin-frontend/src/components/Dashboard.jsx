/**
 * Dashboard Component for Smart Village Management System
 * Main dashboard after successful authentication with navigation support
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  LogOut, 
  User, 
  Shield, 
  Clock, 
  Users, 
  Building, 
  DollarSign,
  Settings,
  BarChart3,
  Home
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { 
    user, 
    logout, 
    userName, 
    userInitials, 
    lastLogin, 
    hasRole, 
    hasPermission
  } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Navigation items based on permissions
  const navigationItems = [
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage system users and permissions',
      icon: Users,
      permissions: ['users.read', 'users.create', 'users.update', 'users.delete'], // Check if user has any user-related permission
      onClick: () => navigate('/users-management')
    },
    {
      id: 'properties',
      title: 'Property Management',
      description: 'Manage village properties and assets',
      icon: Building,
      permissions: ['villages.read', 'villages.create', 'villages.update', 'villages.delete'], // Check if user has any village-related permission
      onClick: () => navigate('/properties')
    },
    {
      id: 'financial',
      title: 'Financial Management',
      description: 'Handle financial operations and accounting',
      icon: DollarSign,
      permissions: ['payments.read', 'payments.create', 'payments.update', 'payments.delete'], // Check if user has any payment-related permission
      onClick: () => navigate('/financial-management')
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      description: 'Generate reports and view analytics',
      icon: BarChart3,
      permissions: ['audit.read', 'audit.export'], // Check if user has any audit-related permission
      onClick: () => navigate('/reports-analytics')
    },
    {
      id: 'settings',
      title: 'System Settings',
      description: 'Configure system settings and preferences',
      icon: Settings,
      permissions: ['system.configure', 'system.monitor', 'system.backup', 'system.restore'], // Check if user has any system-related permission
      onClick: () => navigate('/settings')
    }
  ];

  // Check if user has any of the required permissions for each navigation item
  const availableItems = navigationItems.filter(item => 
    item.permissions.some(permission => hasPermission(permission))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back, {userName || user?.username}!
            </h2>
            <p className="text-gray-600">
              Here's what you can do with your current permissions.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* User Info Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">User Profile</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userName}</div>
                <p className="text-xs text-muted-foreground">
                  {user?.email}
                </p>
              </CardContent>
            </Card>

            {/* Role Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Access Level</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user?.role}</div>
                <p className="text-xs text-muted-foreground">
                  {user?.permissions?.includes('all') 
                    ? 'All permissions' 
                    : `${user?.permissions?.length || 0} permissions`
                  }
                </p>
              </CardContent>
            </Card>

            {/* Last Login Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Login</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {lastLogin ? new Date(lastLogin).toLocaleDateString() : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {lastLogin ? new Date(lastLogin).toLocaleTimeString() : 'First login'}
                </p>
              </CardContent>
            </Card>

            {/* Status Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <div className="h-4 w-4 bg-green-500 rounded-full"></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Active</div>
                <p className="text-xs text-muted-foreground">
                  Authentication successful
                </p>
              </CardContent>
            </Card>
          </div>

          {/* User Profile Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Your Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Basic Information</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Name:</span> {user?.firstName} {user?.lastName}</p>
                    <p><span className="text-gray-500">Username:</span> {user?.username}</p>
                    <p><span className="text-gray-500">Email:</span> {user?.email}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Role & Status</h3>
                  <div className="space-y-2">
                    <Badge variant="default" className="flex items-center w-fit">
                      <Shield className="w-3 h-3 mr-1" />
                      {user?.role}
                    </Badge>
                    <p className="text-sm text-gray-500">
                      Last login: {lastLogin ? new Date(lastLogin).toLocaleString() : 'Never'}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Permissions</h3>
                  <div className="text-sm text-gray-600">
                    {user?.permissions?.includes('all') ? (
                      <Badge variant="destructive">All Permissions</Badge>
                    ) : (
                      <p>{user?.permissions?.length || 0} permissions granted</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Cards */}
          {availableItems.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Card 
                      key={item.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={item.onClick}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <IconComponent className="h-5 w-5 text-blue-600" />
                          <span>{item.title}</span>
                        </CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button variant="outline" size="sm" className="w-full">
                          Open {item.title}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Limited Access</h3>
                <p className="text-gray-500">
                  You don't have permissions to access any management features. 
                  Please contact your administrator for access.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Debug Information (Development Mode) */}
          {process.env.NODE_ENV === 'development' && (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-sm text-gray-500">Debug Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>User ID: {user?.id}</p>
                  <p>Role: {user?.role}</p>
                  <p>Permissions: {JSON.stringify(user?.permissions)}</p>
                  <p>Available Features: {availableItems.length}</p>
                  <p>Token: {localStorage.getItem('token') ? 'Present' : 'Missing'}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

