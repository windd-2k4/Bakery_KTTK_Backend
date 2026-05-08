module.exports = {
  authService: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
  userService: process.env.USER_SERVICE_URL || 'http://user-service:3002',
  productService: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3003',
  orderService: process.env.ORDER_SERVICE_URL || 'http://order-service:3004',
  paymentService: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3005',
  cartService: process.env.CART_SERVICE_URL || 'http://cart-service:3006',
  reviewService: process.env.REVIEW_SERVICE_URL || 'http://review-service:3007',
  notificationService: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3008',
};
