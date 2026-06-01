import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

const app = express();

app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

const corsOptions = {
  origin: ['http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

const isDocker = process.env.DOCKER_ENV === 'true' || process.env.NODE_ENV === 'production';
const paymentTarget = process.env.PAYMENT_SERVICE_URL || (isDocker ? 'http://payment-service:3004' : 'http://localhost:3004');
const productTarget = process.env.PRODUCT_SERVICE_URL || (isDocker ? 'http://product-service:3002' : 'http://localhost:3002');
const authTarget = process.env.AUTH_SERVICE_URL || (isDocker ? 'http://auth-service:3000' : 'http://localhost:3000');

const attachAuthHeaders = (proxyReq: any, req: express.Request) => {
  if (req.headers.authorization) proxyReq.setHeader('authorization', req.headers.authorization as string);
  if (req.headers.cookie) proxyReq.setHeader('cookie', req.headers.cookie as string);
};

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.use('/auth-management', createProxyMiddleware({
  target: authTarget,
  changeOrigin: true,
  secure: false,
  xfwd: true,
  onProxyReq: (proxyReq, req) => attachAuthHeaders(proxyReq, req as express.Request),
}));

app.use('/category-management', createProxyMiddleware({
  target: productTarget,
  changeOrigin: true,
  secure: false,
  xfwd: true,
  pathRewrite: { '^/category-management': '/api/categories' },
  onProxyReq: (proxyReq, req) => attachAuthHeaders(proxyReq, req as express.Request),
}));

app.use('/pastry-management', createProxyMiddleware({
  target: productTarget,
  changeOrigin: true,
  secure: false,
  xfwd: true,
  pathRewrite: { '^/pastry-management': '/api/products' },
  onProxyReq: (proxyReq, req) => attachAuthHeaders(proxyReq, req as express.Request),
}));

app.use('/payments', createProxyMiddleware({
  target: paymentTarget,
  changeOrigin: true,
  secure: false,
  xfwd: true,
  pathRewrite: { '^/payments': '/payments' },
  onProxyReq: (proxyReq, req) => attachAuthHeaders(proxyReq, req as express.Request),
  onError: (err, req, res) => {
    console.error('[Gateway] Payment proxy error:', err);
    if (!res.headersSent) {
      res.status(503).json({ error: 'Payment service unavailable', path: req.url });
    }
  },
}));

app.use((req, res) => res.status(404).json({ error: 'Not found', path: req.path }));

app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Gateway error', err);
  res.status(500).json({ error: 'Gateway error', message: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
