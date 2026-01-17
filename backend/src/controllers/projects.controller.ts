import { Request, Response, NextFunction } from 'express';
import projectsService from '../services/projects.service';
import { AuthenticatedRequest } from '../types/common.types';
import { CreateProjectDto, UpdateProjectDto, ProjectFilters } from '../types/project.types';

export class ProjectsController {
  /**
   * GET /projects
   */
  async getAllProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: ProjectFilters = {
        status: req.query.status as any,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await projectsService.getAllProjects(filters);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /projects/:id
   */
  async getProjectById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const project = await projectsService.getProjectById(id);

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /projects
   */
  async createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectData = req.body as CreateProjectDto;
      const authenticatedReq = req as AuthenticatedRequest;
      const createdBy = authenticatedReq.user!.id;

      const project = await projectsService.createProject(projectData, createdBy);

      res.status(201).json({
        success: true,
        data: project,
        message: 'Project created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /projects/:id
   */
  async updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const projectData = req.body as UpdateProjectDto;
      const authenticatedReq = req as AuthenticatedRequest;
      const updatedBy = authenticatedReq.user!.id;

      const project = await projectsService.updateProject(id, projectData, updatedBy);

      res.json({
        success: true,
        data: project,
        message: 'Project updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /projects/:id
   */
  async deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await projectsService.deleteProject(id);

      res.json({
        success: true,
        message: 'Project deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProjectsController();

