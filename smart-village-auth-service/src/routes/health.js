/**
 * Health check routes
 */

const express = require('express');
const db = require('../config/database');
const { createAuditLog } = require('../utils/auditLogger');

const router = express.Router();

/**
 * GET /health
 * Basic health check
 */
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();

    // Check database connection
    const dbStart = Date.now();
    await db.query('SELECT NOW()');
    const dbResponseTime = Date.now() - dbStart;

    const responseTime = Date.now() - startTime;

    res.json({
      status: 'healthy',
      service: 'Smart Village Authentication Service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      database: {
        status: 'connected',
        responseTime: `${dbResponseTime}ms`
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      environment: process.env.NODE_ENV || 'development'
    });

  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'Smart Village Authentication Service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /health/detailed
 * Detailed health check with system information
 */
router.get('/detailed', async (req, res) => {
  try {
    const startTime = Date.now();
    const checks = {};

    // Database check
    try {
      const dbStart = Date.now();
      const dbResult = await db.query('SELECT NOW(), version()');
      checks.database = {
        status: 'healthy',
        responseTime: Date.now() - dbStart,
        version: dbResult.rows[0].version,
        timestamp: dbResult.rows[0].now
      };
    } catch (dbError) {
      checks.database = {
        status: 'unhealthy',
        error: dbError.message
      };
    }

    // Check database tables
    try {
      const tablesResult = await db.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'roles', 'user_sessions', 'audit_logs')
      `);
      
      const expectedTables = ['users', 'roles', 'user_sessions', 'audit_logs'];
      const existingTables = tablesResult.rows.map(row => row.table_name);
      const missingTables = expectedTables.filter(table => !existingTables.includes(table));

      checks.database_schema = {
        status: missingTables.length === 0 ? 'healthy' : 'unhealthy',
        expectedTables,
        existingTables,
        missingTables
      };
    } catch (schemaError) {
      checks.database_schema = {
        status: 'unhealthy',
        error: schemaError.message
      };
    }

    // Check user counts
    try {
      const userCountResult = await db.query('SELECT COUNT(*) as count FROM users');
      const activeUserCountResult = await db.query('SELECT COUNT(*) as count FROM users WHERE is_active = true');
      const sessionCountResult = await db.query('SELECT COUNT(*) as count FROM user_sessions WHERE is_active = true');

      checks.user_data = {
        status: 'healthy',
        totalUsers: parseInt(userCountResult.rows[0].count),
        activeUsers: parseInt(activeUserCountResult.rows[0].count),
        activeSessions: parseInt(sessionCountResult.rows[0].count)
      };
    } catch (userError) {
      checks.user_data = {
        status: 'unhealthy',
        error: userError.message
      };
    }

    // JWT configuration check
    checks.jwt_config = {
      status: process.env.JWT_SECRET && process.env.JWT_SECRET !== 'your-super-secret-jwt-key-change-in-production' ? 'healthy' : 'warning',
      configured: !!process.env.JWT_SECRET,
      isDefault: process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-in-production'
    };

    // Environment variables check
    const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

    checks.environment = {
      status: missingEnvVars.length === 0 ? 'healthy' : 'unhealthy',
      nodeEnv: process.env.NODE_ENV || 'development',
      requiredVars: requiredEnvVars,
      missingVars: missingEnvVars
    };

    // Overall status
    const allChecks = Object.values(checks);
    const hasUnhealthy = allChecks.some(check => check.status === 'unhealthy');
    const hasWarning = allChecks.some(check => check.status === 'warning');

    let overallStatus = 'healthy';
    if (hasUnhealthy) overallStatus = 'unhealthy';
    else if (hasWarning) overallStatus = 'warning';

    const responseTime = Date.now() - startTime;

    const response = {
      status: overallStatus,
      service: 'Smart Village Authentication Service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      uptime: process.uptime(),
      checks,
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024),
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
        },
        cpu: process.cpuUsage()
      }
    };

    res.status(overallStatus === 'unhealthy' ? 503 : 200).json(response);

  } catch (error) {
    console.error('Detailed health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'Smart Village Authentication Service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /health/ready
 * Readiness probe for Kubernetes/Docker
 */
router.get('/ready', async (req, res) => {
  try {
    // Check if service is ready to accept requests
    await db.query('SELECT 1');

    res.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: 'Service not ready'
    });
  }
});

/**
 * GET /health/live
 * Liveness probe for Kubernetes/Docker
 */
router.get('/live', (req, res) => {
  // Simple liveness check - if the process is running, it's alive
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * GET /health/metrics
 * Basic metrics for monitoring
 */
router.get('/metrics', async (req, res) => {
  try {
    // Get basic metrics
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };

    // Get database metrics
    try {
      const activeSessionsResult = await db.query(`
        SELECT COUNT(*) as count 
        FROM user_sessions 
        WHERE is_active = true AND expires_at > NOW()
      `);

      const recentLoginsResult = await db.query(`
        SELECT COUNT(*) as count 
        FROM audit_logs 
        WHERE action = 'login_success' AND created_at > NOW() - INTERVAL '1 hour'
      `);

      const failedLoginsResult = await db.query(`
        SELECT COUNT(*) as count 
        FROM audit_logs 
        WHERE action = 'login_failed' AND created_at > NOW() - INTERVAL '1 hour'
      `);

      metrics.database = {
        activeSessions: parseInt(activeSessionsResult.rows[0].count),
        recentLogins: parseInt(recentLoginsResult.rows[0].count),
        failedLogins: parseInt(failedLoginsResult.rows[0].count)
      };

    } catch (dbError) {
      metrics.database = {
        error: 'Unable to fetch database metrics'
      };
    }

    res.json(metrics);

  } catch (error) {
    console.error('Metrics collection failed:', error);
    res.status(500).json({
      error: 'Failed to collect metrics',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

