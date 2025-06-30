/**
 * Simple Test Authentication Service
 * For testing API Gateway functionality without database dependency
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Mock user data
const mockUsers = [
  {
    id: '1',
    username: 'superadmin',
    email: 'admin@smartvillage.com',
    role: 'superadmin',
    password: 'SmartVillage2025!' // In real app, this would be hashed
  }
];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Smart Village Auth Service (Test Mode)',
    timestamp: new Date().toISOString(),
    version: '1.0.0-test'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Smart Village Authentication Service (Test Mode)',
    version: '1.0.0-test',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      auth: '/auth',
      users: '/users'
    }
  });
});

// Mock login endpoint
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  console.log('Login attempt:', { username, password });
  
  const user = mockUsers.find(u => u.username === username && u.password === password);
  
  if (user) {
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token: 'mock-jwt-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now()
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Mock profile endpoint
app.get('/auth/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    res.json({
      success: true,
      user: {
        id: '1',
        username: 'superadmin',
        email: 'admin@smartvillage.com',
        role: 'superadmin',
        firstName: 'Super',
        lastName: 'Admin'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }
});

// Mock logout endpoint
app.post('/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Mock users list endpoint
app.get('/users', (req, res) => {
  res.json({
    success: true,
    users: mockUsers.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role
    })),
    total: mockUsers.length
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Test Auth Service running on port ${PORT}`);
  console.log(`📍 Environment: test`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/auth`);
  console.log(`👥 Users endpoint: http://localhost:${PORT}/users`);
  console.log('');
  console.log('📋 Test credentials:');
  console.log('   Username: superadmin');
  console.log('   Password: SmartVillage2025!');
});

module.exports = app;

