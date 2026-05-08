# 🎯 Quick Reference Card - API Integration

## 🚀 Three Essential Endpoints

### 1. REGISTER (Đăng Ký)
```
POST /auth-management/api/v1/auth/register
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}

Response (201):
{
  "code": 201,
  "message": "User registered successfully",
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "authenticated": true
  }
}
```

### 2. LOGIN (Đăng Nhập)
```
POST /auth-management/api/v1/auth/log-in
Content-Type: application/json

Request:
{
  "identifier": "user@example.com",
  "password": "password123"
}

Response (200):
{
  "code": 200,
  "message": "Login successful",
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "authenticated": true
  }
}
```

### 3. GET PROFILE (Lấy Thông Tin)
```
GET /auth/profile
Authorization: Bearer <accessToken>

Response (200):
{
  "code": 200,
  "message": "User profile retrieved",
  "data": {
    "sub": "user-id",
    "email": "user@example.com",
    "role": "CUSTOMER"
  }
}
```

---

## ⚙️ Setup Checklist

### Backend ✅
- [x] RegisterDto updated with validation
- [x] New endpoint: `/auth-management/api/v1/auth/register`
- [x] fullName auto-generated from firstName + lastName
- [x] Running on port 3000

### Frontend ⏳
- [ ] Copy `VITE_CONFIG_TEMPLATE.js` → `vite.config.js`
- [ ] Install dependencies: `npm install`
- [ ] Start dev server: `npm run dev`
- [ ] Running on port 5173

### Test ⏳
- [ ] Postman test on backend (port 3000)
- [ ] Browser test via frontend (port 5173)
- [ ] Check database for new user
- [ ] Verify tokens in localStorage

---

## 🔗 Proxy Configuration (vite.config.js)

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

---

## 📱 Frontend Code Snippet (React)

```javascript
async function handleRegister(email, password, firstName, lastName) {
  const response = await fetch('/auth-management/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      firstName,
      lastName
    })
  });

  const data = await response.json();
  
  if (data.code === 201) {
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    // Redirect to dashboard
    window.location.href = '/dashboard';
  } else {
    console.error(data.message);
  }
}
```

---

## 🛠️ Common Issues & Quick Fixes

| Issue | Fix |
|-------|-----|
| **CORS Error** | Use proxy in vite.config.js |
| **400 Bad Request** | Verify email & password sent |
| **500 Server Error** | Check backend logs: `npm run start` |
| **fullName NOT NULL** | Auto-generated now ✅ |
| **Port 5173 not working** | Restart dev server |
| **No proxy response** | Clear browser cache |

---

## 📍 Ports & URLs

| Service | URL | Status |
|---------|-----|--------|
| Backend | http://localhost:3000 | ✅ Running |
| Frontend | http://localhost:5173 | ⏳ Setup |
| Database | localhost:5432 | ✅ Running |

---

## 📋 Request Template

```javascript
// Register
fetch('/auth-management/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: '...',
    password: '...',
    firstName: '...',
    lastName: '...'
  })
})

// Login
fetch('/auth-management/api/v1/auth/log-in', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    identifier: '...',
    password: '...'
  })
})

// Get Profile
fetch('/auth/profile', {
  headers: { 'Authorization': 'Bearer ' + token }
})
```

---

## ✨ Success Indicators

✅ **Registration works when:**
- Status code is 201
- Response has accessToken & refreshToken
- User appears in database with fullName
- Can login with same credentials

✅ **Login works when:**
- Status code is 200
- Response has tokens
- Can fetch /auth/profile with token

✅ **Frontend works when:**
- http://localhost:5173 loads
- Form submits without CORS error
- Tokens saved to localStorage
- Redirects to dashboard

---

## 🚨 Emergency Debug

```bash
# Check backend is running
curl http://localhost:3000/

# Test register endpoint
curl -X POST http://localhost:3000/auth-management/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Check database
docker exec bakery-postgres psql -U postgres -d bakery_db \
  -c "SELECT email, full_name FROM users LIMIT 5;"

# Check frontend proxy
# Open DevTools → Network → look for /auth-management requests

# Restart all services
docker-compose restart
```

---

## 📞 Key Contact Points

- **Backend Issues:** Check `services/auth-service/` logs
- **Frontend Issues:** Check browser DevTools Console & Network
- **Database Issues:** Check `docker-compose ps`
- **Proxy Issues:** Check `vite.config.js` configuration

---

## 📚 Documentation Links

- [Full API Reference](AUTH_API_SUMMARY.md)
- [Frontend Guide](FRONTEND_IMPLEMENTATION_GUIDE.md)
- [Setup & Troubleshooting](BACKEND_FRONTEND_SETUP_GUIDE.md)
- [Verification Checklist](VERIFICATION_CHECKLIST.md)
- [Changes Summary](CHANGES_SUMMARY.md)

---

**Keep this card handy! 🎯**

