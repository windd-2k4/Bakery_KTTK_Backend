# 🚀 Auth Service - Quick Start Guide

## Overview

Auth Service đã được refactor theo NestJS best practices với response pattern chuẩn hóa.

**New API Path**: `/auth-management/api/v1/auth`  
**Base URL**: `http://localhost:3000`

---

## API Endpoints

### 1️⃣ Login
```http
POST /auth-management/api/v1/auth/log-in
Content-Type: application/json

{
  "identifier": "user@example.com",
  "password": "password123"
}
```

**Response** (200 OK):
```json
{
  "code": 200,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "authenticated": true
  }
}
```

### 2️⃣ Logout
```http
POST /auth-management/api/v1/auth/log-out
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "userId": "1234567890"
}
```

**Response** (200 OK):
```json
{
  "code": 200,
  "message": "Logout successful",
  "data": {
    "message": "User logged out successfully"
  }
}
```

---

## JavaScript/TypeScript Integration

### Using Fetch API

```javascript
// Login
async function login(email, password) {
  const response = await fetch('http://localhost:3000/auth-management/api/v1/auth/log-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: email,
      password: password
    })
  });

  const result = await response.json();
  
  if (result.code === 200) {
    const { accessToken, refreshToken } = result.data;
    // Store tokens in localStorage/sessionStorage
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    return result.data;
  } else {
    throw new Error(result.message);
  }
}

// Logout
async function logout(userId) {
  const accessToken = localStorage.getItem('accessToken');
  
  const response = await fetch('http://localhost:3000/auth-management/api/v1/auth/log-out', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ userId })
  });

  const result = await response.json();
  
  if (result.code === 200) {
    // Clear tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    return true;
  } else {
    throw new Error(result.message);
  }
}
```

### Using Axios

```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000'
});

// Interceptor: Attach token to all requests
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login
async function login(email, password) {
  try {
    const { data } = await apiClient.post('/auth-management/api/v1/auth/log-in', {
      identifier: email,
      password
    });

    if (data.code === 200) {
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      return data.data;
    }
  } catch (error) {
    console.error('Login failed:', error.response?.data?.message);
    throw error;
  }
}

// Logout
async function logout(userId) {
  try {
    const { data } = await apiClient.post('/auth-management/api/v1/auth/log-out', {
      userId
    });

    if (data.code === 200) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return true;
    }
  } catch (error) {
    console.error('Logout failed:', error.response?.data?.message);
    throw error;
  }
}
```

### Using React Hooks

```javascript
import { useState, useCallback } from 'react';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3000/auth-management/api/v1/auth/log-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password })
      });

      const data = await response.json();

      if (data.code === 200) {
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        setIsAuthenticated(true);
        return data.data;
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async (userId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3000/auth-management/api/v1/auth/log-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (data.code === 200) {
        localStorage.clear();
        setIsAuthenticated(false);
        return true;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { isAuthenticated, loading, error, login, logout };
}
```

### Using Vue 3 Composable

```javascript
// useAuth.js
import { ref } from 'vue';

export function useAuth() {
  const isAuthenticated = ref(false);
  const loading = ref(false);
  const error = ref(null);

  async function login(email, password) {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch('http://localhost:3000/auth-management/api/v1/auth/log-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password })
      });

      const data = await response.json();

      if (data.code === 200) {
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        isAuthenticated.value = true;
        return data.data;
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function logout(userId) {
    loading.value = true;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3000/auth-management/api/v1/auth/log-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (data.code === 200) {
        localStorage.clear();
        isAuthenticated.value = false;
        return true;
      }
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  return { isAuthenticated, loading, error, login, logout };
}
```

---

## Error Handling

All errors follow the same response pattern:

```json
{
  "code": 400,
  "message": "Error description",
  "data": null
}
```

### Common Error Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Login successful |
| 400 | Bad Request | Missing identifier |
| 401 | Unauthorized | Invalid credentials |
| 500 | Server Error | Internal error |

### Handle Errors

```javascript
try {
  const result = await login(email, password);
} catch (error) {
  const response = await error.response.json();
  
  switch (response.code) {
    case 400:
      console.error('Validation Error:', response.message);
      break;
    case 401:
      console.error('Authentication Error:', response.message);
      break;
    case 500:
      console.error('Server Error:', response.message);
      break;
  }
}
```

---

## Token Management

### Store Tokens
```javascript
// After successful login
localStorage.setItem('accessToken', data.data.accessToken);
localStorage.setItem('refreshToken', data.data.refreshToken);
```

### Retrieve Token
```javascript
const accessToken = localStorage.getItem('accessToken');
const refreshToken = localStorage.getItem('refreshToken');
```

### Use Token in Requests
```javascript
fetch(url, {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
})
```

### Clear Tokens
```javascript
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');
// Or clear all
localStorage.clear();
```

---

## Testing with Postman

### 1. Create New Request
- Method: `POST`
- URL: `http://localhost:3000/auth-management/api/v1/auth/log-in`

### 2. Body (JSON)
```json
{
  "identifier": "user@example.com",
  "password": "password123"
}
```

### 3. Send & Copy Access Token

### 4. Create Logout Request
- Method: `POST`
- URL: `http://localhost:3000/auth-management/api/v1/auth/log-out`
- Headers: `Authorization: Bearer <copied_token>`
- Body:
```json
{
  "userId": "1234567890"
}
```

---

## Troubleshooting

### "Invalid credentials" Error
- ✅ Check identifier (email) and password are correct
- ✅ Make sure user exists in system

### "User not found" Error (Logout)
- ✅ Verify userId is correct
- ✅ Ensure token hasn't expired

### "Unauthorized" Error
- ✅ Check Authorization header is present
- ✅ Verify token format: `Bearer <token>`
- ✅ Make sure token hasn't expired

### CORS Error
- Add CORS setup in backend if needed

---

## Environment Configuration

Create `.env` file:
```
REACT_APP_API_URL=http://localhost:3000
REACT_APP_AUTH_ENDPOINT=/auth-management/api/v1/auth
```

Use in code:
```javascript
const API_URL = process.env.REACT_APP_API_URL;
const AUTH_ENDPOINT = process.env.REACT_APP_AUTH_ENDPOINT;

const response = await fetch(`${API_URL}${AUTH_ENDPOINT}/log-in`, {...});
```

---

## Need Help?

- 📖 See [API_ENDPOINTS.md](./API_ENDPOINTS.md) for full endpoint documentation
- 📋 Check [REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md) for implementation details
- ✅ Review [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md) for what's included

---

**Happy Coding! 🎉**
