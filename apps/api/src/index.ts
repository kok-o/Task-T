import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { authRouter } from './routes/auth.routes';
import { mastersRouter } from './routes/masters.routes';
import { servicesRouter } from './routes/services.routes';
import { clientsRouter } from './routes/clients.routes';
import { appointmentsRouter } from './routes/appointments.routes';
import { dashboardRouter } from './routes/dashboard.routes';
import { notificationsRouter } from './routes/notifications.routes';

import { errorHandler } from './middleware/error.middleware';
import { startCronJobs } from './jobs/notifications.job';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
const API = '/api/v1';
app.use(`${API}/auth`, authRouter);
app.use(`${API}/masters`, mastersRouter);
app.use(`${API}/services`, servicesRouter);
app.use(`${API}/clients`, clientsRouter);
app.use(`${API}/appointments`, appointmentsRouter);
app.use(`${API}/dashboard`, dashboardRouter);
app.use(`${API}/notifications`, notificationsRouter);


// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);

  // Start cron jobs
  if (process.env.NODE_ENV !== 'test') {
    startCronJobs();
    console.log('⏰ Cron jobs started');
  }
});

export default app;
