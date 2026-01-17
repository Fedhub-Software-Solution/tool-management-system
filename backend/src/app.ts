import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/error.middleware';
import { loggerMiddleware } from './middleware/logger.middleware';
import indexRoutes from './routes/index.routes';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import projectsRoutes from './routes/projects.routes';
import prsRoutes from './routes/prs.routes';
import suppliersRoutes from './routes/suppliers.routes';
import quotationsRoutes from './routes/quotations.routes';
import handoversRoutes from './routes/handovers.routes';
import inventoryRoutes from './routes/inventory.routes';
import requestsRoutes from './routes/requests.routes';
import reportsRoutes from './routes/reports.routes';
import notificationsRoutes from './routes/notifications.routes';
import rolesRoutes from './routes/roles.routes';
import departmentsRoutes from './routes/departments.routes';
import partNumberConfigRoutes from './routes/part-number-config.routes';
import toolNumberConfigRoutes from './routes/tool-number-config.routes';
import bomItemRoutes from './routes/bom-item.routes';
import userPreferenceRoutes from './routes/user-preference.routes';
import path from 'path';

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(loggerMiddleware);

// API root route
app.use('/', indexRoutes);

// Health check route
app.use('/health', healthRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/prs', prsRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/quotations', quotationsRoutes);
app.use('/api/handovers', handoversRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/part-number-configs', partNumberConfigRoutes);
app.use('/api/tool-number-configs', toolNumberConfigRoutes);
app.use('/api/bom-items', bomItemRoutes);
app.use('/api/user-preferences', userPreferenceRoutes);
// etc.

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;

