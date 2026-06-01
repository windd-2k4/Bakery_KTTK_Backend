const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const app = express();

// Security
app.use(helmet());
app.use(morgan('combined'));

// CORS - allow the frontend at http://localhost:5173 with credentials
const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    const allowed = ['http://localhost:5173'];
    if (allowed.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// Rate Limiting (100 requests per 15 minutes)
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// Service URLs (localhost for local dev, Docker names for Docker Compose)
const SERVICES = {
  auth:         process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:3001',
  user:         process.env.USER_SERVICE_URL || 'http://127.0.0.1:3008',
  product:      process.env.PRODUCT_SERVICE_URL || 'http://127.0.0.1:3002',
  cart:         process.env.CART_SERVICE_URL || 'http://127.0.0.1:3006',
  order:        process.env.ORDER_SERVICE_URL || 'http://127.0.0.1:3003',
  payment:      process.env.PAYMENT_SERVICE_URL || 'http://127.0.0.1:3004',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://127.0.0.1:3005',
  review:       process.env.REVIEW_SERVICE_URL || 'http://127.0.0.1:3006',
};

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
const onProxyError = (err, req, res, target) => {
  const portMatch = target?.href?.match(/:(\d+)/);
  const port = portMatch ? portMatch[1] : '3001';
  console.error(`[Proxy Error] Không thể kết nối tới Auth Service (hoặc service tương ứng) tại port ${port}:`, err.message);
  
  if (!res.headersSent) {
    res.status(503).json({ code: 503, message: 'Service Unavailable', data: null });
  }
};

const onProxyReqWithLog = (proxyReq, req, res) => {
  const targetUrl = `${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`;
  console.log(`[Proxy] Forwarding request to: ${targetUrl}`);
  if (req.headers.authorization) {
    proxyReq.setHeader('authorization', req.headers.authorization);
  }
  if (req.headers.cookie) {
    proxyReq.setHeader('cookie', req.headers.cookie);
  }
};

app.use('/auth-management/api/v1/auth', createProxyMiddleware({ 
  target: SERVICES.auth, 
  changeOrigin: true,
  pathRewrite: { '^/': '/auth-management/api/v1/auth/' },
  logLevel: 'warn',
  onProxyReq: onProxyReqWithLog,
  onError: onProxyError
}));

app.use('/auth', createProxyMiddleware({ 
  target: SERVICES.auth, 
  changeOrigin: true,
  pathRewrite: { '^/': '/auth/' },
  logLevel: 'warn',
  onProxyReq: onProxyReqWithLog,
  onError: onProxyError
}));

app.use('/api/users', createProxyMiddleware({ 
  target: SERVICES.user, 
  changeOrigin: true,
  pathRewrite: { '^/api/users': '' },
  logLevel: 'warn',
  onProxyReq: onProxyReqWithLog,
  onError: onProxyError
}));

app.use('/api/products', createProxyMiddleware({ 
  target: SERVICES.product, 
  changeOrigin: true,
  pathRewrite: { '^/api/products': '/products' },
  logLevel: 'warn',
  onProxyReq: onProxyReqWithLog,
  onError: onProxyError
}));

// Native product routes
app.use('/api/categories', createProxyMiddleware({
  target: SERVICES.product,
  changeOrigin: true,
  secure: false,
  xfwd: true,
  logLevel: 'warn',
  pathRewrite: { '^/api/categories': '/category-management/api/v1/categories' },
  onProxyReq: onProxyReqWithLog,
  onError: onProxyError
}));

// Legacy/compat routes used by frontend: forward to product service
app.use('/category-management/api/v1/categories', createProxyMiddleware({
  target: SERVICES.product,
  changeOrigin: true,
  secure: false,
  xfwd: true,
  logLevel: 'warn',
  onProxyReq: onProxyReqWithLog,
  onError: onProxyError
}));

app.use('/pastry-management/api/v1/pastries', createProxyMiddleware({
  target: SERVICES.product,
  changeOrigin: true,
  secure: false,
  xfwd: true,
  logLevel: 'warn',
  onProxyReq: onProxyReqWithLog,
  onError: onProxyError
}));

app.use('/admin/api/v1/pastries', createProxyMiddleware({
  target: SERVICES.product,
  changeOrigin: true,
  secure: false,
  xfwd: true,
  logLevel: 'warn',
  onProxyReq: onProxyReqWithLog,
  onError: onProxyError
}));

app.use('/admin/api/v1/categories', createProxyMiddleware({
  target: SERVICES.product,
  changeOrigin: true,
  secure: false,
  xfwd: true,
  logLevel: 'warn',
  onProxyReq: onProxyReqWithLog,
  onError: onProxyError
}));

app.use('/api/cart', createProxyMiddleware({ 
  target: SERVICES.cart, 
  changeOrigin: true,
  pathRewrite: { '^/api/cart': '' },
  logLevel: 'warn',
  onProxyReq: onProxyReqWithLog,
  onError: onProxyError
}));

app.use('/api/orders', createProxyMiddleware({ 
  target: SERVICES.order, 
  changeOrigin: true,
  pathRewrite: { '^/': '/orders/' },
  logLevel: 'debug',
  onProxyReq: onProxyReqWithLog,
  onError: onProxyError
}));
app.use('/api/payments', createProxyMiddleware({ 
  target: SERVICES.payment, 
  changeOrigin: true,
  pathRewrite: { '^/api/payments': '' },
  logLevel: 'warn',
  onProxyReq: onProxyReqWithLog,
  onError: onProxyError
}));

app.use('/api/notifications', createProxyMiddleware({ 
  target: SERVICES.notification, 
  changeOrigin: true,
  pathRewrite: { '^/api/notifications': '' },
  logLevel: 'warn',
  onProxyReq: onProxyReqWithLog,
  onError: onProxyError
}));

app.use('/api/reviews', createProxyMiddleware({ 
  target: SERVICES.review, 
  changeOrigin: true,
  pathRewrite: { '^/api/reviews': '' },
  logLevel: 'warn',
  onProxyReq: onProxyReqWithLog,
  onError: onProxyError
}));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Gateway error:', err);
  res.status(500).json({ 
    error: 'Gateway error', 
    message: err.message 
  });
});

module.exports = app;
