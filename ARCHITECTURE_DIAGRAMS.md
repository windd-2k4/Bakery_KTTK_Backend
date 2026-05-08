# 📊 Architecture & Flow Diagrams

## 🏗️ System Architecture (After Fix)

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                            │
│                  (React/Vue/Angular)                         │
│               Running on http://localhost:5173              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP Request
                         │ /auth-management/api/v1/auth/register
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    VITE DEV SERVER                           │
│                  (Proxy Configured)                          │
│                     Port 5173                                │
│                                                              │
│  Intercepts: /auth/* & /auth-management/*                  │
│  Routes to: http://localhost:3000                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Proxied HTTP
                         │ (Forwarded by Vite)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND LAYER                             │
│                  (NestJS Services)                           │
│               Running on http://localhost:3000              │
│                                                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │  API Gateway (Optional)                          │      │
│  └─────────────────────┬──────────────────────────┘      │
│                        │                                    │
│  ┌────────────────────▼──────────────────────────┐        │
│  │  Auth Service - Port 3000                    │        │
│  │  ├─ AuthManagementController                 │        │
│  │  │  ├─ POST /auth-management/.../register   │        │
│  │  │  ├─ POST /auth-management/.../log-in     │        │
│  │  │  └─ POST /auth-management/.../log-out    │        │
│  │  ├─ AuthController (Legacy)                 │        │
│  │  │  ├─ POST /auth/register                  │        │
│  │  │  ├─ POST /auth/login                     │        │
│  │  │  └─ GET /auth/profile                    │        │
│  │  └─ AuthService + UsersService              │        │
│  └────────────────────┬──────────────────────────┘        │
│                       │                                     │
│  ┌────────────────────▼──────────────────────────┐        │
│  │  PostgreSQL Database                         │        │
│  │  ├─ users table                              │        │
│  │  └─ Contains: email, password, full_name...  │        │
│  └──────────────────────────────────────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request/Response Flow - Register User

```
FRONTEND                              BACKEND
   │                                    │
   ├─ Fill form:                       │
   │  - Email                          │
   │  - Password                       │
   │  - First Name                     │
   │  - Last Name                      │
   │                                    │
   └──────► POST /auth-management/...  │
            /api/v1/auth/register      │
                                       │
                                       ├─ AuthManagementController
                                       │  .register()
                                       │
                                       ├─ Validate DTO
                                       │  - email required ✓
                                       │  - password min 6 chars ✓
                                       │
                                       ├─ AuthService.register()
                                       │
                                       ├─ Hash password (bcrypt)
                                       │
                                       ├─ UsersService.create()
                                       │
                                       ├─ Generate fullName
                                       │  "John" + "Doe" = "John Doe"
                                       │
                                       ├─ Save to Database
                                       │  INSERT INTO users (...)
                                       │
                                       ├─ Generate Tokens
                                       │  - accessToken (15 min)
                                       │  - refreshToken (7 days)
                                       │
   ◄──────────── { code: 201,         │
   │             message: "...",      │
   │             data: {              │
   │               accessToken,       │
   │               refreshToken,      │
   │               authenticated      │
   │             }}                   │
   │                                    │
   ├─ Save tokens to localStorage      │
   │  - localStorage.setItem(...)      │
   │                                    │
   └─► Redirect to /dashboard          │
```

---

## 🔐 Token Storage & Usage

```
┌───────────────────────────┐
│   Browser LocalStorage    │
│                           │
│  accessToken              │ ◄─── Use for API calls
│  "eyJhbGc..."             │      Valid for 15 minutes
│                           │
│  refreshToken             │ ◄─── Use to renew access token
│  "eyJhbGc..."             │      Valid for 7 days
│                           │
└───────────────────────────┘
         │
         │ Attach to every request
         ▼
┌──────────────────────────────────────┐
│  GET /auth/profile                   │
│  Headers:                            │
│  Authorization: Bearer <accessToken> │
└──────────────────────────────────────┘
         │
         ▼
    Backend validates token
         │
         ├─► Valid & Not Expired ✅ → Proceed
         │
         └─► Expired or Invalid ❌ → 401 Unauthorized
```

---

## 📝 Data Models

### User Entity (Database)
```
┌─────────────────────────────┐
│       users table           │
├─────────────────────────────┤
│ id: UUID (PK)               │
│ email: VARCHAR (UNIQUE)     │
│ password: VARCHAR (hashed)  │
│ full_name: VARCHAR          │
│ phone: VARCHAR (nullable)   │
│ role: ENUM                  │
│   - CUSTOMER (default)      │
│   - ADMIN                   │
│   - BAKER                   │
│ is_active: BOOLEAN          │
│ refresh_token: TEXT         │
│ created_at: TIMESTAMP       │
│ updated_at: TIMESTAMP       │
└─────────────────────────────┘
```

### JWT Token Payload
```
┌──────────────────────────┐
│   JWT Payload            │
├──────────────────────────┤
│ {                        │
│   "sub": "user-uuid",    │
│   "email": "user@...",   │
│   "role": "CUSTOMER",    │
│   "iat": 1234567890,     │
│   "exp": 1234567900      │
│ }                        │
└──────────────────────────┘

Access Token:   expires in 15 minutes
Refresh Token:  expires in 7 days
```

---

## 🔄 Complete Authentication Cycle

```
┌──────────────────────────────────────────────────────────────┐
│                    1. REGISTRATION                           │
│                                                              │
│   User submits form ──► Backend creates user with:         │
│   - Hashed password (bcrypt)                               │
│   - Auto-generated fullName                                │
│   - Default role (CUSTOMER)                                │
│   - Returns: accessToken, refreshToken                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    2. TOKEN STORAGE                          │
│                                                              │
│   Frontend saves to localStorage:                           │
│   - accessToken (use for API calls)                         │
│   - refreshToken (use to renew access token)               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    3. API CALLS                              │
│                                                              │
│   Each request includes:                                    │
│   Authorization: Bearer <accessToken>                       │
│                                                              │
│   GET /auth/profile                                         │
│   GET /products (from other services)                       │
│   POST /orders                                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                            │
                            ├─► Token Valid ✅ ─► Proceed
                            │
                            └─► Token Expired ❌ ─┐
                                                   │
                                    ┌──────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────┐
│                    4. TOKEN REFRESH                          │
│                                                              │
│   When access token expires:                                │
│   POST /auth-management/.../refresh                         │
│   Send: { refreshToken: "..." }                             │
│   Returns: new { accessToken, refreshToken }               │
│                                                              │
│   [NOTE: Not yet implemented - NEEDS TO BE ADDED]           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    5. LOGOUT                                 │
│                                                              │
│   POST /auth-management/.../log-out                         │
│   Authorization: Bearer <accessToken>                       │
│   Body: { userId: "..." }                                   │
│                                                              │
│   Backend:                                                  │
│   - Clear refreshToken from database                        │
│   - Session terminated                                      │
│                                                              │
│   Frontend:                                                 │
│   - Clear localStorage                                      │
│   - Redirect to /login                                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🐛 Error Flow

```
Request to Backend
       │
       ▼
┌─────────────────────┐
│ Validation Failed?  │
└─────────────────────┘
       │
    YES│                  NO
       │                   │
       ▼                   ▼
    400              ┌──────────────────┐
   Bad Request       │ Process Request  │
                     └──────────────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │ Database Error?  │
                     └──────────────────┘
                              │
                          YES │  NO
                              │   │
                              ▼   ▼
                            500  200/201
                      Server Error Success!
```

---

## 🔌 API Versioning Strategy

```
LEGACY API                    NEW API (v1)
(Backward Compatibility)      (Recommended)

POST /auth/register    ──────  POST /auth-management/api/v1/auth/register
POST /auth/login       ──────  POST /auth-management/api/v1/auth/log-in
POST /auth/logout      ──────  POST /auth-management/api/v1/auth/log-out
GET  /auth/profile     ────┐   GET  /auth/profile (same for now)
                            │
                            └─ Future: /auth-management/api/v1/auth/profile
```

---

## 🌐 Multi-Service Communication (Future)

```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway                              │
│                    Port 3000                                │
└──────────────────────────┬────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
    ┌─────────┐      ┌─────────┐      ┌─────────┐
    │  Auth   │      │ Product │      │ Order   │
    │ Service │      │ Service │      │ Service │
    │         │      │         │      │         │
    │ :3001  │      │ :3002  │      │ :3003  │
    └────┬────┘      └────┬────┘      └────┬────┘
         │                │                │
         └────────────────┼────────────────┘
                          │
                          ▼
                    RabbitMQ / Events
                    (Message Queue)
```

---

## ✨ Key Points

1. **Proxy Requirement:** Frontend can't call backend directly (CORS)
   - Solution: Vite proxy routes requests

2. **Data Integrity:** fullName must not be null
   - Solution: Auto-generate from firstName + lastName

3. **Validation:** Input data must be validated
   - Solution: DTO with decorators (@IsEmail, etc.)

4. **Token Strategy:** Dual tokens for security & UX
   - accessToken: Short-lived (15 min), for API calls
   - refreshToken: Long-lived (7 days), to get new accessToken

5. **Error Handling:** Clear error messages for debugging
   - 400: Client error (bad request)
   - 401: Unauthorized (invalid/expired token)
   - 500: Server error (something broke)

---

**This architecture ensures:**
✅ Security (hashed passwords, JWT tokens)  
✅ Scalability (microservices)  
✅ Maintainability (clear separation)  
✅ User Experience (smooth login/register)  

