/**
 * User List Component for Smart Village Management System
 * Displays list of users with CRUD operations
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { 
  Users, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Shield, 
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function UserList({ onAddUser, onEditUser }) {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Mock users data (following API contract structure)
  const mockUsers = [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      username: 'superadmin',
      email: 'superadmin@smartvillage.com',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'superadmin',
      permissions: ['all'],
      isActive: true,
      lastLogin: '2025-06-28T08:47:58.815Z',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-06-28T08:47:58.815Z'
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174001',
      username: 'admin1',
      email: 'admin1@smartvillage.com',
      firstName: 'John',
      lastName: 'Administrator',
      role: 'admin',
      permissions: ['user_management', 'property_management', 'financial_management'],
      isActive: true,
      lastLogin: '2025-06-27T15:30:00.000Z',
      createdAt: '2025-01-15T00:00:00.000Z',
      updatedAt: '2025-06-27T15:30:00.000Z'
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174002',
      username: 'manager1',
      email: 'manager1@smartvillage.com',
      firstName: 'Jane',
      lastName: 'Manager',
      role: 'manager',
      permissions: ['property_management', 'financial_management'],
      isActive: true,
      lastLogin: '2025-06-26T10:15:00.000Z',
      createdAt: '2025-02-01T00:00:00.000Z',
      updatedAt: '2025-06-26T10:15:00.000Z'
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174003',
      username: 'staff1',
      email: 'staff1@smartvillage.com',
      firstName: 'Bob',
      lastName: 'Staff',
      role: 'staff',
      permissions: ['property_view'],
      isActive: false,
      lastLogin: '2025-06-20T14:45:00.000Z',
      createdAt: '2025-03-01T00:00:00.000Z',
      updatedAt: '2025-06-25T09:00:00.000Z'
    }
  ];

  // Load users data
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In real implementation, this would be:
        // const response = await apiClient.get('/users');
        // setUsers(response.data);
        
        setUsers(mockUsers);
      } catch (err) {
        setError('Failed to load users. Please try again.');
        console.error('Error loading users:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle delete user
  const handleDeleteUser = async (userId) => {
    try {
      // In real implementation:
      // await apiClient.delete(`/users/${userId}`);
      
      setUsers(users.filter(user => user.id !== userId));
      toast.success('User deleted successfully');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (err) {
      toast.error('Failed to delete user. Please try again.');
      console.error('Error deleting user:', err);
    }
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'superadmin': return 'destructive';
      case 'admin': return 'default';
      case 'manager': return 'secondary';
      case 'staff': return 'outline';
      default: return 'outline';
    }
  };

  // Get status badge
  const getStatusBadge = (isActive) => {
    return isActive ? (
      <Badge variant="outline" className="text-green-600 border-green-600">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="outline" className="text-red-600 border-red-600">
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>User Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading users...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>User Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 font-medium mb-2">Error Loading Users</p>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>User Management</span>
              </CardTitle>
              <CardDescription>
                Manage system users and their permissions
              </CardDescription>
            </div>
            {hasPermission('user_management') && (
              <Button onClick={onAddUser} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add User</span>
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users by name, email, username, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-gray-500">
              {filteredUsers.length} of {users.length} users
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Created</TableHead>
                {hasPermission('user_management') && (
                  <TableHead className="w-[50px]">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={hasPermission('user_management') ? 6 : 5} className="text-center py-8">
                    <div className="text-gray-500">
                      {searchTerm ? 'No users found matching your search.' : 'No users found.'}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-medium">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{user.firstName} {user.lastName}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {user.email}
                          </div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          <Shield className="w-3 h-3 mr-1" />
                          {user.role}
                        </Badge>
                        <div className="text-xs text-gray-500">
                          {user.permissions.includes('all') 
                            ? 'All Permissions' 
                            : `${user.permissions.length} permissions`
                          }
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user.isActive)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(user.lastLogin)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </div>
                    </TableCell>
                    {hasPermission('user_management') && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEditUser(user)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setUserToDelete(user);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete user "{userToDelete?.firstName} {userToDelete?.lastName}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleDeleteUser(userToDelete?.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

