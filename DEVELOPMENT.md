# Smart Village Backend - Development Guide

## Development Environment Setup

### Prerequisites
- Python 3.11+
- PostgreSQL (for production) or SQLite (for local development)
- Git

### Local Development Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/SafetyDady/smart-village-backend.git
   cd smart-village-backend
   ```

2. **Create Virtual Environment**
   ```bash
   python3 -m venv local_venv
   source local_venv/bin/activate  # Linux/Mac
   # or
   local_venv\Scripts\activate     # Windows
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your local settings
   ```

5. **Run Development Server**
   ```bash
   python src/main.py
   ```

## Development Workflow

### 1. Create Feature Branch
```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

### 2. Make Changes
- Edit code in `src/` directory
- Test locally
- Update documentation if needed

### 3. Test Changes
```bash
# Run local server
python src/main.py

# Test API endpoints
curl http://localhost:5002/health
```

### 4. Commit and Push
```bash
git add .
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name
```

### 5. Create Pull Request
- Go to GitHub repository
- Create Pull Request from your feature branch to main
- Wait for review and approval

### 6. Auto-Deploy
- Once merged to main, Railway will auto-deploy
- Check deployment status in Railway dashboard

## Environment Variables

### Local Development (.env)
```
DATABASE_URL=sqlite:///local_database.db
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
JWT_SECRET_KEY=your-local-secret-key
NODE_ENV=development
PORT=5002
```

### Production (Railway)
```
DATABASE_URL=postgresql://...
ALLOWED_ORIGINS=https://smart-village-admin-frontend.vercel.app
JWT_SECRET_KEY=production-secret-key
NODE_ENV=production
PORT=5000
```

## API Testing

### Health Check
```bash
curl http://localhost:5002/health
```

### Authentication
```bash
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password"}'
```

### Villages API
```bash
curl -X GET http://localhost:5002/api/villages \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Deployment Process

### Automatic Deployment
1. **Push to main branch** → Railway auto-deploys
2. **Push to feature branch** → No deployment (development only)

### Manual Deployment (if needed)
1. Go to Railway dashboard
2. Select smart-village-backend service
3. Click "Deploy" button

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   lsof -ti:5002 | xargs kill -9
   ```

2. **Database connection error**
   - Check DATABASE_URL in .env
   - Ensure PostgreSQL is running (production)

3. **CORS errors**
   - Check ALLOWED_ORIGINS in environment variables
   - Ensure frontend URL is included

### Logs
```bash
# Local logs
python src/main.py

# Production logs (Railway)
# Check Railway dashboard → Logs tab
```

## Code Structure

```
src/
├── main.py              # Application entry point
├── models/              # Database models
├── routes/              # API routes
├── middleware/          # Custom middleware
└── utils/               # Utility functions
```

## Best Practices

1. **Always create feature branches**
2. **Test locally before pushing**
3. **Write descriptive commit messages**
4. **Update documentation when needed**
5. **Follow Python PEP 8 style guide**

---

**Last Updated**: June 29, 2025  
**Environment**: Sandbox Development  
**Production URL**: https://smart-village-backend-production.up.railway.app

# Updated from Sandbox Sun Jun 29 15:02:47 EDT 2025
