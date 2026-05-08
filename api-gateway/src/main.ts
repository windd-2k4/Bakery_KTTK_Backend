import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

const app = express();

// Security
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

// CORS options for frontend
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true);
    const allowed = ['http://localhost:5173'];
    if (allowed.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Rate limiter
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// Services (dev: localhost, prod: docker service names via env)
const SERVICES = {
  product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
  // other services as needed
};

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// Proxy mappings
app.use('/category-management', createProxyMiddleware({
  target: SERVICES.product,
  changeOrigin: true,
  secure: false,
  xfwd: true,
  pathRewrite: { '^/category-management': '/api/categories' },
  onProxyReq: (proxyReq, req) => {
    if (req.headers.authorization) proxyReq.setHeader('authorization', req.headers.authorization as string);
    if (req.headers.cookie) proxyReq.setHeader('cookie', req.headers.cookie as string);
  },
}));

app.use('/pastry-management', createProxyMiddleware({
  target: SERVICES.product,
  changeOrigin: true,
  secure: false,
  xfwd: true,
  pathRewrite: { '^/pastry-management': '/api/products' },
  onProxyReq: (proxyReq, req) => {
    if (req.headers.authorization) proxyReq.setHeader('authorization', req.headers.authorization as string);
    if (req.headers.cookie) proxyReq.setHeader('cookie', req.headers.cookie as string);
  },
}));

// Fallback
app.use((req, res) => res.status(404).json({ error: 'Not found', path: req.path }));

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Gateway error', err);
  res.status(500).json({ error: 'Gateway error', message: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
