import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { initDatabase, getDbStatus } from './src/backend/config/database.js';
import authRoutes from './src/backend/routes/authRoutes.js';
import userRoutes from './src/backend/routes/userRoutes.js';
import courseRoutes from './src/backend/routes/courseRoutes.js';
import assignmentRoutes from './src/backend/routes/assignmentRoutes.js';
import submissionRoutes from './src/backend/routes/submissionRoutes.js';
import gradeRoutes from './src/backend/routes/gradeRoutes.js';
import adminRoutes from './src/backend/routes/adminRoutes.js';
import { getSystemHealth } from './src/backend/controllers/adminController.js';
import { openApiSpec } from './src/backend/swagger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// projectRoot = the repo root regardless of where server.ts lives
const projectRoot = path.resolve(__dirname);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Security headers & CORS
  app.use(
    helmet({
      contentSecurityPolicy: false, // Required for development Vite iframe compatibility
      crossOriginEmbedderPolicy: false
    })
  );
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Initialize Neon PostgreSQL or Local Engine
  await initDatabase();

  // Health and System Diagnostics
  app.get('/api/health', getSystemHealth);
  app.get('/api/docs', (_req, res) => res.json(openApiSpec));

  // Mount API Routers
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/courses', courseRoutes);
  app.use('/api/assignments', assignmentRoutes);
  app.use('/api/submissions', submissionRoutes);
  app.use('/api/grades', gradeRoutes);
  app.use('/api/admin', adminRoutes);

  // Global Error Handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[API Error]:', err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal Server Error'
    });
  });

  // Vite development integration or production static serving
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      configFile: path.resolve(__dirname, 'frontend/vite.config.ts'),
      root: path.resolve(__dirname, 'frontend'),
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const candidates = [
      path.resolve(projectRoot, 'frontend/dist'),
      path.resolve(projectRoot, 'dist'),
    ];

    const distPath = candidates.find(p => fs.existsSync(path.join(p, 'index.html')))
      ?? candidates[0];

    console.log(`[Static] Serving from: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*splat', (_req, res) => {
      const indexFile = path.resolve(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send(`index.html not found. Checked: ${distPath}`);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    const status = getDbStatus();
    console.log(`====================================================`);
    console.log(` UniTask Server is running at http://0.0.0.0:${PORT}`);
    console.log(` Database: [${status.type.toUpperCase()}] ${status.message}`);
    console.log(` Mode: ${isProduction ? 'Production' : 'Development'}`);
    console.log(`====================================================`);
  });
}

startServer().catch(err => {
  console.error('Fatal Server Startup Error:', err);
  process.exit(1);
});
