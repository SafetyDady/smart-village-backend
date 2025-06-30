/**
 * Enhanced Authentication Context for Smart Village Management System
 * Provides authentication state with village scope integration
 */

import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';

// Enhanced Authentication Context
const EnhancedAuthContext = createContext(null);

// Authentication Actions
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REFRESH_TOKEN: 'REFRESH_TOKEN',
  SET_USER: 'SET_USER',
  SET_CURRENT_VILLAGE: 'SET_CURRENT_VILLAGE',
  SET_USER_VILLAGES: 'SET_USER_VILLAGES',
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
  lastLogin: null,
  currentVillage: null,
  userVillages: [],
  villagePermissions: {}
};

// Enhanced Authentication Reducer
function enhancedAuthReducer(state, action) {
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
        lastLogin: action.payload.lastLogin || new Date().toISOString(),
        userVillages: action.payload.userVillages || [],
        currentVillage: action.payload.currentVillage || null,
        villagePermissions: action.payload.villagePermissions || {}
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
        currentVillage: null,
        userVillages: [],
        villagePermissions: {}
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState
      };

    case AUTH_ACTIONS.REFRESH_TOKEN:
      return {
        ...state,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken
      };

    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload.user
      };

    case AUTH_ACTIONS.SET_CURRENT_VILLAGE:
      return {
        ...state,
        currentVillage: action.payload.village,
        villagePermissions: {
          ...state.villagePermissions,
          [action.payload.village?.id]: action.payload.permissions || []
        }
      };

    case AUTH_ACTIONS.SET_USER_VILLAGES:
      return {
        ...state,
        userVillages: action.payload.villages,
        villagePermissions: action.payload.villagePermissions || state.villagePermissions
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

// Enhanced Authentication Provider Component
export function EnhancedAuthProvider({ children }) {
  const [state, dispatch] = useReducer(enhancedAuthReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load authentication state from localStorage on mount
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');
        const user = localStorage.getItem('user');
        const lastLogin = localStorage.getItem('last_login');
        const currentVillage = localStorage.getItem('current_village');
        const userVillages = localStorage.getItem('user_villages');

        if (token && user) {
          const userData = JSON.parse(user);
          
          // Transform permissions and roles for backward compatibility
          const transformPermissions = (permissions) => {
            if (Array.isArray(permissions)) {
              return permissions;
            }
            
            if (typeof permissions === 'object' && permissions !== null) {
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
            
            return [];
          };

          const enhancePermissionsForSuperAdmin = (permissions, role) => {
            if (role === 'superadmin' && Array.isArray(permissions)) {
              const enhancedPermissions = [...permissions];
              if (!enhancedPermissions.includes('system.emergency_override')) {
                enhancedPermissions.push('system.emergency_override');
              }
              return enhancedPermissions;
            }
            return permissions;
          };

          const transformedPermissions = transformPermissions(userData.permissions);
          const enhancedPermissions = enhancePermissionsForSuperAdmin(transformedPermissions, userData.role);

          const enhancedUserData = {
            ...userData,
            permissions: enhancedPermissions
          };

          // Load village data
          let parsedCurrentVillage = null;
          let parsedUserVillages = [];
          
          try {
            if (currentVillage) {
              parsedCurrentVillage = JSON.parse(currentVillage);
            }
            if (userVillages) {
              parsedUserVillages = JSON.parse(userVillages);
            }
          } catch (e) {
            console.warn('Error parsing village data:', e);
          }

          // If user is village admin but no current village, set first village as current
          if (userData.role === 'village_admin' && parsedUserVillages.length > 0 && !parsedCurrentVillage) {
            parsedCurrentVillage = parsedUserVillages[0];
            localStorage.setItem('current_village', JSON.stringify(parsedCurrentVillage));
          }

          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: {
              user: enhancedUserData,
              token,
              refreshToken,
              lastLogin,
              currentVillage: parsedCurrentVillage,
              userVillages: parsedUserVillages,
              villagePermissions: {}
            }
          });

          // Load village-specific permissions if needed
          if (parsedCurrentVillage && userData.role === 'village_admin') {
            await loadVillagePermissions(parsedCurrentVillage.id);
          }
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('last_login');
        localStorage.removeItem('current_village');
        localStorage.removeItem('user_villages');
      } finally {
        setIsInitialized(true);
      }
    };

    loadAuthState();
  }, []);

  // Save authentication state to localStorage
  useEffect(() => {
    if (isInitialized) {
      if (state.isAuthenticated && state.token && state.user) {
        localStorage.setItem('access_token', state.token);
        localStorage.setItem('refresh_token', state.refreshToken || '');
        localStorage.setItem('user', JSON.stringify(state.user));
        localStorage.setItem('last_login', state.lastLogin || '');
        localStorage.setItem('current_village', JSON.stringify(state.currentVillage));
        localStorage.setItem('user_villages', JSON.stringify(state.userVillages));
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('last_login');
        localStorage.removeItem('current_village');
        localStorage.removeItem('user_villages');
      }
    }
  }, [state.isAuthenticated, state.token, state.user, state.refreshToken, state.lastLogin, 
      state.currentVillage, state.userVillages, isInitialized]);

  // Load village-specific permissions
  const loadVillagePermissions = async (villageId) => {
    try {
      // This would typically be an API call
      // For now, we'll use mock data
      const mockVillagePermissions = [
        'properties.read',
        'properties.create',
        'properties.update',
        'payments.read',
        'payments.create',
        'residents.read',
        'residents.update'
      ];

      dispatch({
        type: AUTH_ACTIONS.SET_CURRENT_VILLAGE,
        payload: {
          village: state.currentVillage,
          permissions: mockVillagePermissions
        }
      });
    } catch (error) {
      console.error('Error loading village permissions:', error);
    }
  };

  // Load user villages
  const loadUserVillages = async () => {
    try {
      // This would typically be an API call
      // For now, we'll use mock data
      const mockUserVillages = [
        {
          id: 1,
          name: 'หมู่บ้านสมาร์ทวิลเลจ 1',
          province: 'กรุงเทพมหานคร',
          district: 'บางรัก',
          status: 'active'
        },
        {
          id: 2,
          name: 'หมู่บ้านเทคโนโลยี',
          province: 'กรุงเทพมหานคร',
          district: 'สาทร',
          status: 'active'
        }
      ];

      dispatch({
        type: AUTH_ACTIONS.SET_USER_VILLAGES,
        payload: {
          villages: mockUserVillages
        }
      });

      return mockUserVillages;
    } catch (error) {
      console.error('Error loading user villages:', error);
      return [];
    }
  };

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
          return permissions;
        }
        
        if (typeof permissions === 'object' && permissions !== null) {
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
        
        return [];
      };

      const enhancePermissionsForSuperAdmin = (permissions, role) => {
        if (role === 'superadmin' && Array.isArray(permissions)) {
          const enhancedPermissions = [...permissions];
          if (!enhancedPermissions.includes('system.emergency_override')) {
            enhancedPermissions.push('system.emergency_override');
          }
          return enhancedPermissions;
        }
        return permissions;
      };

      const transformedPermissions = transformPermissions(data.user.permissions);
      const enhancedPermissions = enhancePermissionsForSuperAdmin(transformedPermissions, data.user.role);

      const enhancedUserData = {
        ...data.user,
        permissions: enhancedPermissions
      };

      // Load user villages if village admin
      let userVillages = [];
      let currentVillage = null;
      
      if (data.user.role === 'village_admin') {
        userVillages = await loadUserVillages();
        if (userVillages.length > 0) {
          currentVillage = userVillages[0]; // Set first village as current
        }
      }

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: enhancedUserData,
          token: data.access_token,
          refreshToken: data.refresh_token,
          lastLogin: new Date().toISOString(),
          userVillages,
          currentVillage
        }
      });

      // Load village permissions if needed
      if (currentVillage) {
        await loadVillagePermissions(currentVillage.id);
      }

      return { success: true, user: enhancedUserData };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: errorMessage }
      });

      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      // Optional: Call logout API
      // await authApi.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  const refreshToken = async () => {
    try {
      if (!state.refreshToken) {
        throw new Error('No refresh token available');
      }

      const { authApi } = await import('../services/apiClient');
      const data = await authApi.refreshToken(state.refreshToken);

      dispatch({
        type: AUTH_ACTIONS.REFRESH_TOKEN,
        payload: {
          token: data.access_token,
          refreshToken: data.refresh_token
        }
      });

      return data.access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
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

  // Village Management Methods
  const setCurrentVillage = async (village) => {
    dispatch({
      type: AUTH_ACTIONS.SET_CURRENT_VILLAGE,
      payload: { village }
    });

    // Load village-specific permissions
    if (village && state.user?.role === 'village_admin') {
      await loadVillagePermissions(village.id);
    }
  };

  // Enhanced Permission Checking
  const hasPermission = (permission, villageId = null) => {
    if (!state.user || !state.user.permissions) {
      return false;
    }

    // Super admin has all permissions
    if (state.user.role === 'superadmin') {
      return true;
    }

    // For village admin, check village-specific permissions
    if (state.user.role === 'village_admin') {
      // If villageId is specified, check for that specific village
      if (villageId) {
        const villagePermissions = state.villagePermissions[villageId] || [];
        return villagePermissions.includes(permission);
      }
      
      // If no villageId specified, check current village permissions
      if (state.currentVillage) {
        const villagePermissions = state.villagePermissions[state.currentVillage.id] || [];
        return villagePermissions.includes(permission);
      }
      
      // Fallback to user permissions
      return state.user.permissions.includes(permission);
    }

    // Regular permission check for other roles
    const permissions = Array.isArray(state.user.permissions) 
      ? state.user.permissions 
      : [];

    if (permissions.includes('all')) {
      return true;
    }

    return permissions.includes(permission);
  };

  // Check if user has access to specific village
  const hasVillageAccess = (villageId) => {
    if (!state.user) {
      return false;
    }

    // Super admin has access to all villages
    if (state.user.role === 'superadmin') {
      return true;
    }

    // Village admin has access only to assigned villages
    if (state.user.role === 'village_admin') {
      return state.userVillages.some(village => village.id === villageId);
    }

    return false;
  };

  // Check if user has specific role
  const hasRole = (role) => {
    if (!state.user || !state.user.role) {
      return false;
    }

    return state.user.role === role;
  };

  // Get current village permissions
  const getCurrentVillagePermissions = () => {
    if (!state.currentVillage) {
      return [];
    }
    
    return state.villagePermissions[state.currentVillage.id] || [];
  };

  // Context value
  const value = {
    // State
    ...state,
    isInitialized,
    
    // Methods
    login,
    logout,
    refreshToken,
    updateUser,
    clearError,
    hasPermission,
    hasRole,
    hasVillageAccess,
    setCurrentVillage,
    loadUserVillages,
    getCurrentVillagePermissions,

    // Computed properties
    isAdmin: hasRole('admin') || hasRole('superadmin'),
    isSuperAdmin: hasRole('superadmin'),
    isVillageAdmin: hasRole('village_admin'),
    userName: state.user ? `${state.user.first_name || ''} ${state.user.last_name || ''}`.trim() : null,
    userInitials: state.user ? `${state.user.first_name?.[0] || ''}${state.user.last_name?.[0] || ''}` : null,
    
    // Village-specific computed properties
    canManageMultipleVillages: state.userVillages.length > 1,
    currentVillageName: state.currentVillage?.name || null,
    availableVillages: state.userVillages || []
  };

  return (
    <EnhancedAuthContext.Provider value={value}>
      {children}
    </EnhancedAuthContext.Provider>
  );
}

// Custom hook to use the Enhanced Authentication Context
export function useEnhancedAuth() {
  const context = useContext(EnhancedAuthContext);
  if (!context) {
    throw new Error('useEnhancedAuth must be used within an EnhancedAuthProvider');
  }
  return context;
}

// Export the context for direct access if needed
export { EnhancedAuthContext };

export default EnhancedAuthContext;

