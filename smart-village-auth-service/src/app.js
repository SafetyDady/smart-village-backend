/**
 * Smart Village Authentication Service
 * Main application entry point
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const healthRoutes = require('./routes/health');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');

// Import database
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3002;

// =====================================================
// MIDDLEWARE SETUP
// =====================================================

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Compression
app.use(compression());

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://smart-village-admin-frontend.vercel.app',
      'http://localhost:5174',
      'http://localhost:5173',
      'https://smart-village-api-gateway-prod.workers.dev',
      'https://smart-village-api-gateway-dev.workers.dev',
      'https://rcunvfsi.manus.space'
    ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // Check for Vercel preview deployments
    if (origin.includes('vercel.app')) {
      return callback(null, true);
    }
    
    // Check for Manus deployments
    if (origin.includes('manus.space')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'X-Correlation-ID',
    'X-Client-Version',
    'X-Client-Platform'
  ]
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: 900 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/auth', limiter);

// Stricter rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login requests per windowMs
  message: {
    error: 'Too many login attempts',
    message: 'Too many login attempts from this IP, please try again later.',
    retryAfter: 900
  },
  skipSuccessfulRequests: true,
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// =====================================================
// ROUTES
// =====================================================

// Health check (no authentication required)
app.use('/health', healthRoutes);

// Authentication routes (with rate limiting)
app.use('/auth/login', loginLimiter);
app.use('/auth', authRoutes);

// User management routes (authentication required)
app.use('/users', authMiddleware.requireAuth, userRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Smart Village Authentication Service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      auth: '/auth',
      users: '/users'
    }
  });
});

// =====================================================
// ERROR HANDLING
// =====================================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint was not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use(errorHandler);

// =====================================================
// DATABASE CONNECTION & SERVER START
// =====================================================

async function startServer() {
  try {
    // Test database connection with health check
    console.log('🔍 Testing database connection...');
    const healthResult = await db.healthCheck();
    
    if (healthResult.status === 'connected') {
      console.log('✅ Database connected successfully');
      console.log(`📊 Database info:`, {
        timestamp: healthResult.timestamp,
        pool: healthResult.pool
      });
    } else {
      console.warn('⚠️ Database connection issue:', healthResult.error);
      console.log('🔄 Starting server anyway, will retry connections...');
    }
    
    // Start server regardless of database status
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Smart Village Auth Service running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/auth`);
      console.log(`👥 User endpoints: http://localhost:${PORT}/users`);
      
      // Log environment variables for debugging (without sensitive data)
      console.log('🔧 Environment check:');
      console.log('  - DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
      console.log('  - NODE_ENV:', process.env.NODE_ENV || 'development');
      console.log('  - PORT:', PORT);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.log('🔄 Attempting to start server without database...');
    
    // Try to start server anyway
    try {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Smart Village Auth Service running on port ${PORT} (Database offline)`);
        console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      });
    } catch (serverError) {
      console.error('❌ Failed to start server completely:', serverError);
      process.exit(1);
    }
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  await db.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 SIGINT received, shutting down gracefully');
  await db.end();
  process.exit(0);
});

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;

