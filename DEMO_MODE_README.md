# Maskan House Rental Platform - Demo Mode Guide

## 🎯 Quick Start

The application is currently running in **DEMO MODE** for easy testing without backend dependencies.

### Running in Demo Mode (Current State)

```bash
cd Frontend
npm install
npm run dev
```

Visit: `http://localhost:3000` (or the port shown in terminal)

### Demo Credentials

- **Email**: `demo@maskan.com`
- **Password**: `demo123`

> ℹ️ **Note**: Any email/password will work in demo mode - the system uses mock authentication.

---

## 🔄 Switching Between Demo and Production Mode

### **To DISABLE Demo Mode** (Connect to Real Backend)

1. **Open the demo configuration file:**
   ```
   Frontend/src/config/demo.ts
   ```

2. **Change `DEMO_MODE` to `false`:**
   ```typescript
   export const DEMO_MODE = false  // Change from true to false
   ```

3. **Ensure backend is running:**
   ```bash
   # In a separate terminal
   cd Backend
   # Set JAVA_HOME (if needed)
   $env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'
   $env:Path="$env:JAVA_HOME\bin;$env:Path"
   
   # Run backend
   .\mvnw.cmd spring-boot:run
   ```

4. **Restart the frontend dev server:**
   ```bash
   # Stop the current dev server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

### **To ENABLE Demo Mode** (Use Mock Data)

1. **Open the demo configuration file:**
   ```
   Frontend/src/config/demo.ts
   ```

2. **Change `DEMO_MODE` to `true`:**
   ```typescript
   export const DEMO_MODE = true  // Change from false to true
   ```

3. **Restart the frontend dev server:**
   ```bash
   npm run dev
   ```

---

## 📋 What Works in Demo Mode

✅ **Authentication**
- Login (any credentials work)
- Registration (creates demo user)
- Logout

✅ **Property Browsing**
- View property listings (6 mock properties)
- Search and filter properties
- View property details

✅ **Property Management**
- Add new properties (simulated)
- Edit properties (simulated)
- Delete properties (simulated)

✅ **User Interface**
- All navigation and UI components
- Search bar with filters
- Responsive design

⚠️ **Limitations in Demo Mode**
- Data is not persisted (resets on page refresh)
- No real backend validation
- Images use placeholder URLs
- Booking functionality is simulated

---

## 🗂️ Demo Mode File Structure

```
Frontend/
├── src/
│   ├── config/
│   │   └── demo.ts              # 👈 DEMO MODE TOGGLE HERE
│   └── services/
│       ├── mockData.ts          # Mock property data
│       ├── authService.ts       # Auth with demo support
│       └── propertyService.ts   # Property service with demo support
```

---

## 🛠️ Backend Setup (For Production Mode)

### Prerequisites
- Java 17 or higher
- Maven (included via wrapper)

### Running the Backend

```bash
cd Backend

# Windows PowerShell
$env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
.\mvnw.cmd spring-boot:run

# Backend should run on https://maskan-xzpw.onrender.com
```

### Verify Backend is Running

```powershell
# Test API endpoint
curl https://maskan-xzpw.onrender.com/api/properties
```

---

## 🎨 Customizing Mock Data

To add or modify mock properties in demo mode:

1. **Edit mock data file:**
   ```
   Frontend/src/services/mockData.ts
   ```

2. **Add new properties to the `MOCK_PROPERTIES` array:**
   ```typescript
   {
     id: 7,
     title: 'Your Property Title',
     location: 'City, Country',
     price: 300,
     bedrooms: 3,
     bathrooms: 2,
     maxGuests: 6,
     // ... other fields
   }
   ```

3. **Save and reload the page** - changes appear immediately in demo mode.

---

## 📝 Development Workflow

### **For Frontend-Only Development** (Recommended)
1. Keep `DEMO_MODE = true`
2. Work on UI/UX without backend dependency
3. Test with mock data

### **For Full-Stack Testing**
1. Set `DEMO_MODE = false`
2. Run backend server
3. Test real API integration

### **Before Production Deployment**
1. Set `DEMO_MODE = false`
2. Update `VITE_API_BASE_URL` in `.env` file
3. Build production bundle: `npm run build`

---

## 🚀 Production Build

```bash
# Ensure demo mode is disabled in production
cd Frontend

# Build optimized production bundle
npm run build

# Output will be in Frontend/dist/
```

---

## 🔍 Troubleshooting

### "Cannot connect to backend" (Demo mode disabled)
- ✅ Verify backend is running: `https://maskan-xzpw.onrender.com/api/properties`
- ✅ Check `VITE_API_BASE_URL` in frontend
- ✅ Enable CORS in backend if needed

### "Mock data not appearing" (Demo mode enabled)
- ✅ Verify `DEMO_MODE = true` in `config/demo.ts`
- ✅ Hard refresh browser (Ctrl+F5)
- ✅ Check browser console for errors

---

## 📧 Support

For issues or questions about demo mode configuration:
1. Check this README first
2. Review `Frontend/src/config/demo.ts` comments
3. Verify current mode matches your intention

---

**Current Status**: ✅ **DEMO MODE ENABLED** - Ready for frontend testing!
