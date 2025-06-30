/**
 * Login Form Component for Smart Village Management System
 * Provides authentication interface with form validation
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, LogIn, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';

// Validation schema
const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
  
  rememberMe: z.boolean().optional()
});

export default function LoginForm({ onSuccess, className = '' }) {
  const { login, isLoading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false
    }
  });

  // Watch form values for real-time validation feedback
  const watchedValues = watch();

  // Handle login attempts and blocking
  useEffect(() => {
    if (loginAttempts >= 5) {
      setIsBlocked(true);
      setBlockTimeRemaining(300); // 5 minutes
      
      const timer = setInterval(() => {
        setBlockTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsBlocked(false);
            setLoginAttempts(0);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [loginAttempts]);

  // Clear error when user starts typing
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Handle form submission
  const onSubmit = async (data) => {
    if (isBlocked) {
      return;
    }

    try {
      const result = await login(data);
      
      if (result.success) {
        setLoginAttempts(0);
        reset();
        onSuccess?.(result.data);
      } else {
        setLoginAttempts(prev => prev + 1);
      }
    } catch (err) {
      setLoginAttempts(prev => prev + 1);
      console.error('Login error:', err);
    }
  };

  // Format block time remaining
  const formatBlockTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get field validation status
  const getFieldStatus = (fieldName) => {
    const hasError = errors[fieldName];
    const hasValue = watchedValues[fieldName]?.length > 0;
    const isValid = hasValue && !hasError;
    
    return { hasError, hasValue, isValid };
  };

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Smart Village Login
          </CardTitle>
          <CardDescription className="text-gray-600">
            Enter your credentials to access the management system
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Block Alert */}
          {isBlocked && (
            <Alert variant="destructive" className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-orange-800">
                Too many failed attempts. Please wait {formatBlockTime(blockTimeRemaining)} before trying again.
              </AlertDescription>
            </Alert>
          )}

          {/* Login Attempts Warning */}
          {loginAttempts >= 3 && loginAttempts < 5 && !isBlocked && (
            <Alert variant="destructive" className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-yellow-800">
                Warning: {5 - loginAttempts} attempts remaining before account is temporarily locked.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                Username
              </Label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  disabled={isLoading || isSubmitting || isBlocked}
                  className={`pr-10 ${
                    getFieldStatus('username').hasError 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : getFieldStatus('username').isValid
                      ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  {...register('username')}
                />
                {getFieldStatus('username').isValid && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
              </div>
              {errors.username && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  disabled={isLoading || isSubmitting || isBlocked}
                  className={`pr-10 ${
                    getFieldStatus('password').hasError 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : getFieldStatus('password').isValid
                      ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading || isSubmitting || isBlocked}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center space-x-2">
              <input
                id="rememberMe"
                type="checkbox"
                disabled={isLoading || isSubmitting || isBlocked}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                {...register('rememberMe')}
              />
              <Label 
                htmlFor="rememberMe" 
                className="text-sm text-gray-700 cursor-pointer select-none"
              >
                Remember me for 7 days
              </Label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || isSubmitting || isBlocked}
              className="w-full bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading || isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          {/* Test Credentials Info */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg border">
            <p className="text-xs text-gray-600 font-medium mb-2">Test Credentials:</p>
            <div className="space-y-1 text-xs text-gray-500">
              <p><strong>Username:</strong> superadmin</p>
              <p><strong>Password:</strong> SmartVillage2025!</p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 mt-4">
            Smart Village Management System v1.0.0
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

