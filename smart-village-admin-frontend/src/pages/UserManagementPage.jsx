/**
 * User Management Page for Smart Village Management System
 * Integrates UserList and UserForm components
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UserList from '../components/users/UserList';
import UserForm from '../components/users/UserForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Shield, AlertCircle } from 'lucide-react';

export default function UserManagementPage() {
  const { hasPermission } = useAuth();
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [users, setUsers] = useState([]);

  // Check if user has permission to access this page
  if (!hasPermission('user_management')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <Shield className="h-5 w-5" />
              <span>Access Denied</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You don't have permission to access User Management. 
                Please contact your administrator if you need access to this feature.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle add user
  const handleAddUser = () => {
    setEditingUser(null);
    setUserFormOpen(true);
  };

  // Handle edit user
  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserFormOpen(true);
  };

  // Handle save user (both add and edit)
  const handleSaveUser = (savedUser) => {
    if (editingUser) {
      // Update existing user
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === savedUser.id ? savedUser : user
        )
      );
    } else {
      // Add new user
      setUsers(prevUsers => [...prevUsers, savedUser]);
    }
    
    setUserFormOpen(false);
    setEditingUser(null);
  };

  // Handle close form
  const handleCloseForm = () => {
    setUserFormOpen(false);
    setEditingUser(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-2">
          Manage system users, roles, and permissions
        </p>
      </div>

      {/* User List Component */}
      <UserList 
        onAddUser={handleAddUser}
        onEditUser={handleEditUser}
      />

      {/* User Form Dialog */}
      <UserForm
        open={userFormOpen}
        onClose={handleCloseForm}
        user={editingUser}
        onSave={handleSaveUser}
      />
    </div>
  );
}

