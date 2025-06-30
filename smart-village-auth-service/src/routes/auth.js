/**
 * Authentication routes
 */

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');

const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { createAuditLog } = require('../utils/auditLogger');

const router = express.Router();

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const loginValidation = [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character')
];

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Generate JWT tokens
 */
function generateTokens(user) {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role_name,
    permissions: user.role_permissions
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });

  return { accessToken, refreshToken };
}

/**
 * Create user session
 */
async function createSession(userId, refreshToken, req) {
  const sessionToken = uuidv4();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const deviceInfo = {
    userAgent: req.headers['user-agent'],
    platform: req.headers['sec-ch-ua-platform'],
    mobile: req.headers['sec-ch-ua-mobile'] === '?1'
  };

  await db.query(`
    INSERT INTO user_sessions (
      user_id, session_token, refresh_token, expires_at, refresh_expires_at,
      ip_address, user_agent, device_info
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [
    userId, sessionToken, refreshToken, expiresAt, refreshExpiresAt,
    req.ip, req.headers['user-agent'], JSON.stringify(deviceInfo)
  ]);

  return sessionToken;
}

/**
 * Update user login info
 */
async function updateUserLogin(userId) {
  await db.query(`
    UPDATE users 
    SET last_login = NOW(), login_count = login_count + 1, failed_login_attempts = 0
    WHERE id = $1
  `, [userId]);
}

/**
 * Handle failed login attempt
 */
async function handleFailedLogin(username, req) {
  await db.query(`
    UPDATE users 
    SET failed_login_attempts = failed_login_attempts + 1,
        locked_until = CASE 
          WHEN failed_login_attempts >= 4 THEN NOW() + INTERVAL '15 minutes'
          ELSE locked_until
        END
    WHERE username = $1
  `, [username]);

  // Log failed attempt
  await createAuditLog({
    action: 'login_failed',
    resourceType: 'user',
    resourceId: username,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    success: false,
    errorMessage: 'Invalid credentials'
  });
}

// =====================================================
// ROUTES
// =====================================================

/**
 * POST /auth/login
 * User login
 */
router.post('/login', loginValidation, async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors.array()
      });
    }

    const { username, password, rememberMe = false } = req.body;

    // Get user with role information
    const userResult = await db.query(`
      SELECT u.*, r.name as role_name, r.permissions as role_permissions
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.username = $1 AND u.is_active = true
    `, [username]);

    if (userResult.rows.length === 0) {
      await handleFailedLogin(username, req);
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid username or password'
      });
    }

    const user = userResult.rows[0];

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(423).json({
        error: 'Account Locked',
        message: 'Account is temporarily locked due to multiple failed login attempts',
        lockedUntil: user.locked_until
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      await handleFailedLogin(username, req);
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid username or password'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Create session
    const sessionToken = await createSession(user.id, refreshToken, req);

    // Update user login info
    await updateUserLogin(user.id);

    // Log successful login
    await createAuditLog({
      userId: user.id,
      action: 'login_success',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true
    });

    // Set secure cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 7 days or 24 hours
    };

    res.cookie('accessToken', accessToken, cookieOptions);
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.cookie('sessionToken', sessionToken, cookieOptions);

    // Return user info (without sensitive data)
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role_name,
        permissions: user.role_permissions,
        lastLogin: user.last_login
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: JWT_EXPIRES_IN
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during login'
    });
  }
});

/**
 * POST /auth/logout
 * User logout
 */
router.post('/logout', authMiddleware.requireAuth, async (req, res) => {
  try {
    const sessionToken = req.cookies.sessionToken || req.headers['x-session-token'];

    if (sessionToken) {
      // Deactivate session
      await db.query(`
        UPDATE user_sessions 
        SET is_active = false 
        WHERE session_token = $1
      `, [sessionToken]);
    }

    // Log logout
    await createAuditLog({
      userId: req.user.id,
      action: 'logout',
      resourceType: 'user',
      resourceId: req.user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true
    });

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.clearCookie('sessionToken');

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during logout'
    });
  }
});

/**
 * POST /auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'No Refresh Token',
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET);

    // Check if session exists and is active
    const sessionResult = await db.query(`
      SELECT s.*, u.*, r.name as role_name, r.permissions as role_permissions
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      JOIN roles r ON u.role_id = r.id
      WHERE s.refresh_token = $1 AND s.is_active = true AND s.refresh_expires_at > NOW()
    `, [refreshToken]);

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid Refresh Token',
        message: 'Refresh token is invalid or expired'
      });
    }

    const user = sessionResult.rows[0];

    // Generate new access token
    const { accessToken } = generateTokens(user);

    // Update session last used
    await db.query(`
      UPDATE user_sessions 
      SET last_used_at = NOW() 
      WHERE refresh_token = $1
    `, [refreshToken]);

    // Set new access token cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      accessToken,
      expiresIn: JWT_EXPIRES_IN
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      error: 'Token Refresh Failed',
      message: 'Failed to refresh token'
    });
  }
});

/**
 * GET /auth/profile
 * Get current user profile
 */
router.get('/profile', authMiddleware.requireAuth, async (req, res) => {
  try {
    const userResult = await db.query(`
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.phone, 
             u.avatar_url, u.last_login, u.login_count, u.created_at,
             r.name as role_name, r.permissions as role_permissions,
             p.language, p.timezone, p.theme, p.notifications
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN user_preferences p ON u.id = p.user_id
      WHERE u.id = $1
    `, [req.user.id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User profile not found'
      });
    }

    const user = userResult.rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        avatarUrl: user.avatar_url,
        role: user.role_name,
        permissions: user.role_permissions,
        lastLogin: user.last_login,
        loginCount: user.login_count,
        createdAt: user.created_at,
        preferences: {
          language: user.language,
          timezone: user.timezone,
          theme: user.theme,
          notifications: user.notifications
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user profile'
    });
  }
});

/**
 * POST /auth/change-password
 * Change user password
 */
router.post('/change-password', authMiddleware.requireAuth, changePasswordValidation, async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get current user
    const userResult = await db.query(`
      SELECT password_hash FROM users WHERE id = $1
    `, [req.user.id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid Password',
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await db.query(`
      UPDATE users 
      SET password_hash = $1, password_changed_at = NOW()
      WHERE id = $2
    `, [newPasswordHash, req.user.id]);

    // Invalidate all sessions except current
    const currentSessionToken = req.cookies.sessionToken || req.headers['x-session-token'];
    await db.query(`
      UPDATE user_sessions 
      SET is_active = false 
      WHERE user_id = $1 AND session_token != $2
    `, [req.user.id, currentSessionToken]);

    // Log password change
    await createAuditLog({
      userId: req.user.id,
      action: 'password_changed',
      resourceType: 'user',
      resourceId: req.user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to change password'
    });
  }
});

/**
 * GET /auth/sessions
 * Get user active sessions
 */
router.get('/sessions', authMiddleware.requireAuth, async (req, res) => {
  try {
    const sessionsResult = await db.query(`
      SELECT id, session_token, expires_at, ip_address, user_agent, 
             device_info, created_at, last_used_at
      FROM user_sessions
      WHERE user_id = $1 AND is_active = true AND expires_at > NOW()
      ORDER BY last_used_at DESC
    `, [req.user.id]);

    const sessions = sessionsResult.rows.map(session => ({
      id: session.id,
      sessionToken: session.session_token,
      expiresAt: session.expires_at,
      ipAddress: session.ip_address,
      userAgent: session.user_agent,
      deviceInfo: session.device_info,
      createdAt: session.created_at,
      lastUsedAt: session.last_used_at,
      isCurrent: session.session_token === (req.cookies.sessionToken || req.headers['x-session-token'])
    }));

    res.json({
      success: true,
      sessions
    });

  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get sessions'
    });
  }
});

/**
 * DELETE /auth/sessions/:sessionId
 * Revoke a specific session
 */
router.delete('/sessions/:sessionId', authMiddleware.requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Deactivate session (only if it belongs to the current user)
    const result = await db.query(`
      UPDATE user_sessions 
      SET is_active = false 
      WHERE id = $1 AND user_id = $2
      RETURNING session_token
    `, [sessionId, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Session Not Found',
        message: 'Session not found or does not belong to you'
      });
    }

    // Log session revocation
    await createAuditLog({
      userId: req.user.id,
      action: 'session_revoked',
      resourceType: 'session',
      resourceId: sessionId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true
    });

    res.json({
      success: true,
      message: 'Session revoked successfully'
    });

  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to revoke session'
    });
  }
});

module.exports = router;

