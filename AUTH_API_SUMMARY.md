# API Tổng Hợp - Auth & User Management 🔐

**Base URL:** `http://localhost:3000`

**Response Format (Standard):**
```json
{
  "code": 200,
  "message": "Success",
  "data": {}
}
```

---

## 📋 API Endpoints

### 1. **LOGIN (Đăng Nhập)** ✅

#### New API (Recommended)
```
POST /auth-management/api/v1/auth/log-in
```

**Request Body:**
```json
{
  "identifier": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "code": 200,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "authenticated": true
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "code": 401,
  "message": "Invalid credentials",
  "data": null
}
```

---

#### Legacy API (For Backward Compatibility)
```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "code": 200,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

---

### 2. **REGISTER (Đăng Ký)** ✅

```
POST /auth/register
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "fullName": "John Doe",
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
    "refreshToken": "eyJhbGc..."
  }
}
```

---

### 3. **LOGOUT (Đăng Xuất)** ✅

```
POST /auth-management/api/v1/auth/log-out
```

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200 OK):**
```json
{
  "code": 200,
  "message": "Logout successful",
  "data": {
    "message": "User logged out successfully"
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "code": 401,
  "message": "Unauthorized",
  "data": null
}
```

---

### 4. **GET PROFILE (Lấy Thông Tin Người Dùng)** ✅

```
GET /auth/profile
```

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**
```json
{
  "code": 200,
  "message": "User profile retrieved",
  "data": {
    "sub": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "CUSTOMER"
  }
}
```

---

### 5. **HEALTH CHECK (Kiểm Tra Auth Service)** 🏥

```
GET /
```

**Response (200 OK):**
```json
{
  "code": 200,
  "message": "Auth service is running",
  "data": {
    "message": "Auth service is healthy"
  }
}
```

---

## 👤 User Model (Database Schema)

```typescript
{
  id: string (UUID),                    // ID người dùng duy nhất
  email: string (UNIQUE),               // Email đăng nhập
  password: string (hashed),            // Mật khẩu (đã mã hóa)
  fullName: string,                     // Tên đầy đủ
  phone: string (nullable),             // Số điện thoại
  role: enum ('CUSTOMER' | 'ADMIN' | 'BAKER'),  // Vai trò
  isActive: boolean (default: true),   // Trạng thái hoạt động
  refreshToken: string (nullable),     // Token làm mới
  createdAt: Date,                      // Thời gian tạo
  updatedAt: Date                       // Thời gian cập nhật
}
```

---

## 🔐 Authentication Flow

### 1️⃣ **Login & Get Tokens**
- User gửi `identifier` (email) + `password` 
- Server trả về `accessToken` (15 phút) + `refreshToken` (7 ngày)
- Frontend lưu tokens vào localStorage/sessionStorage

### 2️⃣ **Use Access Token**
- Gửi `accessToken` trong header: `Authorization: Bearer <token>`
- Để gọi API yêu cầu authentication

### 3️⃣ **Refresh Token (Khi Access Token Hết Hạn)**
- Cần implement endpoint refresh (chưa có API này, cần thêm)
- Dùng `refreshToken` để lấy `accessToken` mới

### 4️⃣ **Logout**
- Gửi request logout (optional backend sẽ xóa refreshToken)
- Frontend xóa tokens từ storage

---

## 🔗 Frontend Integration Points

### ✅ **Những Gì Đã Sẵn Sàng Liên Kết**

| Feature | Endpoint | Trạng Thái |
|---------|----------|-----------|
| Đăng nhập | `POST /auth-management/api/v1/auth/log-in` | ✅ Ready |
| Đăng ký | `POST /auth/register` | ✅ Ready |
| Đăng xuất | `POST /auth-management/api/v1/auth/log-out` | ✅ Ready |
| Lấy thông tin cá nhân | `GET /auth/profile` | ✅ Ready |
| Kiểm tra service | `GET /` | ✅ Ready |

---

## ⚠️ **Những Gì Còn Thiếu / Cần Thêm**

| Feature | Mô Tả | Ưu Tiên |
|---------|-------|--------|
| Refresh Token Endpoint | API để làm mới access token | **HIGH** |
| Update Profile | Cập nhật thông tin cá nhân | **MEDIUM** |
| Change Password | Đổi mật khẩu | **MEDIUM** |
| Forgot Password | Quên mật khẩu | **MEDIUM** |
| Email Verification | Xác nhận email | **LOW** |
| Two-Factor Authentication | Xác thực 2 lớp | **LOW** |

---

## 🚀 Frontend Implementation Example

### React Example
```javascript
// Login
const login = async (email, password) => {
  const response = await fetch('http://localhost:3000/auth-management/api/v1/auth/log-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: email,
      password: password
    })
  });
  
  const data = await response.json();
  if (data.code === 200) {
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
  }
};

// Get Profile
const getProfile = async () => {
  const token = localStorage.getItem('accessToken');
  const response = await fetch('http://localhost:3000/auth/profile', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
};

// Logout
const logout = async (userId) => {
  const token = localStorage.getItem('accessToken');
  await fetch('http://localhost:3000/auth-management/api/v1/auth/log-out', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId })
  });
  
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};
```

---

## 📝 Notes

- **Token Expiration:**
  - `accessToken`: 15 phút
  - `refreshToken`: 7 ngày

- **Password Requirements:**
  - Tối thiểu 6 ký tự
  - Được mã hóa bằng bcrypt (salt: 12)

- **Roles:**
  - `CUSTOMER`: Khách hàng thông thường
  - `ADMIN`: Quản trị viên
  - `BAKER`: Thợ làm bánh

- **Default Role:** Khi đăng ký, mặc định user có role `CUSTOMER`

---

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Kiểm tra token còn hạn hay không, header Authorization đúng format |
| Invalid credentials | Email/password sai hoặc user không tồn tại |
| CORS Error | Thêm CORS headers từ backend hoặc dùng proxy |
| Token expired | Dùng refreshToken để lấy token mới |

---

**Last Updated:** May 2026  
**Version:** 1.0
