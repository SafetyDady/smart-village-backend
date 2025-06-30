import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Get active item from current path
  const getActiveItem = () => {
    const path = location.pathname;
    if (path.includes('users-management')) return 'users';
    if (path.includes('village-management')) return 'villages';
    if (path.includes('user-village-assignment')) return 'user-villages';
    if (path.includes('emergency-override')) return 'emergency-override';
    if (path.includes('properties')) return 'properties';
    if (path.includes('financial-management')) return 'financial';
    if (path.includes('reports-analytics')) return 'reports';
    if (path.includes('settings')) return 'settings';
    if (path.includes('help-support')) return 'help';
    return 'dashboard';
  };

  // Don't render layout if not authenticated
  if (!isAuthenticated) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        onToggleSidebar={handleToggleSidebar}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed}
        onToggle={handleToggleSidebar}
        activeItem={getActiveItem()}
      />

      {/* Main Content */}
      <main className={`transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      } mt-16 p-6`}>
        <Outlet />
      </main>
    </div>
  );
}

