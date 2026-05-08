# ✅ Quick Verification Checklist - 500 Error Fix

## 🎯 Test Plan

### **Phase 1: Backend Verification** (5 mins)

- [ ] **Check Backend is Running**
  ```bash
  curl http://localhost:3000/
  # Expected: { "code": 200, "message": "Auth service is running", ... }
  ```

- [ ] **Test New Register Endpoint (Postman)**
  ```
  POST http://localhost:3000/auth-management/api/v1/auth/register
  
  Body (JSON):
  {
    "email": "testuser@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "phone": "+84912345678"
  }
  ```
  
  Expected Response:
  ```json
  {
    "code": 201,
    "message": "User registered successfully",
    "data": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "authenticated": true
    }
  }
  ```

- [ ] **Verify User in Database**
  ```bash
  # PostgreSQL
  SELECT id, email, full_name, role, created_at FROM users 
  WHERE email = 'testuser@example.com';
  
  # Expected:
  # - full_name = "Test User" ✓
  # - role = "CUSTOMER" ✓
  # - created_at = today's date ✓
  ```

- [ ] **Test Login with New User**
  ```
  POST http://localhost:3000/auth-management/api/v1/auth/log-in
  
  Body (JSON):
  {
    "identifier": "testuser@example.com",
    "password": "password123"
  }
  ```
  
  Expected: 200 OK with tokens

---

### **Phase 2: Frontend Proxy Setup** (3 mins)

- [ ] **Copy vite.config.js**
  ```bash
  # Copy VITE_CONFIG_TEMPLATE.js to your frontend project
  cp VITE_CONFIG_TEMPLATE.js ../frontend/vite.config.js
  ```

- [ ] **Check Proxy Configuration**
  - Edit `vite.config.js` and verify:
    ```javascript
    proxy: {
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/auth-management': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    }
    ```

- [ ] **Restart Frontend Dev Server**
  ```bash
  npm run dev
  # Expected: Server running on http://localhost:5173
  ```

---

### **Phase 3: End-to-End Frontend Test** (5 mins)

- [ ] **Test Frontend Register Form**
  
  1. Open browser DevTools (F12)
  2. Go to Network tab
  3. Fill registration form:
     - Email: `frontend-test@example.com`
     - Password: `password123`
     - First Name: `Frontend`
     - Last Name: `Test`
     - Phone: `+84987654321`
  4. Click Submit
  
  **Expected:**
  - [ ] Network shows 201 status ✓
  - [ ] Request URL: `http://localhost:5173/auth-management/api/v1/auth/register` or `/auth-management/api/v1/auth/register` ✓
  - [ ] Response contains `accessToken` and `refreshToken` ✓
  - [ ] Tokens saved to localStorage ✓
  - [ ] Redirect to dashboard/home ✓

- [ ] **Verify Full Flow**
  - [ ] Register successful (tokens received)
  - [ ] Tokens saved in localStorage
  - [ ] Can call `/auth/profile` with token
  - [ ] User data matches (email, fullName = "Frontend Test")

---

### **Phase 4: Edge Cases** (2 mins)

- [ ] **Test Invalid Data**
  ```
  Email: invalid
  Password: 123
  Expected: 400 Bad Request
  ```

- [ ] **Test Duplicate Email**
  ```
  Email: testuser@example.com (already exists)
  Expected: 400 Bad Request - Email already exists
  ```

- [ ] **Test Missing Required Fields**
  ```
  Email: empty
  Password: filled
  Expected: 400 Bad Request
  ```

---

## 📊 Test Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| Backend running | ⬜ | |
| New register endpoint works | ⬜ | |
| User created with fullName | ⬜ | |
| User role = CUSTOMER | ⬜ | |
| Login with new user | ⬜ | |
| Vite proxy configured | ⬜ | |
| Frontend call via proxy | ⬜ | |
| Tokens in localStorage | ⬜ | |
| Invalid data rejected | ⬜ | |
| Duplicate email rejected | ⬜ | |

---

## 🔍 Debugging Commands

### **If 500 Error Still Occurs:**

```bash
# 1. Check backend logs
cd services/auth-service
npm run start
# Look for error messages

# 2. Check database connection
# Verify PostgreSQL is running
docker-compose ps

# 3. Check DTO validation
# Ensure all required fields are sent:
# - email (required)
# - password (required)
# - firstName (optional)
# - lastName (optional)
# - phone (optional)

# 4. Test with curl (bypass frontend)
curl -X POST http://localhost:3000/auth-management/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "curl-test@example.com",
    "password": "password123",
    "firstName": "Curl",
    "lastName": "Test"
  }'
```

### **If Proxy Not Working:**

```bash
# 1. Check vite.config.js exists and has proxy
cat vite.config.js | grep -A 10 "proxy"

# 2. Restart frontend dev server
npm run dev

# 3. Check browser console for CORS errors
# Open DevTools > Console

# 4. Test proxy directly
# Open http://localhost:5173/auth
# Should see backend health check response
```

---

## 📝 Comparison: Before vs After

### **Before Fix ❌**
| Issue | Status |
|-------|--------|
| Register endpoint | `/auth/register` (legacy only) |
| DTO validation | ❌ None |
| Full name handling | ❌ Optional - causes 500 |
| New endpoint path | ❌ Missing |
| Frontend proxy | ❌ Not configured |
| CORS handling | ❌ Not configured |

### **After Fix ✅**
| Issue | Status |
|-------|--------|
| Register endpoint | `/auth-management/api/v1/auth/register` ✓ |
| DTO validation | ✅ Full validation with @Is* decorators |
| Full name handling | ✅ Auto-generated from firstName + lastName |
| New endpoint path | ✅ Available in AuthManagementController |
| Frontend proxy | ✅ Configured in vite.config.js |
| CORS handling | ✅ Proxy handles automatically |

---

## 🎓 Key Changes Explained

### **1. RegisterDto Update**
- Added `@IsEmail()` validation
- Added `@MinLength(6)` for password
- Made firstName, lastName optional but validated
- Supports role selection
- Supports phone number

### **2. New Endpoint in AuthManagementController**
```typescript
@Post('register')
async register(@Body() registerDto: RegisterDto) {
  // Returns { code: 201, message, data: { accessToken, refreshToken } }
}
```

### **3. UsersService Handles fullName**
Already existing - auto-generates fullName:
```typescript
const fullName = this.normalizeFullName(
  userData.fullName,
  userData.firstName,
  userData.lastName,
  userData.email
);
```

Result: If no fullName provided, generates from firstName + lastName

### **4. Vite Proxy**
Intercepts `/auth*` requests and routes them to backend:
```javascript
'/auth-management': {
  target: 'http://localhost:3000',
  changeOrigin: true,
}
```

---

## 🚀 Next: Running the Tests

### **Quick Test (2 mins)**
```bash
# Terminal 1: Backend
cd services/auth-service && npm run start

# Terminal 2: Frontend  
npm run dev

# Terminal 3: Test with curl
curl -X POST http://localhost:3000/auth-management/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123","firstName":"Test","lastName":"User"}'
```

### **Full Test (10 mins)**
- Open http://localhost:5173
- Fill registration form
- Submit
- Check DevTools Network tab
- Verify success

---

## ✨ Success Indicators

✅ You'll know it's working when:
1. Registration form accepts data
2. Network tab shows 201 status
3. Browser redirects to dashboard
4. localStorage has accessToken
5. Can fetch `/auth/profile` successfully
6. Database shows new user with correct fullName

---

**Status:** Ready for Testing! 🎉

