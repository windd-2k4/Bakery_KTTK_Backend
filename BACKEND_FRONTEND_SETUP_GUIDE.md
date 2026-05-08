# 🔧 Lỗi 500 & Cấu Hình Backend-Frontend - Troubleshooting Guide

## 🆘 Vấn đề: 500 Internal Server Error Khi Đăng Ký

### ❌ **Nguyên Nhân Gốc Rễ**

| Vấn đề | Nguyên Nhân | Giải Pháp |
|--------|-----------|----------|
| **CORS Error** | Frontend (port 5173) gọi Backend (port 3000) | Cấu hình proxy hoặc CORS middleware |
| **Missing fullName** | Database yêu cầu `full_name NOT NULL` | Auto-generate từ firstName/lastName |
| **Wrong Endpoint** | Frontend gửi `/auth/register` | Dùng `/auth-management/api/v1/auth/register` |
| **Invalid DTO** | Trường bắt buộc bị thiếu | Cập nhật RegisterDto validation |
| **Bad Request (400)** | Data không hợp lệ hoặc format sai | Kiểm tra request body |

---

## ✅ **Các Lỗi Đã Được Sửa**

### 1. **Backend - RegisterDto** ✓
**Trước:**
```typescript
export class RegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
}
```

**Sau:** 
- ✅ Thêm validation với `@IsEmail()`, `@IsNotEmpty()`, `@MinLength()`
- ✅ Cho phép tùy chọn firstName, lastName, phone
- ✅ Hỗ trợ role selection (CUSTOMER, ADMIN, BAKER)
- ✅ Tự động generate fullName từ firstName + lastName

**Vị trí:** [services/auth-service/src/auth/dto/register.dto.ts](services/auth-service/src/auth/dto/register.dto.ts)

---

### 2. **Backend - AuthManagementController** ✓
**Thêm endpoint mới:**
```
POST /auth-management/api/v1/auth/register
```

**Trước:** Chỉ có `log-in` và `log-out`

**Sau:** 
- ✅ Thêm `register` endpoint với validation
- ✅ Response format chuẩn `{ code, message, data }`
- ✅ Trả về `accessToken` và `refreshToken`

**Vị trí:** [services/auth-service/src/auth/auth-management.controller.ts](services/auth-service/src/auth/auth-management.controller.ts)

---

### 3. **Frontend - vite.config.js** ✓
**Tạo proxy configuration:**

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

**Lợi ích:**
- ✅ Tự động chuyển tiếp `/auth/*` → `http://localhost:3000/auth/*`
- ✅ Giải quyết CORS error
- ✅ Frontend không cần biết backend URL

**Vị trị:** [VITE_CONFIG_TEMPLATE.js](VITE_CONFIG_TEMPLATE.js)

---

## 🚀 **Cách Sử Dụng Các Endpoint Mới**

### **Endpoint Đăng Ký Mới (Recommended)**
```
POST http://localhost:3000/auth-management/api/v1/auth/register
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+84123456789"
}
```

**Response (201 Created):**
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

**Tự động:**
- ✅ `fullName` = "John Doe" (tự ghép từ firstName + lastName)
- ✅ `role` = "CUSTOMER" (mặc định)
- ✅ Password được hash với bcrypt (salt: 12)

---

## 🔗 **Frontend Integration Steps**

### **Step 1: Cách Dùng Proxy Vite**

Copy nội dung từ [VITE_CONFIG_TEMPLATE.js](VITE_CONFIG_TEMPLATE.js) vào `vite.config.js` của frontend.

```bash
# Frontend folder (chạy ở port 5173)
cp VITE_CONFIG_TEMPLATE.js vite.config.js
```

### **Step 2: Update Frontend API Call**

**Trước:**
```javascript
// WRONG - gọi port sai
fetch('http://localhost:3000/auth/register', { ... })
```

**Sau:**
```javascript
// CORRECT - dùng proxy
fetch('http://localhost:5173/auth-management/api/v1/auth/register', { ... })
// Proxy tự động chuyển → http://localhost:3000/auth-management/api/v1/auth/register
```

Hoặc đơn giản hơn:
```javascript
// Vite proxy sẽ tự handle
fetch('/auth-management/api/v1/auth/register', { ... })
```

### **Step 3: Restart Services**

```bash
# Terminal 1: Backend
cd services/auth-service
npm install  # Nếu RegisterDto có dependency mới
npm run start

# Terminal 2: Frontend  
npm install
npm run dev
```

---

## 🐛 **Debugging: Cách Kiểm Tra Lỗi**

### **Check 1: Verify Backend Endpoint**
```bash
# Dùng curl hoặc Postman
curl -X POST http://localhost:3000/auth-management/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Kỳ vọng:
# {
#   "code": 201,
#   "message": "User registered successfully",
#   "data": { ... }
# }
```

### **Check 2: Verify Frontend Proxy**
```javascript
// Browser DevTools > Network tab
// Gọi từ frontend:
fetch('/auth-management/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: "test@example.com",
    password: "password123",
    firstName: "Test",
    lastName: "User"
  })
})

// Kiểm tra:
// 1. Request được gửi đi không? (Network tab)
// 2. Status code là gì? (201 = success, 400 = bad request, 500 = server error)
// 3. Response body có data không?
```

### **Check 3: Kiểm Tra Database**
```bash
# Connect vào PostgreSQL
psql -U postgres -d bakery_db

# Kiểm tra bảng users
SELECT * FROM users;

# Kiểm tra user vừa tạo
SELECT id, email, full_name, role FROM users WHERE email = 'test@example.com';
```

---

## ❌ **Common Errors & Solutions**

### **Error 1: 400 Bad Request**
```
message: "Identifier and password are required"
```

**Nguyên Nhân:** Request body không đúng format

**Giải Pháp:**
```javascript
// ❌ WRONG
const body = "email=test@example.com&password=123";

// ✅ CORRECT
const body = JSON.stringify({
  email: "test@example.com",
  password: "password123"
});
```

---

### **Error 2: 500 Internal Server Error**
```
message: "Internal Server Error"
```

**Nguyên Nhân:** Backend error - thường là missing required field

**Giải Pháp:** Kiểm tra logs
```bash
# Xem logs chi tiết
cd services/auth-service
npm run start  # Xem error message trong console
```

---

### **Error 3: CORS Error**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Nguyên Nhân:** Frontend gọi trực tiếp backend mà không qua proxy

**Giải Pháp:** Cấu hình vite.config.js proxy
```javascript
proxy: {
  '/auth-management': {
    target: 'http://localhost:3000',
    changeOrigin: true,
  }
}
```

---

### **Error 4: fullName NOT NULL**
```
QueryFailedError: null value in column "full_name" violates not-null constraint
```

**Nguyên Nhân:** UsersService không tạo fullName

**Giải Pháp:** ✅ Đã sửa - UsersService.normalizeFullName() tự động generate

---

### **Error 5: Email Already Exists**
```
message: "Email already exists"
```

**Giải Pháp:**
```bash
# Xóa dòng user cũ
DELETE FROM users WHERE email = 'test@example.com';

# Hoặc dùng email mới
```

---

## 📋 **Backend Update Summary**

### **File Đã Sửa:**

1. **[register.dto.ts](services/auth-service/src/auth/dto/register.dto.ts)** ✓
   - Thêm validation
   - Support firstName, lastName, phone, role

2. **[auth-management.controller.ts](services/auth-service/src/auth/auth-management.controller.ts)** ✓
   - Thêm POST /auth-management/api/v1/auth/register endpoint

3. **[auth.service.ts](services/auth-service/src/auth/auth.service.ts)** - Không thay đổi (đã xử lý fullName)

4. **[users.service.ts](services/auth-service/src/users/users.service.ts)** - Không thay đổi (có normalizeFullName)

---

## 🎯 **Next Steps**

### **Immediate (Critical):**
1. ✅ Cập nhật Backend endpoints
2. ✅ Cấu hình Vite proxy
3. ✅ Test đăng ký từ Postman

### **Short Term (High Priority):**
1. Implement Refresh Token endpoint
2. Add password validation rules
3. Add email verification logic

### **Future (Nice to Have):**
1. Forgot password endpoint
2. Update profile endpoint
3. Two-factor authentication

---

## 📚 **Useful Resources**

- [Vite Proxy Documentation](https://vitejs.dev/config/server-options.html#server-proxy)
- [NestJS Validation](https://docs.nestjs.com/techniques/validation)
- [JWT Authentication](https://docs.nestjs.com/security/authentication)
- [CORS Issues Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

## 📞 **Quick Reference**

| Item | Value |
|------|-------|
| Backend URL | http://localhost:3000 |
| Frontend URL | http://localhost:5173 |
| Register Endpoint | `/auth-management/api/v1/auth/register` |
| Login Endpoint | `/auth-management/api/v1/auth/log-in` |
| Logout Endpoint | `/auth-management/api/v1/auth/log-out` |
| Get Profile | `/auth/profile` |
| Token Expiry (Access) | 15 minutes |
| Token Expiry (Refresh) | 7 days |
| Default User Role | CUSTOMER |

---

**Last Updated:** May 2026  
**Status:** ✅ Backend Fixed - Ready for Frontend Integration
