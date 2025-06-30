/**
 * Authentication Context for Smart Village Management System
 * Provides authentication state and methods throughout the application
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Authentication Context
const AuthContext = createContext(null);

// Authentication Actions
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REFRESH_TOKEN: 'REFRESH_TOKEN',
  SET_USER: 'SET_USER',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Initial State
const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  lastLogin: null
};

// Authentication Reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        lastLogin: new Date().toISOString()
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState
      };

    case AUTH_ACTIONS.REFRESH_TOKEN:
      return {
        ...state,
        token: action.payload.token
      };

    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload.user
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
}

// Authentication Provider Component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load authentication state from localStorage on mount
  useEffect(() => {
    const loadAuthState = () => {
      try {
        const token = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');
        const user = localStorage.getItem('user');
        const lastLogin = localStorage.getItem('last_login');

        if (token && user) {
          const userData = JSON.parse(user);
          
          // Transform permissions and roles for backward compatibility
          const transformPermissions = (permissions) => {
            if (Array.isArray(permissions)) {
              return permissions; // Already in correct format
            }
            
            if (typeof permissions === 'object' && permissions !== null) {
              // Convert object structure to flat array
              const permissionArray = [];
              Object.keys(permissions).forEach(resource => {
                const actions = permissions[resource];
                if (Array.isArray(actions)) {
                  actions.forEach(action => {
                    permissionArray.push(`${resource}.${action}`);
                  });
                }
              });
              return permissionArray;
            }
            
            return []; // Fallback to empty array
          };

          const enhancePermissionsForSuperAdmin = (permissions, role) => {
            // Add emergency override permission for superadmin
            if (role === 'superadmin' && Array.isArray(permissions)) {
              const enhancedPermissions = [...permissions];
              if (!enhancedPermissions.includes('system.emergency_override')) {
                enhancedPermissions.push('system.emergency_override');
              }
              return enhancedPermissions;
            }
            return permissions;
          };

          const transformRoles = (role, roles) => {
            // Check if roles array exists first
            if (Array.isArray(roles)) {
              return roles;
            }
            
            // If single role string exists, convert to array
            if (typeof role === 'string') {
              // Capitalize first letter to match expected format
              const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1);
              return [capitalizedRole];
            }
            
            return []; // Fallback to empty array
          };
          
          // Normalize user data to ensure arrays
          const normalizedUser = {
            ...userData,
            permissions: enhancePermissionsForSuperAdmin(transformPermissions(userData.permissions), userData.role),
            roles: transformRoles(userData.role, userData.roles),
            // Map field names if needed
            first_name: userData.firstName || userData.first_name,
            last_name: userData.lastName || userData.last_name
          };

          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: {
              token,
              refreshToken,
              user: normalizedUser
            }
          });
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        // Clear corrupted data
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('last_login');
      }
    };

    loadAuthState();
  }, []);

  // Save authentication state to localStorage
  useEffect(() => {
    if (state.isAuthenticated && state.token && state.user) {
      localStorage.setItem('access_token', state.token);
      localStorage.setItem('refresh_token', state.refreshToken || '');
      localStorage.setItem('user', JSON.stringify(state.user));
      localStorage.setItem('last_login', state.lastLogin || '');
    } else {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('last_login');
    }
  }, [state.isAuthenticated, state.token, state.user, state.refreshToken, state.lastLogin]);

  // Authentication Methods
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      // Use API client instead of direct fetch
      const { authApi } = await import('../services/apiClient');
      const data = await authApi.login(credentials);

      // Transform Production API structure to Frontend expected structure
      const transformPermissions = (permissions) => {
        if (Array.isArray(permissions)) {
          return permissions; // Already in correct format
        }
        
        if (typeof permissions === 'object' && permissions !== null) {
          // Convert object structure to flat array
          const permissionArray = [];
          Object.keys(permissions).forEach(resource => {
            const actions = permissions[resource];
            if (Array.isArray(actions)) {
              actions.forEach(action => {
                permissionArray.push(`${resource}.${action}`);
              });
            }
          });
          return permissionArray;
        }
        
        return []; // Fallback to empty array
      };

      const enhancePermissionsForSuperAdmin = (permissions, role) => {
        // Add emergency override permission for superadmin
        if (role === 'superadmin' && Array.isArray(permissions)) {
          const enhancedPermissions = [...permissions];
          if (!enhancedPermissions.includes('system.emergency_override')) {
            enhancedPermissions.push('system.emergency_override');
          }
          return enhancedPermissions;
        }
        return permissions;
      };

      const transformRoles = (role, roles) => {
        // Check if roles array exists first
        if (Array.isArray(roles)) {
          return roles;
        }
        
        // If single role string exists, convert to array
        if (typeof role === 'string') {
          // Capitalize first letter to match expected format
          const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1);
          return [capitalizedRole];
        }
        
        return []; // Fallback to empty array
      };

      // Normalize user data to ensure arrays
      const normalizedUser = {
        ...data.user,
        permissions: enhancePermissionsForSuperAdmin(transformPermissions(data.user.permissions), data.user.role),
        roles: transformRoles(data.user.role, data.user.roles),
        // Map field names if needed
        first_name: data.user.firstName || data.user.first_name,
        last_name: data.user.lastName || data.user.last_name
      };

      // Handle different token structures
      const accessToken = data.tokens?.accessToken || data.access_token || data.token;
      const refreshToken = data.tokens?.refreshToken || data.refresh_token || data.refreshToken;

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: normalizedUser,
          token: accessToken,
          refreshToken: refreshToken
        }
      });

      return { success: true, data };
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: error.message }
      });
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      // Use API client for logout
      const { authApi } = await import('../services/apiClient');
      await authApi.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API call fails
    }

    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

  const refreshToken = async () => {
    if (!state.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      // Use API client for token refresh
      const { authApi } = await import('../services/apiClient');
      const data = await authApi.refreshToken(state.refreshToken);

      dispatch({
        type: AUTH_ACTIONS.REFRESH_TOKEN,
        payload: { token: data.token }
      });

      return data.token;
    } catch (error) {
      // If refresh fails, logout user
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      throw error;
    }
  };

  const updateUser = (userData) => {
    dispatch({
      type: AUTH_ACTIONS.SET_USER,
      payload: { user: userData }
    });
  };

  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Check if user has specific permission
  const hasPermission = (permission) => {
    if (!state.user || !state.user.permissions) {
      return false;
    }

    // Ensure permissions is an array
    const permissions = Array.isArray(state.user.permissions) 
      ? state.user.permissions 
      : [];

    // Superadmin has all permissions
    if (permissions.includes('all')) {
      return true;
    }

    return permissions.includes(permission);
  };

  // Check if user has specific role
  const hasRole = (role) => {
    if (!state.user || !state.user.roles) {
      return false;
    }

    // Ensure roles is an array
    const roles = Array.isArray(state.user.roles) 
      ? state.user.roles 
      : [];

    return roles.includes(role);
  };

  // Context value
  const value = {
    // State
    ...state,
    
    // Methods
    login,
    logout,
    refreshToken,
    updateUser,
    clearError,
    hasPermission,
    hasRole,

    // Computed properties
    isAdmin: hasRole('Admin') || hasRole('SuperAdmin'),
    isSuperAdmin: hasRole('SuperAdmin'),
    userName: state.user ? `${state.user.first_name || ''} ${state.user.last_name || ''}`.trim() : null,
    userInitials: state.user ? `${state.user.first_name?.[0] || ''}${state.user.last_name?.[0] || ''}` : null
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use authentication context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// HOC for components that require authentication
export function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600">
              Please log in to access this page.
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

export default AuthContext;

