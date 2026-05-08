const express = require('express');
const { createProxyMiddleware } = require('express-http-proxy');
const authMiddleware = require('../middleware/auth.middleware');
const servicesConfig = require('../config/services.config');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'API Gateway is running' });
});

// Auth routes (public)
router.use('/auth', createProxyMiddleware({
  target: servicesConfig.authService,
  changeOrigin: true,
  pathRewrite: {
    '^/auth': '',
  },
}));

// User routes (protected)
router.use('/users', authMiddleware, createProxyMiddleware({
  target: servicesConfig.userService,
  changeOrigin: true,
  pathRewrite: {
    '^/users': '',
  },
}));

// Product routes
router.use('/products', createProxyMiddleware({
  target: servicesConfig.productService,
  changeOrigin: true,
  pathRewrite: {
    '^/products': '',
  },
}));

// Order routes (protected)
router.use('/orders', authMiddleware, createProxyMiddleware({
  target: servicesConfig.orderService,
  changeOrigin: true,
  pathRewrite: {
    '^/orders': '',
  },
}));

// Payment routes (protected)
router.use('/payments', authMiddleware, createProxyMiddleware({
  target: servicesConfig.paymentService,
  changeOrigin: true,
  pathRewrite: {
    '^/payments': '',
  },
}));

// Cart routes (protected)
router.use('/cart', authMiddleware, createProxyMiddleware({
  target: servicesConfig.cartService,
  changeOrigin: true,
  pathRewrite: {
    '^/cart': '',
  },
}));

// Review routes
router.use('/reviews', createProxyMiddleware({
  target: servicesConfig.reviewService,
  changeOrigin: true,
  pathRewrite: {
    '^/reviews': '',
  },
}));

// Notification routes (protected)
router.use('/notifications', authMiddleware, createProxyMiddleware({
  target: servicesConfig.notificationService,
  changeOrigin: true,
  pathRewrite: {
    '^/notifications': '',
  },
}));

module.exports = router;
