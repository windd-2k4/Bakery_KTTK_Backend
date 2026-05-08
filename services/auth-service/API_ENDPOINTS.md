/**
 * ============================================
 * AUTH-SERVICE API ENDPOINTS DOCUMENTATION
 * ============================================
 * 
 * Base URL: http://localhost:3000
 * Response Pattern: { code: number, message: string, data: T }
 */

// ============ NEW API (auth-management) ============

/**
 * POST /auth-management/api/v1/auth/log-in
 * 
 * Description: Authenticate user with identifier (email) and password
 * 
 * Request Body:
 * {
 *   "identifier": "user@example.com",
 *   "password": "password123"
 * }
 * 
 * Response (200 OK):
 * {
 *   "code": 200,
 *   "message": "Login successful",
 *   "data": {
 *     "accessToken": "eyJhbGc...",
 *     "refreshToken": "eyJhbGc...",
 *     "authenticated": true
 *   }
 * }
 * 
 * Response (401 Unauthorized):
 * {
 *   "code": 401,
 *   "message": "Invalid credentials",
 *   "data": null
 * }
 */

/**
 * POST /auth-management/api/v1/auth/log-out
 * 
 * Description: Logout user (requires JWT token)
 * 
 * Headers:
 * Authorization: Bearer <accessToken>
 * 
 * Request Body:
 * {
 *   "userId": "1234567890"
 * }
 * 
 * Response (200 OK):
 * {
 *   "code": 200,
 *   "message": "Logout successful",
 *   "data": {
 *     "message": "User logged out successfully"
 *   }
 * }
 * 
 * Response (401 Unauthorized):
 * {
 *   "code": 401,
 *   "message": "Unauthorized",
 *   "data": null
 * }
 */

// ============ LEGACY API (for backward compatibility) ============

/**
 * POST /auth/register
 * 
 * Description: Register new user (legacy)
 * 
 * Request Body:
 * {
 *   "email": "user@example.com",
 *   "password": "password123",
 *   "firstName": "John",
 *   "lastName": "Doe"
 * }
 * 
 * Response (201 Created):
 * {
 *   "code": 201,
 *   "message": "User registered successfully",
 *   "data": {
 *     "accessToken": "eyJhbGc...",
 *     "refreshToken": "eyJhbGc..."
 *   }
 * }
 */

/**
 * POST /auth/login
 * 
 * Description: Login user (legacy)
 * 
 * Request Body:
 * {
 *   "email": "user@example.com",
 *   "password": "password123"
 * }
 * 
 * Response (200 OK):
 * {
 *   "code": 200,
 *   "message": "Login successful",
 *   "data": {
 *     "accessToken": "eyJhbGc...",
 *     "refreshToken": "eyJhbGc..."
 *   }
 * }
 */

/**
 * GET /auth/profile
 * 
 * Description: Get user profile (requires JWT token, legacy)
 * 
 * Headers:
 * Authorization: Bearer <accessToken>
 * 
 * Response (200 OK):
 * {
 *   "code": 200,
 *   "message": "Success",
 *   "data": {
 *     "sub": "1234567890",
 *     "email": "user@example.com",
 *     "role": "CUSTOMER"
 *   }
 * }
 */

/**
 * GET /
 * 
 * Description: Health check
 * 
 * Response (200 OK):
 * {
 *   "code": 200,
 *   "message": "Auth service is running",
 *   "data": {
 *     "message": "Auth service is healthy"
 *   }
 * }
 */
