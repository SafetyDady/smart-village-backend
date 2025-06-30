# Smart Village Admin Frontend

Admin Dashboard สำหรับระบบจัดการหมู่บ้านอัจฉริยะ (Smart Village Management System)

## 🚀 Features

- **Village Management**: จัดการข้อมูลหมู่บ้าน (เพิ่ม, แก้ไข, ลบ)
- **System Status Monitoring**: ติดตามสถานะระบบแบบ Real-time
- **Responsive Design**: รองรับการใช้งานบนอุปกรณ์ต่างๆ
- **Thai Language Support**: รองรับภาษาไทยเต็มรูปแบบ

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 + Vite
- **UI Components**: Custom components with Tailwind CSS
- **State Management**: React Hooks (useState, useEffect)
- **HTTP Client**: Fetch API
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## 📦 Installation

```bash
# Clone repository
git clone <repository-url>
cd smart-village-frontend

# Install dependencies
npm install
# or
pnpm install

# Start development server
npm run dev
# or
pnpm dev
```

## 🔧 Configuration

สร้างไฟล์ `.env` ในโฟลเดอร์ root:

```env
VITE_API_URL=https://your-backend-api-url.com
```

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── VillageCard.jsx     # Village card component
│   ├── VillageForm.jsx     # Village form component
│   ├── VillageList.jsx     # Village list component
│   └── HealthStatus.jsx    # Health status component
├── hooks/              # Custom React hooks
│   └── useVillages.js     # Villages data management hook
├── lib/                # Utility libraries
│   └── api.js             # API client functions
├── App.jsx             # Main application component
├── App.css             # Application styles
└── main.jsx            # Application entry point
```

## 🔌 API Integration

Frontend เชื่อมต่อกับ Backend API ผ่าน:

- **Base URL**: กำหนดใน environment variable `VITE_API_URL`
- **Endpoints**:
  - `GET /api/villages` - ดึงรายการหมู่บ้าน
  - `POST /api/villages` - เพิ่มหมู่บ้านใหม่
  - `PUT /api/villages/:id` - แก้ไขข้อมูลหมู่บ้าน
  - `DELETE /api/villages/:id` - ลบหมู่บ้าน
  - `GET /health` - ตรวจสอบสถานะระบบ

## 🎨 UI Components

### VillageCard
แสดงข้อมูลหมู่บ้านในรูปแบบ Card พร้อมปุ่มแก้ไขและลบ

### VillageForm
ฟอร์มสำหรับเพิ่มและแก้ไขข้อมูลหมู่บ้าน

### VillageList
แสดงรายการหมู่บ้านทั้งหมดพร้อมฟังก์ชันการจัดการ

### HealthStatus
แสดงสถานะของระบบ Backend และ Database

## 🔄 State Management

ใช้ Custom Hook `useVillages` สำหรับจัดการ:
- การดึงข้อมูลหมู่บ้าน
- การเพิ่มหมู่บ้านใหม่
- การแก้ไขข้อมูลหมู่บ้าน
- การลบหมู่บ้าน
- การจัดการ Loading และ Error states

## 📱 Responsive Design

- **Desktop**: Layout แบบ 2 คอลัมน์
- **Tablet**: Layout แบบ 1 คอลัมน์ที่ปรับขนาด
- **Mobile**: Layout แบบ Stack พร้อม Touch-friendly UI

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 🔗 Related Projects

- **Backend API**: [Smart Village Backend](../smart-village-backend)
- **Mobile App**: Coming in Phase 4

## 📝 Development Notes

- ใช้ Vite สำหรับ Fast Development และ Hot Module Replacement
- Component-based Architecture สำหรับ Reusability
- Error Handling ที่ครอบคลุมสำหรับ User Experience ที่ดี
- Loading States สำหรับ Better UX

## 🎯 Phase 3 Roadmap

- [ ] API Gateway Integration
- [ ] Enhanced Error Handling
- [ ] Performance Optimization
- [ ] Advanced Search และ Filtering
- [ ] User Authentication UI

## 👥 Team

- **Frontend Developer**: Manus AI
- **UI/UX Design**: Responsive และ User-friendly Design
- **Testing**: Manual และ Automated Testing

---

**Version**: 2.0  
**Last Updated**: มิถุนายน 2568  
**Status**: Production Ready

