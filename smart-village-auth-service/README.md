# Smart Village Authentication Service

A secure authentication and user management service for the Smart Village Management System.

## Features

### 🔐 Authentication
- JWT-based authentication with refresh tokens
- Session management with device tracking
- Password security with bcrypt hashing
- Account locking after failed attempts
- Multi-device session support

### 👥 User Management
- Role-based access control (SuperAdmin, Admin, User)
- Permission-based authorization
- User CRUD operations
- Password reset functionality
- Account unlock capabilities

### 🛡️ Security
- Rate limiting to prevent brute force attacks
- CORS protection for cross-origin requests
- Comprehensive audit logging
- Input validation and sanitization
- Security headers implementation

### 📊 Monitoring
- Health check endpoints
- Detailed system metrics
- Performance monitoring
- Error tracking and logging

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh access token
- `GET /auth/profile` - Get user profile
- `POST /auth/change-password` - Change password

### User Management
- `GET /users` - List users (with pagination)
- `GET /users/:id` - Get user details
- `POST /users` - Create new user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user (soft delete)
- `POST /users/:id/reset-password` - Reset user password
- `POST /users/:id/unlock` - Unlock user account
- `GET /users/:id/sessions` - Get user sessions

### Health & Monitoring
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health information
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe
- `GET /health/metrics` - System metrics

## Environment Variables

### Required
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_NAME` - Database name
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - JWT signing secret
- `SESSION_SECRET` - Session signing secret

### Optional
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3002)
- `BCRYPT_ROUNDS` - Password hashing rounds (default: 12)
- `MAX_LOGIN_ATTEMPTS` - Max failed login attempts (default: 5)
- `LOCK_TIME` - Account lock duration in ms (default: 900000)

## Database Schema

The service requires the following database tables:
- `roles` - User roles and permissions
- `users` - User accounts and profiles
- `user_sessions` - Active user sessions
- `user_preferences` - User preferences and settings
- `audit_logs` - Security and activity audit trail
- `password_reset_tokens` - Password reset tokens

## Deployment

### Railway
1. Connect this repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main branch

### Docker
```bash
docker build -t smart-village-auth .
docker run -p 3002:3002 smart-village-auth
```

### Local Development
```bash
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

## Security Considerations

- Always use HTTPS in production
- Set strong JWT and session secrets
- Configure proper CORS origins
- Enable database SSL connections
- Monitor audit logs regularly
- Keep dependencies updated

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## API Documentation

Full API documentation is available at `/docs` when running in development mode.

## Support

For support and questions, please contact the Smart Village development team.

## License

This project is licensed under the MIT License.

