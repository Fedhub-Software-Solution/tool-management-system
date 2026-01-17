import { Router } from 'express';

const router = Router();

/**
 * GET /
 * API root endpoint - provides API information
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Tool Maintenance System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: {
        login: 'POST /api/auth/login',
        refresh: 'POST /api/auth/refresh',
        logout: 'POST /api/auth/logout',
      },
      users: {
        getAll: 'GET /api/users (Approver only)',
        getById: 'GET /api/users/:id',
        create: 'POST /api/users (Approver only)',
        update: 'PUT /api/users/:id',
        changePassword: 'POST /api/users/:id/change-password',
      },
      projects: {
        getAll: 'GET /api/projects (with filtering, pagination)',
        getById: 'GET /api/projects/:id',
        create: 'POST /api/projects (Approver only)',
        update: 'PUT /api/projects/:id (Approver only)',
        delete: 'DELETE /api/projects/:id (Approver only)',
      },
      prs: {
        getAll: 'GET /api/prs (with filtering, pagination) - Approver, NPD',
        getById: 'GET /api/prs/:id - Approver, NPD',
        create: 'POST /api/prs (NPD only)',
        update: 'PUT /api/prs/:id (NPD only, before approval)',
        approve: 'POST /api/prs/:id/approve (Approver only)',
        reject: 'POST /api/prs/:id/reject (Approver only)',
        sendToSuppliers: 'POST /api/prs/:id/send-to-suppliers (NPD only)',
        award: 'POST /api/prs/:id/award (NPD only)',
        compareQuotations: 'GET /api/prs/:prId/quotations/compare (Approver, NPD)',
        delete: 'DELETE /api/prs/:id (NPD only, only if Submitted)',
      },
      suppliers: {
        getAll: 'GET /api/suppliers (with filtering, pagination)',
        getById: 'GET /api/suppliers/:id',
        create: 'POST /api/suppliers (Approver only)',
        update: 'PUT /api/suppliers/:id (Approver only)',
        delete: 'DELETE /api/suppliers/:id (Approver only)',
      },
      quotations: {
        getAll: 'GET /api/quotations (with filtering, pagination) - Approver, NPD',
        getById: 'GET /api/quotations/:id - Approver, NPD',
        create: 'POST /api/quotations (with optional file upload)',
        evaluate: 'PUT /api/quotations/:id/evaluate (NPD only)',
      },
      handovers: {
        getAll: 'GET /api/handovers (with filtering) - NPD, Maintenance',
        getById: 'GET /api/handovers/:id - NPD, Maintenance',
        create: 'POST /api/handovers (NPD only)',
        approve: 'POST /api/handovers/:id/approve (Maintenance only)',
        reject: 'POST /api/handovers/:id/reject (Maintenance only)',
      },
      inventory: {
        getAll: 'GET /api/inventory (with filtering, pagination) - All roles',
        getById: 'GET /api/inventory/:id?history=true - All roles',
        create: 'POST /api/inventory (Spares only)',
        update: 'PUT /api/inventory/:id (Spares only)',
        adjust: 'POST /api/inventory/:id/adjust (Spares only)',
        lowStock: 'GET /api/inventory/low-stock (Spares only)',
      },
      requests: {
        getAll: 'GET /api/requests (with filtering) - Spares (all), Indentor (own)',
        getById: 'GET /api/requests/:id - Spares (all), Indentor (own)',
        create: 'POST /api/requests (Indentor only)',
        fulfill: 'POST /api/requests/:id/fulfill (Spares only)',
        reject: 'POST /api/requests/:id/reject (Spares only)',
      },
      reports: {
        dashboard: 'GET /api/reports/dashboard - All roles (role-based filtering)',
        prSummary: 'GET /api/reports/pr-summary - Approver, NPD',
        inventory: 'GET /api/reports/inventory - All roles',
        projects: 'GET /api/reports/projects - All roles',
      },
      notifications: {
        getAll: 'GET /api/notifications - All roles (own notifications)',
        unreadCount: 'GET /api/notifications/unread-count - All roles',
        markAsRead: 'PUT /api/notifications/:id/read - All roles',
        markAllAsRead: 'PUT /api/notifications/read-all - All roles',
      },
    },
    documentation: 'See API documentation for details',
  });
});

export default router;

