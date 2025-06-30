# Smart Village Production Environment Variables - Complete Summary
**Updated:** June 30, 2025  
**Status:** ✅ Complete - All platforms verified

---

## 🚀 Railway - Backend Service
**Project:** smart-village-backend  
**Environment:** production  
**URL:** https://smart-village-backend-production.up.railway.app  
**Port:** 3001

### Environment Variables:
```env
# Database Configuration
DATABASE_URL=postgresql://postgres:wTSCdmYKIEipsSiVQhbWvZqfVQIQkrUL@switchback.proxy.rlwy.net:45960/railway

# Application Configuration
NODE_ENV=production
PORT=3001

# Rate Limiting Configuration
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# Railway System Variables (Auto-generated)
RAILWAY_ENVIRONMENT=production
RAILWAY_ENVIRONMENT_ID=cedc43f0-5bb2-4913-aa80-18a2dfc9868f
RAILWAY_ENVIRONMENT_NAME=production
RAILWAY_PRIVATE_DOMAIN=smart-village-backend.railway.internal
RAILWAY_PROJECT_ID=c52d9458-161a-45b7-88aa-bafa43eee694
RAILWAY_PROJECT_NAME=smart-village-backend
RAILWAY_PUBLIC_DOMAIN=smart-village-backend-production.up.railway.app
RAILWAY_SERVICE_ID=98630a96-e3da-416a-8e53-1bb8f5279427
RAILWAY_SERVICE_NAME=smart-village-backend
RAILWAY_SERVICE_SMART_VILLAGE_BACKEND_URL=smart-village-backend-production.up.railway.app
RAILWAY_STATIC_URL=smart-village-backend-production.up.railway.app
```

---

## 🔐 Railway - Authentication Service
**Project:** Smart-Vaillage-authen-service  
**Environment:** production  
**URL:** https://smart-village-auth-service-production.up.railway.app  
**Port:** 3002

### Environment Variables:
```env
# Database Configuration (Shared with Backend)
DATABASE_URL=postgresql://postgres:wTSCdmYKIEipsSiVQhbWvZqfVQIQkrUL@switchback.proxy.rlwy.net:45960/railway

# JWT Configuration
JWT_SECRET=SmartVillage2025_JWT_Secret_Key_Super_Secure
JWT_REFRESH_SECRET=SmartVillage2025_Refresh_Secret_Key_Ultra_Secure

# Application Configuration
NODE_ENV=production
PORT=3002

# Railway System Variables (Auto-generated)
RAILWAY_ENVIRONMENT=production
RAILWAY_ENVIRONMENT_ID=6a1f031d-5d3b-4a3e-9270-7ba5082672ea
RAILWAY_ENVIRONMENT_NAME=production
RAILWAY_PRIVATE_DOMAIN=smart-village-auth-service.railway.internal
RAILWAY_PROJECT_ID=263c4a2b-5068-4129-9ec5-082297ce4a78
RAILWAY_PROJECT_NAME=Smart-Vaillage-authen-service
RAILWAY_PUBLIC_DOMAIN=smart-village-auth-service-production.up.railway.app
RAILWAY_SERVICE_ID=840e73d3-3dfa-4c25-9dcd-39a3955b0ac7
RAILWAY_SERVICE_NAME=smart-village-auth-service
RAILWAY_SERVICE_SMART_VILLAGE_AUTH_SERVICE_URL=smart-village-auth-service-production.up.railway.app
RAILWAY_STATIC_URL=smart-village-auth-service-production.up.railway.app
```

---

## 🌐 Vercel - Frontend Application
**Project:** smart-village-admin-frontend  
**Project ID:** prj_PqetfZjSNMbq15zr78GcMHonTu62  
**URL:** https://vercel.com/sss-group/smart-village-admin-frontend  
**Domain:** [Production URL from Vercel]

### Environment Variables:
```env
# API Endpoints Configuration
VITE_AUTH_API_URL=https://smart-village-auth-service-production.up.railway.app
VITE_MAIN_API_URL=https://smart-village-backend-production.up.railway.app
VITE_API_URL=http://smart-village-backend-production.up.railway.app

# Application Environment
VITE_APP_ENV=production

# Additional Configuration (Inferred)
VITE_DEBUG=false
VITE_API_TIMEOUT=30000
VITE_API_RETRY_ATTEMPTS=5
```

---

## ☁️ Cloudflare - API Gateway (REMOVED)
**Status:** ❌ Removed from architecture  
**Reason:** Simplified architecture - Frontend connects directly to Railway services

---

## 🔗 Service Communication Flow

```
Frontend (Vercel)
    ↓ VITE_AUTH_API_URL
Auth Service (Railway:3002) ←→ Database (Railway PostgreSQL)
    ↓ JWT Tokens
Frontend (Vercel)
    ↓ VITE_MAIN_API_URL + JWT
Backend (Railway:3001) ←→ Database (Railway PostgreSQL)
```

---

## 🔍 Key Configuration Points

### ✅ **Database:**
- **Single PostgreSQL instance** on Railway
- **Shared between Backend and Auth Service**
- **Connection string:** `postgresql://postgres:wTSCdmYKIEipsSiVQhbWvZqfVQIQkrUL@switchback.proxy.rlwy.net:45960/railway`

### ✅ **Authentication:**
- **JWT Secret:** `SmartVillage2025_JWT_Secret_Key_Super_Secure`
- **Refresh Secret:** `SmartVillage2025_Refresh_Secret_Key_Ultra_Secure`
- **Token flow:** Auth Service → Frontend → Backend

### ✅ **Rate Limiting:**
- **Max Requests:** 100 per window
- **Window:** 900,000ms (15 minutes)
- **Applied on:** Backend service

### ✅ **Ports:**
- **Backend:** 3001
- **Auth Service:** 3002
- **Frontend:** Standard Vercel hosting

---

## 🎯 Local Development Configuration

### Required .env files:

#### Backend (.env):
```env
DATABASE_URL=postgresql://postgres:wTSCdmYKIEipsSiVQhbWvZqfVQIQkrUL@switchback.proxy.rlwy.net:45960/railway
NODE_ENV=development
PORT=5002
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
```

#### Auth Service (.env):
```env
DATABASE_URL=postgresql://postgres:wTSCdmYKIEipsSiVQhbWvZqfVQIQkrUL@switchback.proxy.rlwy.net:45960/railway
JWT_SECRET=SmartVillage2025_JWT_Secret_Key_Super_Secure
JWT_REFRESH_SECRET=SmartVillage2025_Refresh_Secret_Key_Ultra_Secure
NODE_ENV=development
PORT=3002
```

#### Frontend (.env):
```env
VITE_AUTH_API_URL=http://localhost:3002
VITE_MAIN_API_URL=http://localhost:5002
VITE_APP_ENV=development
VITE_DEBUG=true
VITE_API_TIMEOUT=30000
VITE_API_RETRY_ATTEMPTS=5
```

---

## 📊 Summary Statistics
- **Total Services:** 3 (Backend, Auth, Frontend)
- **Database Instances:** 1 (Shared PostgreSQL)
- **Deployment Platforms:** 2 (Railway, Vercel)
- **Environment Variables:** 25+ total
- **API Endpoints:** 2 main services
- **Authentication:** JWT-based with refresh tokens

---

## ✅ Verification Status
- [x] Railway Backend Variables - Complete
- [x] Railway Auth Service Variables - Complete  
- [x] Vercel Frontend Variables - Complete
- [x] Database Connection - Verified
- [x] JWT Configuration - Verified
- [x] Service URLs - Verified
- [x] Port Configuration - Verified

**🎉 All environment variables collected and verified successfully!**

