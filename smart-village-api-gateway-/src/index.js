/**
 * Smart Village Management System - API Gateway
 * Cloudflare Workers implementation for routing and security
 */

// CORS configuration
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-API-Key',
  'Access-Control-Max-Age': '86400',
};

// Security headers
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
};

// Rate limiting storage (simple in-memory for demo)
const rateLimitStore = new Map();

export default {
  async fetch(request, env, ctx) {
    try {
      // Handle CORS preflight requests
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 200,
          headers: { ...CORS_HEADERS, ...SECURITY_HEADERS }
        });
      }

      const url = new URL(request.url);
      const path = url.pathname;

      // Rate limiting check
      const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
      if (await isRateLimited(clientIP)) {
        return createErrorResponse('Too Many Requests', 429);
      }

      // Health check endpoint
      if (path === '/health') {
        return createSuccessResponse({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          environment: env.ENVIRONMENT || 'development'
        });
      }

      // Route to appropriate backend service
      let targetUrl;
      
      if (path.startsWith('/auth/')) {
        // Authentication service routes
        targetUrl = `${env.AUTH_SERVICE_URL || 'http://localhost:3002'}${path}`;
      } else if (path.startsWith('/api/')) {
        // Main API routes
        targetUrl = `${env.MAIN_API_URL || 'http://localhost:3001'}${path}`;
      } else {
        return createErrorResponse('Route not found', 404);
      }

      // Forward request to backend service
      const modifiedRequest = new Request(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
      });

      // Add gateway headers
      modifiedRequest.headers.set('X-Gateway-Version', '1.0.0');
      modifiedRequest.headers.set('X-Forwarded-For', clientIP);
      modifiedRequest.headers.set('X-Gateway-Timestamp', new Date().toISOString());

      const response = await fetch(modifiedRequest);
      
      // Create response with CORS and security headers
      const modifiedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers),
          ...CORS_HEADERS,
          ...SECURITY_HEADERS,
          'X-Gateway-Processed': 'true'
        }
      });

      return modifiedResponse;

    } catch (error) {
      console.error('Gateway error:', error);
      return createErrorResponse('Internal Gateway Error', 500);
    }
  }
};

// Rate limiting function (simple implementation)
async function isRateLimited(clientIP) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100; // 100 requests per window

  const key = `rate_limit_${clientIP}`;
  const requests = rateLimitStore.get(key) || [];
  
  // Remove old requests outside the window
  const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
  
  if (validRequests.length >= maxRequests) {
    return true; // Rate limited
  }
  
  // Add current request
  validRequests.push(now);
  rateLimitStore.set(key, validRequests);
  
  return false;
}

// Helper function to create success responses
function createSuccessResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...SECURITY_HEADERS
    }
  });
}

// Helper function to create error responses
function createErrorResponse(message, status = 500) {
  return new Response(JSON.stringify({
    error: true,
    message,
    timestamp: new Date().toISOString(),
    status
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...SECURITY_HEADERS
    }
  });
}

