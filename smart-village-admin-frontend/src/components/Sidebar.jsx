import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { 
  Home,
  Users, 
  Building, 
  MapPin,
  DollarSign,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

export default function Sidebar({ collapsed, onToggle, activeItem }) {
  const navigate = useNavigate();
  const { 
    user, 
    logout, 
    hasPermission,
    isAuthenticated
  } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Menu items with permission checks
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      path: '/dashboard',
      permissions: [], // Dashboard accessible to all authenticated users
      onClick: () => navigate('/dashboard')
    },
    {
      id: 'users',
      label: 'Users Management',
      icon: Users,
      path: '/users-management',
      permissions: ['users.read', 'users.create', 'users.update', 'users.delete'],
      onClick: () => navigate('/users-management')
    },
    {
      id: 'villages',
      label: 'Village Management',
      icon: MapPin,
      path: '/village-management',
      permissions: ['villages.read', 'villages.create', 'villages.update', 'villages.delete'],
      onClick: () => navigate('/village-management')
    },
    {
      id: 'user-villages',
      label: 'User-Village Assignment',
      icon: Users,
      path: '/user-village-assignment',
      permissions: ['users.read', 'villages.read', 'users.update'],
      onClick: () => navigate('/user-village-assignment')
    },
    {
      id: 'emergency-override',
      label: 'Emergency Override',
      icon: AlertTriangle,
      path: '/emergency-override',
      permissions: ['system.emergency_override'],
      onClick: () => navigate('/emergency-override'),
      superAdminOnly: true
    },
    {
      id: 'properties',
      label: 'Property Management',
      icon: Building,
      path: '/properties',
      permissions: ['properties.read', 'properties.create', 'properties.update', 'properties.delete'],
      onClick: () => navigate('/properties')
    },
    {
      id: 'financial',
      label: 'Financial Management',
      icon: DollarSign,
      path: '/financial-management',
      permissions: ['payments.read', 'payments.create', 'payments.update', 'payments.delete'],
      onClick: () => navigate('/financial-management')
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: BarChart3,
      path: '/reports-analytics',
      permissions: ['audit.read', 'audit.export'],
      onClick: () => navigate('/reports-analytics')
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/settings',
      permissions: ['system.configure', 'system.monitor', 'system.backup', 'system.restore'],
      onClick: () => navigate('/settings')
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: HelpCircle,
      path: '/help-support',
      permissions: [], // Help accessible to all authenticated users
      onClick: () => navigate('/help-support')
    }
  ];

  // Filter menu items based on permissions
  const availableItems = menuItems.filter(item => {
    // Check if item is for Super Admin only
    if (item.superAdminOnly && user?.role !== 'superadmin') {
      return false;
    }
    
    // If no permissions required, show to all authenticated users
    if (item.permissions.length === 0) {
      return true;
    }
    
    // Check if user has any of the required permissions
    return item.permissions.some(permission => hasPermission(permission));
  });

  return (
    <div className={`bg-white shadow-lg border-r transition-all duration-300 fixed left-0 top-16 bottom-0 z-40 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex flex-col h-full">
        {/* Toggle Button */}
        <div className="p-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="w-full flex items-center justify-center"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2">
          {availableItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeItem === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={item.onClick}
                className={`w-full justify-start ${collapsed ? 'px-2' : 'px-4'} ${
                  isActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
                }`}
              >
                <IconComponent className={`h-4 w-4 ${collapsed ? '' : 'mr-3'}`} />
                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </Button>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t">
          {!collapsed && (
            <div className="mb-3 text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full text-sm font-medium mx-auto mb-2">
                {user?.first_name?.[0] || user?.username?.[0] || 'U'}
              </div>
              <p className="text-xs text-gray-600 truncate">
                {user?.first_name || user?.username || 'User'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user?.role || 'User'}
              </p>
            </div>
          )}
          
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className={`w-full ${collapsed ? 'px-2' : 'px-4'}`}
          >
            <LogOut className={`h-4 w-4 ${collapsed ? '' : 'mr-2'}`} />
            {!collapsed && <span>Logout</span>}
          </Button>
        </div>
      </div>
    </div>
  );
}

