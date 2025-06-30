# Smart Village API Gateway

API Gateway สำหรับ Smart Village Management System ที่ใช้ Cloudflare Workers

## 🌟 Features

### 🔀 Request Routing
- `/auth/*` → Authentication Service (Port 3002)
- `/api/*` → Main Backend API (Port 3001)
- `/health` → Gateway Health Check

### 🛡️ Security Features
- **CORS Protection** - รองรับ cross-origin requests อย่างปลอดภัย
- **Security Headers** - XSS, CSRF, Content-Type protection
- **Rate Limiting** - ป้องกัน brute force attacks (100 requests/15 minutes)
- **Request Validation** - ตรวจสอบ request format และ headers

### ⚡ Performance
- **Edge Computing** - ทำงานใกล้ user ทั่วโลก
- **Auto Scaling** - รองรับ traffic spike อัตโนมัติ
- **Low Latency** - < 50ms response time

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Cloudflare account
- Wrangler CLI

### Installation
```bash
# Install dependencies
npm install

# Install Wrangler CLI globally
npm install -g wrangler

# Login to Cloudflare
wrangler auth login
```

### Development
```bash
# Start development server
npm run dev

# Test locally
curl http://localhost:8787/health
```

### Deployment
```bash
# Deploy to development
npm run deploy:dev

# Deploy to production
npm run deploy:prod
```

## 📋 API Endpoints

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-06-27T02:30:00.000Z",
  "version": "1.0.0",
  "environment": "development"
}
```

### Authentication Routes
```http
POST /auth/login
POST /auth/logout
GET /auth/profile
POST /auth/refresh
```

### Main API Routes
```http
GET /api/villages
POST /api/villages
GET /api/users
POST /api/payments
```

## 🔧 Configuration

### Environment Variables
```toml
# wrangler.toml
[vars]
ENVIRONMENT = "development"
AUTH_SERVICE_URL = "http://localhost:3002"
MAIN_API_URL = "http://localhost:3001"
```

### CORS Settings
```javascript
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
};
```

## 🛡️ Security

### Rate Limiting
- **Window:** 15 minutes
- **Limit:** 100 requests per IP
- **Response:** 429 Too Many Requests

### Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy: default-src 'self'`

### Request Validation
- Content-Type validation
- Authorization header checking
- Request size limits

## 📊 Monitoring

### Health Checks
```bash
# Basic health check
curl https://gateway.smartvillage.com/health

# Detailed monitoring
wrangler tail
```

### Metrics
- Request count per endpoint
- Response time distribution
- Error rate monitoring
- Rate limiting statistics

## 🔄 Integration

### Frontend Integration
```javascript
// API client configuration
const API_BASE_URL = 'https://gateway.smartvillage.com';

// Authentication
const response = await fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ username, password })
});
```

### Backend Services
Gateway จะ forward requests ไปยัง:
- **Authentication Service** (Port 3002)
- **Main API Service** (Port 3001)

## 🚨 Error Handling

### Error Response Format
```json
{
  "error": true,
  "message": "Error description",
  "timestamp": "2025-06-27T02:30:00.000Z",
  "status": 500
}
```

### Common Error Codes
- `404` - Route not found
- `429` - Too many requests
- `500` - Internal gateway error
- `502` - Backend service unavailable

## 📝 Development Notes

### Local Testing
```bash
# Test with curl
curl -X POST http://localhost:8787/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'

# Test CORS
curl -X OPTIONS http://localhost:8787/auth/login \
  -H "Origin: http://localhost:3000"
```

### Debugging
```bash
# View logs
wrangler tail

# Debug mode
wrangler dev --debug
```

## 📚 Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Smart Village API Documentation](https://docs.smartvillage.com)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

