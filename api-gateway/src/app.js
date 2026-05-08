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
app.use(express.json());

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
// Ensure pre-flight requests are handled
app.options('*', cors(corsOptions));

// Rate Limiting (100 requests per 15 minutes)
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// Service URLs (localhost for local dev, Docker names for Docker Compose)
const SERVICES = {
  auth:         process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  user:         process.env.USER_SERVICE_URL || 'http://localhost:3008',
  product:      process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
  cart:         process.env.CART_SERVICE_URL || 'http://localhost:3007',
  order:        process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
  payment:      process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005',
  review:       process.env.REVIEW_SERVICE_URL || 'http://localhost:3006',
};

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', createProxyMiddleware({ 
  target: SERVICES.auth, 
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '' },
  logLevel: 'warn'
}));

app.use('/api/users', createProxyMiddleware({ 
  target: SERVICES.user, 
  changeOrigin: true,
  pathRewrite: { '^/api/users': '' },
  logLevel: 'warn'
}));

app.use('/api/products', createProxyMiddleware({ 
  target: SERVICES.product, 
  changeOrigin: true,
  pathRewrite: { '^/api/products': '' },
  logLevel: 'warn'
}));

// Legacy/compat routes used by frontend: forward to product service
app.use('/category-management', createProxyMiddleware({
  target: SERVICES.product,
  changeOrigin: true,
  secure: false,
  xfwd: true,
  logLevel: 'warn',
  pathRewrite: { '^/category-management': '/api/categories' },
  onProxyReq: (proxyReq, req, res) => {
    // forward Authorization header and cookies
    if (req.headers.authorization) {
      proxyReq.setHeader('authorization', req.headers.authorization);
    }
    if (req.headers.cookie) {
      proxyReq.setHeader('cookie', req.headers.cookie);
    }
  }
}));

app.use('/pastry-management', createProxyMiddleware({
  target: SERVICES.product,
  changeOrigin: true,
  secure: false,
  xfwd: true,
  logLevel: 'warn',
  pathRewrite: { '^/pastry-management': '/api/products' },
  onProxyReq: (proxyReq, req, res) => {
    if (req.headers.authorization) {
      proxyReq.setHeader('authorization', req.headers.authorization);
    }
    if (req.headers.cookie) {
      proxyReq.setHeader('cookie', req.headers.cookie);
    }
  }
}));

app.use('/api/cart', createProxyMiddleware({ 
  target: SERVICES.cart, 
  changeOrigin: true,
  pathRewrite: { '^/api/cart': '' },
  logLevel: 'warn'
}));

app.use('/api/orders', createProxyMiddleware({ 
  target: SERVICES.order, 
  changeOrigin: true,
  pathRewrite: { '^/api/orders': '' },
  logLevel: 'warn'
}));

app.use('/api/payments', createProxyMiddleware({ 
  target: SERVICES.payment, 
  changeOrigin: true,
  pathRewrite: { '^/api/payments': '' },
  logLevel: 'warn'
}));

app.use('/api/notifications', createProxyMiddleware({ 
  target: SERVICES.notification, 
  changeOrigin: true,
  pathRewrite: { '^/api/notifications': '' },
  logLevel: 'warn'
}));

app.use('/api/reviews', createProxyMiddleware({ 
  target: SERVICES.review, 
  changeOrigin: true,
  pathRewrite: { '^/api/reviews': '' },
  logLevel: 'warn'
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
