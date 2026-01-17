import { Router } from 'express';
import projectsController from '../controllers/projects.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createProjectSchema,
  updateProjectSchema,
} from '../validators/projects.validator';

const router = Router();

// All project routes require authentication
router.use(authenticate);

/**
 * GET /projects
 * Get all projects with filtering and pagination
 * Authorization: All roles
 */
router.get('/', projectsController.getAllProjects);

/**
 * GET /projects/:id
 * Get project by ID
 * Authorization: All roles
 */
router.get('/:id', projectsController.getProjectById);

/**
 * POST /projects
 * Create project
 * Authorization: Approver only
 */
router.post(
  '/',
  authorize('Approver'),
  validate(createProjectSchema),
  projectsController.createProject
);

/**
 * PUT /projects/:id
 * Update project
 * Authorization: Approver only
 */
router.put(
  '/:id',
  authorize('Approver'),
  validate(updateProjectSchema),
  projectsController.updateProject
);

/**
 * DELETE /projects/:id
 * Delete project
 * Authorization: Approver only
 */
router.delete('/:id', authorize('Approver'), projectsController.deleteProject);

export default router;

