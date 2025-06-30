/**
 * Audit Logger Utility
 * Logs user actions and system events for security and compliance
 */

const db = require('../config/database');

/**
 * Create audit log entry
 * @param {Object} logData - Audit log data
 * @param {string} logData.userId - User ID (optional for system events)
 * @param {string} logData.action - Action performed
 * @param {string} logData.resourceType - Type of resource affected
 * @param {string} logData.resourceId - ID of affected resource (optional)
 * @param {Object} logData.oldValues - Previous values (optional)
 * @param {Object} logData.newValues - New values (optional)
 * @param {string} logData.ipAddress - Client IP address (optional)
 * @param {string} logData.userAgent - User agent string (optional)
 * @param {string} logData.sessionId - Session ID (optional)
 * @param {boolean} logData.success - Whether action was successful (default: true)
 * @param {string} logData.errorMessage - Error message if action failed (optional)
 */
async function createAuditLog({
  userId = null,
  action,
  resourceType,
  resourceId = null,
  oldValues = null,
  newValues = null,
  ipAddress = null,
  userAgent = null,
  sessionId = null,
  success = true,
  errorMessage = null
}) {
  try {
    await db.query(`
      INSERT INTO audit_logs (
        user_id, action, resource_type, resource_id, old_values, new_values,
        ip_address, user_agent, session_id, success, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      userId,
      action,
      resourceType,
      resourceId,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      ipAddress,
      userAgent,
      sessionId,
      success,
      errorMessage
    ]);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Audit Log:', {
        userId,
        action,
        resourceType,
        resourceId,
        success,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to avoid breaking the main operation
  }
}

/**
 * Get audit logs with filtering and pagination
 * @param {Object} filters - Filter options
 * @param {string} filters.userId - Filter by user ID
 * @param {string} filters.action - Filter by action
 * @param {string} filters.resourceType - Filter by resource type
 * @param {Date} filters.startDate - Filter by start date
 * @param {Date} filters.endDate - Filter by end date
 * @param {boolean} filters.success - Filter by success status
 * @param {number} filters.page - Page number (default: 1)
 * @param {number} filters.limit - Items per page (default: 50)
 * @param {string} filters.sortBy - Sort field (default: 'created_at')
 * @param {string} filters.sortOrder - Sort order (default: 'DESC')
 */
async function getAuditLogs({
  userId = null,
  action = null,
  resourceType = null,
  startDate = null,
  endDate = null,
  success = null,
  page = 1,
  limit = 50,
  sortBy = 'created_at',
  sortOrder = 'DESC'
} = {}) {
  try {
    // Build WHERE clause
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (userId) {
      conditions.push(`al.user_id = $${paramIndex++}`);
      params.push(userId);
    }

    if (action) {
      conditions.push(`al.action = $${paramIndex++}`);
      params.push(action);
    }

    if (resourceType) {
      conditions.push(`al.resource_type = $${paramIndex++}`);
      params.push(resourceType);
    }

    if (startDate) {
      conditions.push(`al.created_at >= $${paramIndex++}`);
      params.push(startDate);
    }

    if (endDate) {
      conditions.push(`al.created_at <= $${paramIndex++}`);
      params.push(endDate);
    }

    if (success !== null) {
      conditions.push(`al.success = $${paramIndex++}`);
      params.push(success);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
    `;

    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get audit logs
    const query = `
      SELECT 
        al.id,
        al.user_id,
        al.action,
        al.resource_type,
        al.resource_id,
        al.old_values,
        al.new_values,
        al.ip_address,
        al.user_agent,
        al.session_id,
        al.success,
        al.error_message,
        al.created_at,
        u.username,
        u.email,
        u.first_name,
        u.last_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.${sortBy} ${sortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    params.push(limit, offset);

    const result = await db.query(query, params);

    return {
      logs: result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        username: row.username,
        userEmail: row.email,
        userFullName: row.first_name && row.last_name ? `${row.first_name} ${row.last_name}` : null,
        action: row.action,
        resourceType: row.resource_type,
        resourceId: row.resource_id,
        oldValues: row.old_values,
        newValues: row.new_values,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        sessionId: row.session_id,
        success: row.success,
        errorMessage: row.error_message,
        createdAt: row.created_at
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };

  } catch (error) {
    console.error('Failed to get audit logs:', error);
    throw error;
  }
}

/**
 * Get audit log statistics
 * @param {Object} filters - Filter options
 * @param {Date} filters.startDate - Start date for statistics
 * @param {Date} filters.endDate - End date for statistics
 */
async function getAuditLogStats({
  startDate = null,
  endDate = null
} = {}) {
  try {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (startDate) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(startDate);
    }

    if (endDate) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get overall statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_logs,
        COUNT(CASE WHEN success = true THEN 1 END) as successful_actions,
        COUNT(CASE WHEN success = false THEN 1 END) as failed_actions,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT action) as unique_actions,
        COUNT(DISTINCT resource_type) as unique_resource_types
      FROM audit_logs
      ${whereClause}
    `;

    const statsResult = await db.query(statsQuery, params);

    // Get action breakdown
    const actionQuery = `
      SELECT 
        action,
        COUNT(*) as count,
        COUNT(CASE WHEN success = true THEN 1 END) as successful,
        COUNT(CASE WHEN success = false THEN 1 END) as failed
      FROM audit_logs
      ${whereClause}
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `;

    const actionResult = await db.query(actionQuery, params);

    // Get resource type breakdown
    const resourceQuery = `
      SELECT 
        resource_type,
        COUNT(*) as count,
        COUNT(CASE WHEN success = true THEN 1 END) as successful,
        COUNT(CASE WHEN success = false THEN 1 END) as failed
      FROM audit_logs
      ${whereClause}
      GROUP BY resource_type
      ORDER BY count DESC
      LIMIT 10
    `;

    const resourceResult = await db.query(resourceQuery, params);

    // Get daily activity (last 30 days)
    const dailyQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        COUNT(CASE WHEN success = true THEN 1 END) as successful,
        COUNT(CASE WHEN success = false THEN 1 END) as failed
      FROM audit_logs
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `;

    const dailyResult = await db.query(dailyQuery);

    return {
      overview: statsResult.rows[0],
      actionBreakdown: actionResult.rows,
      resourceBreakdown: resourceResult.rows,
      dailyActivity: dailyResult.rows
    };

  } catch (error) {
    console.error('Failed to get audit log statistics:', error);
    throw error;
  }
}

/**
 * Clean old audit logs
 * @param {number} daysToKeep - Number of days to keep (default: 365)
 */
async function cleanOldAuditLogs(daysToKeep = 365) {
  try {
    const result = await db.query(`
      DELETE FROM audit_logs
      WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
    `);

    const deletedCount = result.rowCount;

    // Log the cleanup action
    await createAuditLog({
      action: 'audit_logs_cleaned',
      resourceType: 'system',
      resourceId: 'audit_logs',
      newValues: { deletedCount, daysToKeep },
      success: true
    });

    return deletedCount;

  } catch (error) {
    console.error('Failed to clean old audit logs:', error);
    
    // Log the failed cleanup
    await createAuditLog({
      action: 'audit_logs_cleanup_failed',
      resourceType: 'system',
      resourceId: 'audit_logs',
      success: false,
      errorMessage: error.message
    });

    throw error;
  }
}

/**
 * Export audit logs to CSV format
 * @param {Object} filters - Filter options (same as getAuditLogs)
 */
async function exportAuditLogs(filters = {}) {
  try {
    // Get all matching logs (without pagination)
    const { logs } = await getAuditLogs({ ...filters, limit: 10000, page: 1 });

    // Convert to CSV format
    const headers = [
      'ID', 'User ID', 'Username', 'Action', 'Resource Type', 'Resource ID',
      'Success', 'IP Address', 'User Agent', 'Created At', 'Error Message'
    ];

    const csvRows = [
      headers.join(','),
      ...logs.map(log => [
        log.id,
        log.userId || '',
        log.username || '',
        log.action,
        log.resourceType,
        log.resourceId || '',
        log.success,
        log.ipAddress || '',
        `"${(log.userAgent || '').replace(/"/g, '""')}"`,
        log.createdAt,
        `"${(log.errorMessage || '').replace(/"/g, '""')}"`
      ].join(','))
    ];

    return csvRows.join('\n');

  } catch (error) {
    console.error('Failed to export audit logs:', error);
    throw error;
  }
}

module.exports = {
  createAuditLog,
  getAuditLogs,
  getAuditLogStats,
  cleanOldAuditLogs,
  exportAuditLogs
};

