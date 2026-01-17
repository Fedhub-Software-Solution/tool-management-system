import projectsRepository from '../repositories/projects.repository';
import { generateProjectNumber } from '../utils/project-number';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectFilters,
  ProjectResponse,
} from '../types/project.types';
import { NotFoundError, ConflictError } from '../utils/errors';
import { PROJECT_STATUS } from '../utils/constants';

export class ProjectsService {
  /**
   * Get project by ID
   */
  async getProjectById(id: string): Promise<ProjectResponse> {
    const project = await projectsRepository.findById(id);

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    return this.mapToProjectResponse(project);
  }

  /**
   * Get all projects with filtering and pagination
   */
  async getAllProjects(filters: ProjectFilters = {}) {
    const result = await projectsRepository.findAll(filters);

    return {
      data: result.projects.map((project) => this.mapToProjectResponse(project)),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * Create project
   */
  async createProject(
    data: CreateProjectDto,
    createdBy: string
  ): Promise<ProjectResponse> {
    // Generate project number
    const projectNumber = await generateProjectNumber(() =>
      projectsRepository.getLatestProjectNumber()
    );

    // Check if project number already exists (unlikely but possible)
    const existingProject = await projectsRepository.findByProjectNumber(
      projectNumber
    );
    if (existingProject) {
      throw new ConflictError('Project number already exists');
    }

    // Create project
    const project = await projectsRepository.create({
      ...data,
      projectNumber,
      createdBy,
    });

    return this.mapToProjectResponse(project);
  }

  /**
   * Update project
   */
  async updateProject(
    id: string,
    data: UpdateProjectDto,
    updatedBy: string
  ): Promise<ProjectResponse> {
    const project = await projectsRepository.findById(id);

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const updatedProject = await projectsRepository.update(id, {
      ...data,
      updatedBy,
    });

    return this.mapToProjectResponse(updatedProject);
  }

  /**
   * Delete project
   */
  async deleteProject(id: string): Promise<void> {
    const project = await projectsRepository.findById(id);

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    await projectsRepository.delete(id);
  }

  /**
   * Map Project entity to ProjectResponse
   */
  private mapToProjectResponse(project: any): ProjectResponse {
    return {
      id: project.id,
      projectNumber: project.projectNumber,
      customerPO: project.customerPO,
      partNumber: project.partNumber,
      toolNumber: project.toolNumber,
      price: project.price,
      targetDate: project.targetDate,
      status: project.status,
      description: project.description,
      createdBy: project.creator || project.createdBy,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      updatedBy: project.updater || project.updatedBy || null,
    };
  }
}

export default new ProjectsService();

