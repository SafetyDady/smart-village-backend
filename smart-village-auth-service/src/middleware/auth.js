/**
 * Authentication middleware
 */

const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

/**
 * Middleware to require authentication
 */
const requireAuth = async (req, res, next) => {
  try {
    // Get token from various sources
    let token = null;
    
    // 1. Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // 2. Check cookies
    if (!token && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    
    // 3. Check custom header
    if (!token && req.headers['x-access-token']) {
      token = req.headers['x-access-token'];
    }

    if (!token) {
      return res.status(401).json({
        error: 'Authentication Required',
        message: 'Access token is required'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user details from database
    const userResult = await db.query(`
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, 
             u.is_active, u.last_login, r.name as role_name, 
             r.permissions as role_permissions
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1 AND u.is_active = true
    `, [decoded.id]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid Token',
        message: 'User not found or inactive'
      });
    }

    const user = userResult.rows[0];

    // Check if session is still active (if session token provided)
    const sessionToken = req.cookies.sessionToken || req.headers['x-session-token'];
    if (sessionToken) {
      const sessionResult = await db.query(`
        SELECT id FROM user_sessions
        WHERE session_token = $1 AND user_id = $2 AND is_active = true AND expires_at > NOW()
      `, [sessionToken, user.id]);

      if (sessionResult.rows.length === 0) {
        return res.status(401).json({
          error: 'Session Expired',
          message: 'Session has expired or is invalid'
        });
      }

      // Update session last used time
      await db.query(`
        UPDATE user_sessions 
        SET last_used_at = NOW() 
        WHERE session_token = $1
      `, [sessionToken]);
    }

    // Attach user to request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role_name,
      permissions: user.role_permissions,
      isActive: user.is_active,
      lastLogin: user.last_login
    };

    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid Token',
        message: 'Access token is invalid'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token Expired',
        message: 'Access token has expired'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Authentication Error',
      message: 'An error occurred during authentication'
    });
  }
};

/**
 * Middleware to require specific role
 */
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication Required',
        message: 'User must be authenticated'
      });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({
        error: 'Insufficient Permissions',
        message: `${requiredRole} role required`
      });
    }

    next();
  };
};

/**
 * Middleware to require specific permission
 */
const requirePermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication Required',
        message: 'User must be authenticated'
      });
    }

    const permissions = req.user.permissions;
    
    // SuperAdmin has all permissions
    if (permissions.all === true) {
      return next();
    }

    // Check specific permission
    if (!permissions[resource] || !permissions[resource].includes(action)) {
      return res.status(403).json({
        error: 'Insufficient Permissions',
        message: `Permission '${action}' on '${resource}' required`
      });
    }

    next();
  };
};

/**
 * Middleware to require SuperAdmin role
 */
const requireSuperAdmin = requireRole('superadmin');

/**
 * Middleware to require Admin role or higher
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication Required',
      message: 'User must be authenticated'
    });
  }

  if (!['superadmin', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      error: 'Insufficient Permissions',
      message: 'Admin role or higher required'
    });
  }

  next();
};

/**
 * Optional authentication middleware
 * Adds user info if token is present but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    // Get token from various sources
    let token = null;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    if (!token && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const userResult = await db.query(`
          SELECT u.id, u.username, u.email, u.first_name, u.last_name, 
                 u.is_active, r.name as role_name, r.permissions as role_permissions
          FROM users u
          JOIN roles r ON u.role_id = r.id
          WHERE u.id = $1 AND u.is_active = true
        `, [decoded.id]);

        if (userResult.rows.length > 0) {
          const user = userResult.rows[0];
          req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role_name,
            permissions: user.role_permissions,
            isActive: user.is_active
          };
        }
      } catch (tokenError) {
        // Token is invalid, but that's okay for optional auth
        console.log('Optional auth token error:', tokenError.message);
      }
    }

    next();

  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue even if there's an error
  }
};

/**
 * Check if user has permission for a specific action
 */
const hasPermission = (user, resource, action) => {
  if (!user || !user.permissions) {
    return false;
  }

  const permissions = user.permissions;
  
  // SuperAdmin has all permissions
  if (permissions.all === true) {
    return true;
  }

  // Check specific permission
  return permissions[resource] && permissions[resource].includes(action);
};

/**
 * Check if user has any of the specified roles
 */
const hasRole = (user, roles) => {
  if (!user || !user.role) {
    return false;
  }

  if (typeof roles === 'string') {
    return user.role === roles;
  }

  if (Array.isArray(roles)) {
    return roles.includes(user.role);
  }

  return false;
};

module.exports = {
  requireAuth,
  requireRole,
  requirePermission,
  requireSuperAdmin,
  requireAdmin,
  optionalAuth,
  hasPermission,
  hasRole
};

