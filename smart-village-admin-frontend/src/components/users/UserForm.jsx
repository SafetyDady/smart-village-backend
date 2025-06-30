/**
 * User Form Component for Smart Village Management System
 * Handles both Add and Edit user operations
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { 
  User, 
  Mail, 
  Shield, 
  Key, 
  Save, 
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

// User form validation schema (following API contract)
const userSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  firstName: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters'),
  role: z.enum(['superadmin', 'admin', 'manager', 'staff'], {
    required_error: 'Please select a role'
  }),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
    .optional(),
  confirmPassword: z.string().optional(),
  isActive: z.boolean().default(true),
  permissions: z.array(z.string()).default([])
}).refine((data) => {
  if (data.password && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Available permissions based on API contract
const AVAILABLE_PERMISSIONS = [
  { id: 'user_management', label: 'User Management', description: 'Create, edit, and delete users' },
  { id: 'property_management', label: 'Property Management', description: 'Manage village properties' },
  { id: 'financial_management', label: 'Financial Management', description: 'Handle financial operations' },
  { id: 'property_view', label: 'Property View', description: 'View property information' },
  { id: 'report_generation', label: 'Report Generation', description: 'Generate system reports' },
  { id: 'system_settings', label: 'System Settings', description: 'Configure system settings' }
];

// Role-based default permissions
const ROLE_PERMISSIONS = {
  superadmin: ['all'],
  admin: ['user_management', 'property_management', 'financial_management', 'report_generation'],
  manager: ['property_management', 'financial_management', 'report_generation'],
  staff: ['property_view']
};

export default function UserForm({ 
  open, 
  onClose, 
  user = null, 
  onSave 
}) {
  const [loading, setLoading] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  
  const isEdit = !!user;
  const title = isEdit ? 'Edit User' : 'Add New User';
  const description = isEdit 
    ? 'Update user information and permissions' 
    : 'Create a new user account for the system';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    clearErrors
  } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      role: 'staff',
      password: '',
      confirmPassword: '',
      isActive: true,
      permissions: []
    }
  });

  const watchedRole = watch('role');

  // Initialize form when user data changes
  useEffect(() => {
    if (user && open) {
      reset({
        username: user.username || '',
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role || 'staff',
        isActive: user.isActive ?? true,
        permissions: user.permissions || []
      });
      setSelectedPermissions(user.permissions || []);
    } else if (open && !user) {
      reset({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        role: 'staff',
        password: '',
        confirmPassword: '',
        isActive: true,
        permissions: []
      });
      setSelectedPermissions(ROLE_PERMISSIONS.staff);
    }
  }, [user, open, reset]);

  // Update permissions when role changes
  useEffect(() => {
    if (watchedRole && !isEdit) {
      const defaultPermissions = ROLE_PERMISSIONS[watchedRole] || [];
      setSelectedPermissions(defaultPermissions);
      setValue('permissions', defaultPermissions);
    }
  }, [watchedRole, isEdit, setValue]);

  // Handle permission toggle
  const handlePermissionToggle = (permissionId) => {
    if (watchedRole === 'superadmin') {
      // Superadmin always has all permissions
      return;
    }

    const newPermissions = selectedPermissions.includes(permissionId)
      ? selectedPermissions.filter(p => p !== permissionId)
      : [...selectedPermissions, permissionId];
    
    setSelectedPermissions(newPermissions);
    setValue('permissions', newPermissions);
  };

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      clearErrors();

      // Prepare user data according to API contract
      const userData = {
        username: data.username,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        isActive: data.isActive,
        permissions: data.role === 'superadmin' ? ['all'] : selectedPermissions
      };

      // Add password for new users or if password is provided for edit
      if (!isEdit || data.password) {
        userData.password = data.password;
      }

      // In real implementation, this would be:
      // if (isEdit) {
      //   await apiClient.put(`/users/${user.id}`, userData);
      // } else {
      //   await apiClient.post('/users', userData);
      // }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock response for demonstration
      const savedUser = {
        id: isEdit ? user.id : `123e4567-e89b-12d3-a456-${Date.now()}`,
        ...userData,
        createdAt: isEdit ? user.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: isEdit ? user.lastLogin : null
      };

      onSave(savedUser);
      toast.success(isEdit ? 'User updated successfully' : 'User created successfully');
      onClose();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(isEdit ? 'Failed to update user' : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    if (!loading) {
      reset();
      setSelectedPermissions([]);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    {...register('firstName')}
                    placeholder="Enter first name"
                    disabled={loading}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    {...register('lastName')}
                    placeholder="Enter last name"
                    disabled={loading}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  {...register('username')}
                  placeholder="Enter username"
                  disabled={loading || isEdit}
                />
                {errors.username && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.username.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="Enter email address"
                  disabled={loading}
                />
                {errors.email && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.email.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Security & Role */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Security & Role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select 
                  value={watchedRole} 
                  onValueChange={(value) => setValue('role', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.role.message}
                  </p>
                )}
              </div>

              {(!isEdit || watchedRole !== 'superadmin') && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Password {!isEdit && '*'}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      {...register('password')}
                      placeholder={isEdit ? "Leave blank to keep current" : "Enter password"}
                      disabled={loading}
                    />
                    {errors.password && (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm Password {!isEdit && '*'}
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...register('confirmPassword')}
                      placeholder="Confirm password"
                      disabled={loading}
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  {...register('isActive')}
                  disabled={loading}
                />
                <Label htmlFor="isActive">Active User</Label>
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Permissions</CardTitle>
              <CardDescription>
                {watchedRole === 'superadmin' 
                  ? 'Super Admin has all permissions by default'
                  : 'Select the permissions for this user'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {watchedRole === 'superadmin' ? (
                <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span className="text-blue-800 font-medium">All Permissions Granted</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {AVAILABLE_PERMISSIONS.map((permission) => (
                    <div key={permission.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={permission.id}
                        checked={selectedPermissions.includes(permission.id)}
                        onCheckedChange={() => handlePermissionToggle(permission.id)}
                        disabled={loading}
                      />
                      <div className="flex-1">
                        <Label htmlFor={permission.id} className="font-medium">
                          {permission.label}
                        </Label>
                        <p className="text-sm text-gray-500">{permission.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Saving...' : (isEdit ? 'Update User' : 'Create User')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

