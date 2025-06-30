/**
 * User management routes
 * Requires authentication and appropriate permissions
 */

const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult, param } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { createAuditLog } = require('../utils/auditLogger');
const { ValidationError, NotFoundError, ConflictError } = require('../middleware/errorHandler');

const router = express.Router();

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const createUserValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  body('firstName')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters'),
  body('phone')
    .optional()
    .matches(/^[+]?[\d\s\-\(\)]+$/)
    .withMessage('Invalid phone number format'),
  body('roleId')
    .isUUID()
    .withMessage('Valid role ID is required')
];

const updateUserValidation = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be less than 50 characters'),
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be less than 50 characters'),
  body('phone')
    .optional()
    .matches(/^[+]?[\d\s\-\(\)]+$/)
    .withMessage('Invalid phone number format'),
  body('roleId')
    .optional()
    .isUUID()
    .withMessage('Valid role ID is required'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

const resetPasswordValidation = [
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character')
];

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Check if user can manage another user
 */
function canManageUser(currentUser, targetUser) {
  // SuperAdmin can manage anyone
  if (currentUser.role === 'superadmin') {
    return true;
  }

  // Admin can manage users but not other admins or superadmins
  if (currentUser.role === 'admin') {
    return targetUser.role === 'user';
  }

  // Users can only manage themselves
  return currentUser.id === targetUser.id;
}

/**
 * Get user with role information
 */
async function getUserWithRole(userId) {
  const result = await db.query(`
    SELECT u.*, r.name as role_name, r.permissions as role_permissions
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = $1
  `, [userId]);

  return result.rows[0] || null;
}

// =====================================================
// ROUTES
// =====================================================

/**
 * GET /users
 * Get all users (with pagination and filtering)
 */
router.get('/', authMiddleware.requirePermission('users', 'read'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      role = '',
      isActive = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    // Build WHERE clause
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(u.username ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      conditions.push(`r.name = $${paramIndex++}`);
      params.push(role);
    }

    if (isActive !== '') {
      conditions.push(`u.is_active = $${paramIndex++}`);
      params.push(isActive === 'true');
    }

    // Non-superadmin users can only see users they can manage
    if (req.user.role !== 'superadmin') {
      if (req.user.role === 'admin') {
        conditions.push(`r.name IN ('user', 'admin')`);
      } else {
        conditions.push(`u.id = $${paramIndex++}`);
        params.push(req.user.id);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ${whereClause}
    `;

    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get users
    const query = `
      SELECT 
        u.id, u.username, u.email, u.first_name, u.last_name, u.phone,
        u.avatar_url, u.is_active, u.last_login, u.login_count, u.created_at,
        u.failed_login_attempts, u.locked_until,
        r.id as role_id, r.name as role_name, r.display_name as role_display_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ${whereClause}
      ORDER BY u.${sortBy} ${sortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    params.push(limit, offset);

    const result = await db.query(query, params);

    // Log the action
    await createAuditLog({
      userId: req.user.id,
      action: 'users_listed',
      resourceType: 'users',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true
    });

    res.json({
      success: true,
      users: result.rows.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        avatarUrl: user.avatar_url,
        isActive: user.is_active,
        lastLogin: user.last_login,
        loginCount: user.login_count,
        createdAt: user.created_at,
        failedLoginAttempts: user.failed_login_attempts,
        lockedUntil: user.locked_until,
        role: {
          id: user.role_id,
          name: user.role_name,
          displayName: user.role_display_name
        }
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get users'
    });
  }
});

/**
 * GET /users/:id
 * Get specific user by ID
 */
router.get('/:id', [
  param('id').isUUID().withMessage('Valid user ID is required'),
  authMiddleware.requirePermission('users', 'read')
], async (req, res) => {
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

    const { id } = req.params;

    // Get user with role and preferences
    const userResult = await db.query(`
      SELECT 
        u.id, u.username, u.email, u.first_name, u.last_name, u.phone,
        u.avatar_url, u.is_active, u.last_login, u.login_count, u.created_at,
        u.failed_login_attempts, u.locked_until, u.password_changed_at,
        r.id as role_id, r.name as role_name, r.display_name as role_display_name,
        r.permissions as role_permissions,
        p.language, p.timezone, p.theme, p.notifications
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN user_preferences p ON u.id = p.user_id
      WHERE u.id = $1
    `, [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Check if current user can view this user
    if (!canManageUser(req.user, user)) {
      return res.status(403).json({
        error: 'Insufficient Permissions',
        message: 'You do not have permission to view this user'
      });
    }

    // Log the action
    await createAuditLog({
      userId: req.user.id,
      action: 'user_viewed',
      resourceType: 'user',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true
    });

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
        isActive: user.is_active,
        lastLogin: user.last_login,
        loginCount: user.login_count,
        createdAt: user.created_at,
        failedLoginAttempts: user.failed_login_attempts,
        lockedUntil: user.locked_until,
        passwordChangedAt: user.password_changed_at,
        role: {
          id: user.role_id,
          name: user.role_name,
          displayName: user.role_display_name,
          permissions: user.role_permissions
        },
        preferences: {
          language: user.language,
          timezone: user.timezone,
          theme: user.theme,
          notifications: user.notifications
        }
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user'
    });
  }
});

/**
 * POST /users
 * Create new user
 */
router.post('/', [
  ...createUserValidation,
  authMiddleware.requirePermission('users', 'create')
], async (req, res) => {
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

    const { username, email, password, firstName, lastName, phone, roleId } = req.body;

    // Check if username or email already exists
    const existingUserResult = await db.query(`
      SELECT id FROM users WHERE username = $1 OR email = $2
    `, [username, email]);

    if (existingUserResult.rows.length > 0) {
      return res.status(409).json({
        error: 'User Already Exists',
        message: 'Username or email already exists'
      });
    }

    // Verify role exists and user can assign it
    const roleResult = await db.query(`
      SELECT name FROM roles WHERE id = $1
    `, [roleId]);

    if (roleResult.rows.length === 0) {
      return res.status(400).json({
        error: 'Invalid Role',
        message: 'Role not found'
      });
    }

    const targetRole = roleResult.rows[0].name;

    // Check if current user can assign this role
    if (req.user.role !== 'superadmin') {
      if (req.user.role === 'admin' && ['superadmin', 'admin'].includes(targetRole)) {
        return res.status(403).json({
          error: 'Insufficient Permissions',
          message: 'You cannot assign admin or superadmin roles'
        });
      }
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const userId = uuidv4();
    const userResult = await db.query(`
      INSERT INTO users (
        id, username, email, password_hash, first_name, last_name, phone, role_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, username, email, first_name, last_name, phone, is_active, created_at
    `, [userId, username, email, passwordHash, firstName, lastName, phone, roleId]);

    const newUser = userResult.rows[0];

    // Create default preferences
    await db.query(`
      INSERT INTO user_preferences (user_id, language, timezone, theme, notifications)
      VALUES ($1, 'th', 'Asia/Bangkok', 'light', true)
    `, [userId]);

    // Log the action
    await createAuditLog({
      userId: req.user.id,
      action: 'user_created',
      resourceType: 'user',
      resourceId: userId,
      newValues: {
        username,
        email,
        firstName,
        lastName,
        phone,
        roleId
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        phone: newUser.phone,
        isActive: newUser.is_active,
        createdAt: newUser.created_at
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create user'
    });
  }
});

/**
 * PUT /users/:id
 * Update user
 */
router.put('/:id', [
  param('id').isUUID().withMessage('Valid user ID is required'),
  ...updateUserValidation,
  authMiddleware.requirePermission('users', 'update')
], async (req, res) => {
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

    const { id } = req.params;
    const { email, firstName, lastName, phone, roleId, isActive } = req.body;

    // Get current user data
    const currentUser = await getUserWithRole(id);
    if (!currentUser) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User not found'
      });
    }

    // Check if current user can manage this user
    if (!canManageUser(req.user, currentUser)) {
      return res.status(403).json({
        error: 'Insufficient Permissions',
        message: 'You do not have permission to update this user'
      });
    }

    // Check email uniqueness if email is being changed
    if (email && email !== currentUser.email) {
      const emailResult = await db.query(`
        SELECT id FROM users WHERE email = $1 AND id != $2
      `, [email, id]);

      if (emailResult.rows.length > 0) {
        return res.status(409).json({
          error: 'Email Already Exists',
          message: 'Email already exists'
        });
      }
    }

    // Check role assignment permissions
    if (roleId && roleId !== currentUser.role_id) {
      const roleResult = await db.query(`
        SELECT name FROM roles WHERE id = $1
      `, [roleId]);

      if (roleResult.rows.length === 0) {
        return res.status(400).json({
          error: 'Invalid Role',
          message: 'Role not found'
        });
      }

      const targetRole = roleResult.rows[0].name;

      // Check if current user can assign this role
      if (req.user.role !== 'superadmin') {
        if (req.user.role === 'admin' && ['superadmin', 'admin'].includes(targetRole)) {
          return res.status(403).json({
            error: 'Insufficient Permissions',
            message: 'You cannot assign admin or superadmin roles'
          });
        }
      }
    }

    // Build update query
    const updateFields = [];
    const updateParams = [];
    let paramIndex = 1;

    if (email !== undefined) {
      updateFields.push(`email = $${paramIndex++}`);
      updateParams.push(email);
    }

    if (firstName !== undefined) {
      updateFields.push(`first_name = $${paramIndex++}`);
      updateParams.push(firstName);
    }

    if (lastName !== undefined) {
      updateFields.push(`last_name = $${paramIndex++}`);
      updateParams.push(lastName);
    }

    if (phone !== undefined) {
      updateFields.push(`phone = $${paramIndex++}`);
      updateParams.push(phone);
    }

    if (roleId !== undefined) {
      updateFields.push(`role_id = $${paramIndex++}`);
      updateParams.push(roleId);
    }

    if (isActive !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      updateParams.push(isActive);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'No Updates',
        message: 'No fields to update'
      });
    }

    updateFields.push(`updated_at = NOW()`);
    updateParams.push(id);

    // Update user
    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, username, email, first_name, last_name, phone, is_active, updated_at
    `;

    const result = await db.query(updateQuery, updateParams);
    const updatedUser = result.rows[0];

    // Log the action
    await createAuditLog({
      userId: req.user.id,
      action: 'user_updated',
      resourceType: 'user',
      resourceId: id,
      oldValues: {
        email: currentUser.email,
        firstName: currentUser.first_name,
        lastName: currentUser.last_name,
        phone: currentUser.phone,
        roleId: currentUser.role_id,
        isActive: currentUser.is_active
      },
      newValues: {
        email,
        firstName,
        lastName,
        phone,
        roleId,
        isActive
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        phone: updatedUser.phone,
        isActive: updatedUser.is_active,
        updatedAt: updatedUser.updated_at
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update user'
    });
  }
});

/**
 * DELETE /users/:id
 * Delete user (soft delete)
 */
router.delete('/:id', [
  param('id').isUUID().withMessage('Valid user ID is required'),
  authMiddleware.requirePermission('users', 'delete')
], async (req, res) => {
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

    const { id } = req.params;

    // Get user to delete
    const currentUser = await getUserWithRole(id);
    if (!currentUser) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User not found'
      });
    }

    // Check if current user can delete this user
    if (!canManageUser(req.user, currentUser)) {
      return res.status(403).json({
        error: 'Insufficient Permissions',
        message: 'You do not have permission to delete this user'
      });
    }

    // Prevent self-deletion
    if (req.user.id === id) {
      return res.status(400).json({
        error: 'Cannot Delete Self',
        message: 'You cannot delete your own account'
      });
    }

    // Soft delete user
    await db.query(`
      UPDATE users 
      SET is_active = false, deleted_at = NOW()
      WHERE id = $1
    `, [id]);

    // Deactivate all user sessions
    await db.query(`
      UPDATE user_sessions 
      SET is_active = false 
      WHERE user_id = $1
    `, [id]);

    // Log the action
    await createAuditLog({
      userId: req.user.id,
      action: 'user_deleted',
      resourceType: 'user',
      resourceId: id,
      oldValues: {
        username: currentUser.username,
        email: currentUser.email,
        isActive: currentUser.is_active
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete user'
    });
  }
});

/**
 * POST /users/:id/reset-password
 * Reset user password (admin only)
 */
router.post('/:id/reset-password', [
  param('id').isUUID().withMessage('Valid user ID is required'),
  ...resetPasswordValidation,
  authMiddleware.requirePermission('users', 'update')
], async (req, res) => {
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

    const { id } = req.params;
    const { newPassword } = req.body;

    // Get user to reset password
    const targetUser = await getUserWithRole(id);
    if (!targetUser) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User not found'
      });
    }

    // Check if current user can reset this user's password
    if (!canManageUser(req.user, targetUser)) {
      return res.status(403).json({
        error: 'Insufficient Permissions',
        message: 'You do not have permission to reset this user\'s password'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await db.query(`
      UPDATE users 
      SET password_hash = $1, password_changed_at = NOW(), failed_login_attempts = 0, locked_until = NULL
      WHERE id = $2
    `, [passwordHash, id]);

    // Deactivate all user sessions
    await db.query(`
      UPDATE user_sessions 
      SET is_active = false 
      WHERE user_id = $1
    `, [id]);

    // Log the action
    await createAuditLog({
      userId: req.user.id,
      action: 'password_reset_by_admin',
      resourceType: 'user',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true
    });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to reset password'
    });
  }
});

/**
 * POST /users/:id/unlock
 * Unlock user account
 */
router.post('/:id/unlock', [
  param('id').isUUID().withMessage('Valid user ID is required'),
  authMiddleware.requirePermission('users', 'update')
], async (req, res) => {
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

    const { id } = req.params;

    // Get user to unlock
    const targetUser = await getUserWithRole(id);
    if (!targetUser) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User not found'
      });
    }

    // Check if current user can unlock this user
    if (!canManageUser(req.user, targetUser)) {
      return res.status(403).json({
        error: 'Insufficient Permissions',
        message: 'You do not have permission to unlock this user'
      });
    }

    // Unlock user
    await db.query(`
      UPDATE users 
      SET failed_login_attempts = 0, locked_until = NULL
      WHERE id = $1
    `, [id]);

    // Log the action
    await createAuditLog({
      userId: req.user.id,
      action: 'user_unlocked',
      resourceType: 'user',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true
    });

    res.json({
      success: true,
      message: 'User unlocked successfully'
    });

  } catch (error) {
    console.error('Unlock user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to unlock user'
    });
  }
});

/**
 * GET /users/:id/sessions
 * Get user sessions
 */
router.get('/:id/sessions', [
  param('id').isUUID().withMessage('Valid user ID is required'),
  authMiddleware.requirePermission('users', 'read')
], async (req, res) => {
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

    const { id } = req.params;

    // Check if user exists and current user can view sessions
    const targetUser = await getUserWithRole(id);
    if (!targetUser) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User not found'
      });
    }

    if (!canManageUser(req.user, targetUser)) {
      return res.status(403).json({
        error: 'Insufficient Permissions',
        message: 'You do not have permission to view this user\'s sessions'
      });
    }

    // Get user sessions
    const sessionsResult = await db.query(`
      SELECT id, session_token, expires_at, refresh_expires_at, ip_address, 
             user_agent, device_info, is_active, created_at, last_used_at
      FROM user_sessions
      WHERE user_id = $1
      ORDER BY last_used_at DESC
      LIMIT 50
    `, [id]);

    const sessions = sessionsResult.rows.map(session => ({
      id: session.id,
      sessionToken: session.session_token,
      expiresAt: session.expires_at,
      refreshExpiresAt: session.refresh_expires_at,
      ipAddress: session.ip_address,
      userAgent: session.user_agent,
      deviceInfo: session.device_info,
      isActive: session.is_active,
      createdAt: session.created_at,
      lastUsedAt: session.last_used_at
    }));

    res.json({
      success: true,
      sessions
    });

  } catch (error) {
    console.error('Get user sessions error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user sessions'
    });
  }
});

module.exports = router;

