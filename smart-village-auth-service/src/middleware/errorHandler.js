/**
 * Global error handler middleware
 */

const { createAuditLog } = require('../utils/auditLogger');

/**
 * Global error handler
 */
const errorHandler = async (err, req, res, next) => {
  // Log error
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    user: req.user ? req.user.id : 'anonymous'
  });

  // Log error to audit trail if user is authenticated
  if (req.user) {
    try {
      await createAuditLog({
        userId: req.user.id,
        action: 'error_occurred',
        resourceType: 'system',
        resourceId: req.url,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: false,
        errorMessage: err.message
      });
    } catch (auditError) {
      console.error('Failed to log error to audit trail:', auditError);
    }
  }

  // Default error response
  let status = 500;
  let error = 'Internal Server Error';
  let message = 'An unexpected error occurred';
  let details = null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    error = 'Validation Error';
    message = 'Invalid input data';
    details = err.details || err.message;
  } else if (err.name === 'UnauthorizedError') {
    status = 401;
    error = 'Unauthorized';
    message = 'Authentication required';
  } else if (err.name === 'ForbiddenError') {
    status = 403;
    error = 'Forbidden';
    message = 'Insufficient permissions';
  } else if (err.name === 'NotFoundError') {
    status = 404;
    error = 'Not Found';
    message = 'Resource not found';
  } else if (err.name === 'ConflictError') {
    status = 409;
    error = 'Conflict';
    message = 'Resource conflict';
  } else if (err.name === 'TooManyRequestsError') {
    status = 429;
    error = 'Too Many Requests';
    message = 'Rate limit exceeded';
  } else if (err.code === '23505') { // PostgreSQL unique violation
    status = 409;
    error = 'Conflict';
    message = 'Resource already exists';
    details = 'A record with this information already exists';
  } else if (err.code === '23503') { // PostgreSQL foreign key violation
    status = 400;
    error = 'Bad Request';
    message = 'Invalid reference';
    details = 'Referenced resource does not exist';
  } else if (err.code === '23502') { // PostgreSQL not null violation
    status = 400;
    error = 'Bad Request';
    message = 'Missing required field';
    details = 'Required field cannot be null';
  } else if (err.code === '42P01') { // PostgreSQL undefined table
    status = 500;
    error = 'Database Error';
    message = 'Database configuration error';
  } else if (err.code === 'ECONNREFUSED') {
    status = 503;
    error = 'Service Unavailable';
    message = 'Database connection failed';
  } else if (err.name === 'JsonWebTokenError') {
    status = 401;
    error = 'Invalid Token';
    message = 'Authentication token is invalid';
  } else if (err.name === 'TokenExpiredError') {
    status = 401;
    error = 'Token Expired';
    message = 'Authentication token has expired';
  } else if (err.name === 'SyntaxError' && err.message.includes('JSON')) {
    status = 400;
    error = 'Bad Request';
    message = 'Invalid JSON format';
  }

  // Custom error status
  if (err.status) {
    status = err.status;
  }

  // Custom error message
  if (err.message && process.env.NODE_ENV === 'development') {
    message = err.message;
  }

  // Prepare error response
  const errorResponse = {
    error,
    message,
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method
  };

  // Add details in development mode
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = details || err.message;
    errorResponse.stack = err.stack;
  } else if (details) {
    errorResponse.details = details;
  }

  // Add request ID if available
  if (req.id) {
    errorResponse.requestId = req.id;
  }

  // Send error response
  res.status(status).json(errorResponse);
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint was not found',
    path: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Custom error classes
 */
class ValidationError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
    this.details = details;
  }
}

class UnauthorizedError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
    this.status = 401;
  }
}

class ForbiddenError extends Error {
  constructor(message = 'Insufficient permissions') {
    super(message);
    this.name = 'ForbiddenError';
    this.status = 403;
  }
}

class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    this.status = 404;
  }
}

class ConflictError extends Error {
  constructor(message = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
    this.status = 409;
  }
}

class TooManyRequestsError extends Error {
  constructor(message = 'Rate limit exceeded') {
    super(message);
    this.name = 'TooManyRequestsError';
    this.status = 429;
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError
};

