# Auth Service - NestJS Refactoring Summary

## Architecture Compliance

✅ **Response Pattern**: All APIs return `{ code: number, message: string, data: T }`  
✅ **Auth Pattern**: JWT + Passport + @UseGuards(JwtAuthGuard)  
✅ **Validation**: class-validator for all DTOs  
✅ **Error Handling**: Global HttpExceptionFilter

---

## Files Created / Modified

### New DTOs
1. **`src/auth/dto/authentication-request.dto.ts`**
   - Fields: `identifier` (email), `password`
   - Validators: @IsString, @IsNotEmpty, @MinLength(6)

2. **`src/auth/dto/authentication-response.dto.ts`**
   - Fields: `accessToken`, `refreshToken`, `authenticated`
   - Type-safe response structure

3. **`src/auth/dto/logout-request.dto.ts`**
   - Fields: `userId` (UUID)
   - Validators: @IsUUID, @IsNotEmpty

### New Controllers
1. **`src/auth/auth-management.controller.ts`** (NEW)
   ```
   POST /auth-management/api/v1/auth/log-in     -> authenticate(AuthenticationRequest)
   POST /auth-management/api/v1/auth/log-out    -> logout(LogoutRequest) [JWT Guard]
   ```

### Updated Controllers
1. **`src/auth/auth.controller.ts`** (UPDATED)
   - Legacy endpoints now return ApiResponse format
   - POST /auth/register
   - POST /auth/login
   - GET /auth/profile [JWT Guard]

2. **`src/app.controller.ts`** (UPDATED)
   - GET / now returns ApiResponse format

### Updated Services
1. **`src/auth/auth.service.ts`** (UPDATED)
   - ✅ Added: `authenticate(AuthenticationRequest) -> AuthenticationResponse`
   - ✅ Added: `logout(userId) -> void`
   - ✅ Kept: `register()` & `login()` for backward compatibility

2. **`src/users/users.service.ts`** (UPDATED)
   - ✅ Added: `updateRefreshToken(userId, refreshToken)`

### New Common Infrastructure
1. **`src/common/interfaces/response.interface.ts`**
   - `ApiResponse<T>` interface (code, message, data)

2. **`src/common/interceptors/response.interceptor.ts`**
   - Global interceptor to auto-wrap responses
   - Idempotent (won't double-wrap if already ApiResponse)

3. **`src/common/filters/http-exception.filter.ts`**
   - Global exception filter
   - Formats all errors as ApiResponse with code=status code

### Updated Modules
1. **`src/auth/auth.module.ts`** (UPDATED)
   - Imported: AuthManagementController
   - Registered both AuthController & AuthManagementController

2. **`src/main.ts`** (UPDATED)
   ```typescript
   app.useGlobalFilters(new HttpExceptionFilter());
   app.useGlobalInterceptors(new ResponseInterceptor());
   ```

### Documentation
1. **`API_ENDPOINTS.md`**
   - Complete endpoint documentation
   - Request/response examples
   - Error responses

---

## API Endpoints

### NEW (auth-management)

#### POST /auth-management/api/v1/auth/log-in
```json
Request: {
  "identifier": "user@example.com",
  "password": "password123"
}

Response: {
  "code": 200,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "authenticated": true
  }
}
```

#### POST /auth-management/api/v1/auth/log-out
```json
Headers: Authorization: Bearer <token>

Request: {
  "userId": "1234567890"
}

Response: {
  "code": 200,
  "message": "Logout successful",
  "data": {
    "message": "User logged out successfully"
  }
}
```

### LEGACY (backward compatible)

- POST /auth/register
- POST /auth/login  
- GET /auth/profile (JWT Guard)

All now return ApiResponse format.

---

## Key Implementation Details

### Response Interceptor Logic
- Checks if data already has `code` & `message` properties
- If yes: returns as-is (avoid double-wrapping)
- If no: wraps with `{ code: 200, message: "Success", data }`

### Exception Filter Logic
- Catches all HttpException
- Extracts status code & message
- Returns ApiResponse with code=status

### Validation
All DTOs use class-validator decorators:
- `@IsString()`, `@IsNotEmpty()`, `@MinLength()`
- `@IsUUID()`, `@IsEnum()`

### JWT Guard Usage
- `@UseGuards(JwtAuthGuard)` on endpoints requiring auth
- Extracts user from JWT payload
- Attaches to `req.user`

---

## Testing Curl Examples

### Register
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Login (NEW)
```bash
curl -X POST http://localhost:3000/auth-management/api/v1/auth/log-in \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "user@example.com",
    "password": "password123"
  }'
```

### Logout (NEW)
```bash
curl -X POST http://localhost:3000/auth-management/api/v1/auth/log-out \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "1234567890"
  }'
```

### Get Profile
```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer <accessToken>"
```

---

## Migration Notes for Frontend

### Old Pattern
```javascript
// Previously might return raw data
const res = await fetch('/auth/login', {...})
const tokens = await res.json();
// tokens = { accessToken, refreshToken }
```

### New Pattern
```javascript
// Now returns ApiResponse
const res = await fetch('/auth-management/api/v1/auth/log-in', {...})
const response = await res.json();
// response = { code: 200, message: "Login successful", data: { accessToken, refreshToken, authenticated } }
const { data: { accessToken, refreshToken } } = response;
```

### Error Handling
```javascript
// All errors now follow ApiResponse format
if (response.code !== 200) {
  console.error(`Error: ${response.message}`);
  // response.data contains error details if any
}
```

---

## Backward Compatibility

✅ Old /auth/* endpoints still work and now return ApiResponse format  
✅ Can gradually migrate frontend to /auth-management/* endpoints  
✅ No breaking changes to core authentication logic

---

## Next Steps (Optional)

1. Add `@Req()` decorator to capture req.user in logout
2. Implement token blacklist for revoked tokens
3. Add refresh token endpoint: POST /auth-management/api/v1/auth/refresh-token
4. Add password change: POST /auth-management/api/v1/auth/change-password
5. Add password reset: POST /auth-management/api/v1/auth/forgot-password
