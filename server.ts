import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { authRouter } from './server/routes/authRoutes.ts';
import { reportRouter } from './server/routes/reportRoutes.ts';
import { matchRouter } from './server/routes/matchRoutes.ts';
import { verificationRouter } from './server/routes/verificationRoutes.ts';
import { recoveryRouter } from './server/routes/recoveryRoutes.ts';
import { dashboardRouter } from './server/routes/dashboardRoutes.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging in dev
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API ${req.method}] ${req.path}`);
    }
    next();
  });
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    platform: 'BagMatch Aviation Lost & Found Recovery Platform',
    gemini_configured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// REST API V1 Endpoints
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/reports', reportRouter);
app.use('/api/v1/matches', matchRouter);
app.use('/api/v1/verifications', verificationRouter);
app.use('/api/v1/recovery', recoveryRouter);
app.use('/api/v1/dashboard', dashboardRouter);

// Fallback convenience aliases
app.use('/api/auth', authRouter);
app.use('/api/reports', reportRouter);
app.use('/api/matches', matchRouter);
app.use('/api/verifications', verificationRouter);
app.use('/api/recovery', recoveryRouter);
app.use('/api/dashboard', dashboardRouter);

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error occurred.',
  });
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    // Serve production static build
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Development mode with Vite dev server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✈️  BagMatch fullstack server active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
