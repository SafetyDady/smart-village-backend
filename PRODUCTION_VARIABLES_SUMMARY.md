# Smart Village Production Environment Variables Summary

## 🚀 Railway - Backend (smart-village-backend)
**Project:** smart-village-backend  
**Environment:** production  
**Service:** smart-village-backend  
**URL:** smart-village-backend-production.up.railway.app

### Variables:
```env
DATABASE_URL=postgresql://postgres:wTSCdmYKIEipsSiVQhbWvZqfVQIQkrUL@switchback.proxy.rlwy.net:45960/railway
NODE_ENV=production
PORT=3001
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# Railway System Variables
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

## 🔐 Railway - Auth Service (Smart-Vaillage-authen-service)
**Project:** Smart-Vaillage-authen-service  
**Environment:** production  
**Service:** smart-village-auth-service  
**URL:** smart-village-auth-service-production.up.railway.app

### Variables:
```env
DATABASE_URL=postgresql://postgres:wTSCdmYKIEipsSiVQhbWvZqfVQIQkrUL@switchback.proxy.rlwy.net:45960/railway
JWT_REFRESH_SECRET=SmartVillage2025_Refresh_Secret_Key_Ultra_Secure
JWT_SECRET=SmartVillage2025_JWT_Secret_Key_Super_Secure
NODE_ENV=production
PORT=3002

# Railway System Variables
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

## 🌐 Vercel - Frontend (smart-village-admin-frontend)
**Status:** ⚠️ Need to check Vercel environment variables
**Expected Variables:**
```env
VITE_AUTH_API_URL=https://smart-village-auth-service-production.up.railway.app
VITE_MAIN_API_URL=https://smart-village-backend-production.up.railway.app
VITE_APP_ENV=production
VITE_DEBUG=false
VITE_API_TIMEOUT=30000
VITE_API_RETRY_ATTEMPTS=5
```

---

## ☁️ Cloudflare - API Gateway (smart-village-api-gateway)
**Status:** ⚠️ Need to check Cloudflare Workers environment variables
**Expected Variables:**
```env
ENVIRONMENT=production
AUTH_SERVICE_URL=https://smart-village-auth-service-production.up.railway.app
MAIN_API_URL=https://smart-village-backend-production.up.railway.app
```

---

## 🔍 Key Findings & Issues:

### ✅ Confirmed Variables:
1. **Database Connection:** Both Backend and Auth Service use the same Railway PostgreSQL
2. **JWT Secrets:** Auth Service has proper JWT secrets configured
3. **Ports:** Backend (3001), Auth Service (3002)
4. **Environment:** Both set to production

### ⚠️ Missing Information:
1. **Vercel Frontend Variables:** Need to access Vercel dashboard
2. **Cloudflare Workers Variables:** Need to access Cloudflare dashboard
3. **Additional Backend Variables:** May need more configuration variables

### 🔧 Local Server Adjustments Needed:
1. Update JWT secrets to match production
2. Ensure all API URLs point to correct endpoints
3. Add missing environment variables
4. Configure rate limiting to match production

---

## 📋 Next Steps:
1. Access Vercel dashboard for Frontend variables
2. Access Cloudflare dashboard for API Gateway variables
3. Update Local Server configuration with production variables
4. Test complete authentication flow

