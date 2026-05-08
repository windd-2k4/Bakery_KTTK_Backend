# Frontend Implementation Guide - Auth APIs 🚀

## ⚡ Quick Reference

| Endpoint | Method | Path | Auth Required | Purpose |
|----------|--------|------|---------------|---------|
| **Login** | POST | `/auth-management/api/v1/auth/log-in` | ❌ | Đăng nhập |
| **Register** | POST | `/auth/register` | ❌ | Đăng ký |
| **Logout** | POST | `/auth-management/api/v1/auth/log-out` | ✅ | Đăng xuất |
| **Profile** | GET | `/auth/profile` | ✅ | Thông tin cá nhân |
| **Health** | GET | `/` | ❌ | Kiểm tra service |

---

## 📝 Code Examples

### 1️⃣ **Vanilla JavaScript / Fetch API**

#### Login
```javascript
async function login(email, password) {
  try {
    const response = await fetch('http://localhost:3000/auth-management/api/v1/auth/log-in', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: email,
        password: password
      })
    });

    const data = await response.json();
    
    if (data.code === 200) {
      // Lưu tokens
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      localStorage.setItem('userId', data.data.userId || 'unknown');
      return data.data;
    } else {
      console.error('Login failed:', data.message);
      return null;
    }
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

// Usage
login('user@example.com', 'password123');
```

#### Register
```javascript
async function register(email, password, firstName, lastName) {
  try {
    const response = await fetch('http://localhost:3000/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
        fullName: `${firstName} ${lastName}`
      })
    });

    const data = await response.json();
    
    if (data.code === 201) {
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      return data.data;
    } else {
      console.error('Registration failed:', data.message);
      return null;
    }
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}
```

#### Get Profile
```javascript
async function getProfile() {
  const token = localStorage.getItem('accessToken');
  
  if (!token) {
    console.error('No access token found');
    return null;
  }

  try {
    const response = await fetch('http://localhost:3000/auth/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.code === 200) {
      return data.data;
    } else {
      console.error('Failed to fetch profile:', data.message);
      return null;
    }
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}
```

#### Logout
```javascript
async function logout(userId) {
  const token = localStorage.getItem('accessToken');
  
  if (!token) {
    console.error('No access token found');
    return false;
  }

  try {
    const response = await fetch('http://localhost:3000/auth-management/api/v1/auth/log-out', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: userId })
    });

    const data = await response.json();
    
    if (data.code === 200) {
      // Xóa tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
      return true;
    } else {
      console.error('Logout failed:', data.message);
      return false;
    }
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}
```

---

### 2️⃣ **React with Hooks**

```javascript
// authContext.js
import React, { createContext, useState, useCallback } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
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
        const { accessToken, refreshToken } = data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        // Lấy thông tin user
        const profileResponse = await fetch('http://localhost:3000/auth/profile', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        const profileData = await profileResponse.json();
        if (profileData.code === 200) {
          setUser(profileData.data);
        }
        
        return true;
      } else {
        setError(data.message);
        return false;
      }
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email, password, firstName, lastName) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          firstName, 
          lastName,
          fullName: `${firstName} ${lastName}`
        })
      });

      const data = await response.json();
      
      if (data.code === 201) {
        const { accessToken, refreshToken } = data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        return true;
      } else {
        setError(data.message);
        return false;
      }
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    const userId = user?.sub;
    
    if (token && userId) {
      try {
        await fetch('http://localhost:3000/auth-management/api/v1/auth/log-out', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId })
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  }, [user]);

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// useAuth.js
export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

#### Component Example
```javascript
// LoginComponent.js
import { useAuth } from './useAuth';
import { useState } from 'react';

export function LoginComponent() {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      // Navigate to dashboard
      window.location.href = '/dashboard';
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}
```

---

### 3️⃣ **Vue.js 3 Composition API**

```javascript
// composables/useAuth.js
import { ref, computed } from 'vue';

export function useAuth() {
  const user = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const login = async (email, password) => {
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
        return true;
      } else {
        error.value = data.message;
        return false;
      }
    } catch (err) {
      error.value = err.message;
      return false;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        await fetch('http://localhost:3000/auth-management/api/v1/auth/log-out', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId: user.value?.sub })
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    user.value = null;
  };

  const isAuthenticated = computed(() => !!localStorage.getItem('accessToken'));

  return {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated
  };
}
```

---

### 4️⃣ **Axios HTTP Client**

```javascript
// axiosInstance.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - thêm token vào headers
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor - xử lý lỗi
axiosInstance.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response?.status === 401) {
    // Token hết hạn - logout
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  }
  return Promise.reject(error);
});

export default axiosInstance;

// authService.js
import axiosInstance from './axiosInstance';

export const authService = {
  login: (email, password) => 
    axiosInstance.post('/auth-management/api/v1/auth/log-in', {
      identifier: email,
      password
    }),
  
  register: (email, password, firstName, lastName) =>
    axiosInstance.post('/auth/register', {
      email,
      password,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`
    }),
  
  getProfile: () =>
    axiosInstance.get('/auth/profile'),
  
  logout: (userId) =>
    axiosInstance.post('/auth-management/api/v1/auth/log-out', {
      userId
    })
};
```

---

### 5️⃣ **TypeScript Types**

```typescript
// types/auth.ts
export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
}

export interface LogoutRequest {
  userId: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  authenticated?: boolean;
}

export interface UserProfile {
  sub: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN' | 'BAKER';
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
```

---

## 🔒 Security Tips

✅ **DO:**
- Lưu tokens trong `localStorage` hoặc `sessionStorage` (hoặc secure cookies)
- Gửi `accessToken` trong header `Authorization: Bearer <token>`
- Implement token refresh logic
- Clear tokens khi logout
- Validate token trước khi gọi API

❌ **DON'T:**
- Lưu tokens trong component state (có thể mất khi refresh page)
- Gửi tokens qua query parameters
- Lưu sensitive data trong localStorage ngoài tokens
- Hiển thị full tokens trong logs/console

---

## 🛠️ Debugging Tips

```javascript
// Kiểm tra token
console.log(localStorage.getItem('accessToken'));

// Decode JWT (không cần tải thêm library)
function decodeToken(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64).split('').map((c) => 
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join('')
  );
  return JSON.parse(jsonPayload);
}

// Usage
const token = localStorage.getItem('accessToken');
const payload = decodeToken(token);
console.log('Token expires at:', new Date(payload.exp * 1000));
```

---

**Version:** 1.0  
**Last Updated:** May 2026
