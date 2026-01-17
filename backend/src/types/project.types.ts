import { ProjectStatus } from '@prisma/client';

export interface CreateProjectDto {
  customerPO: string;
  partNumber: string;
  toolNumber: string;
  price: number;
  targetDate: string; // ISO date string
  status?: ProjectStatus;
  description?: string;
}

export interface UpdateProjectDto {
  customerPO?: string;
  partNumber?: string;
  toolNumber?: string;
  price?: number;
  targetDate?: string;
  status?: ProjectStatus;
  description?: string;
}

export interface ProjectFilters {
  status?: ProjectStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProjectUserInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ProjectResponse {
  id: string;
  projectNumber: string;
  customerPO: string;
  partNumber: string;
  toolNumber: string;
  price: number;
  targetDate: Date;
  status: ProjectStatus;
  description?: string | null;
  createdBy: ProjectUserInfo | string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: ProjectUserInfo | string | null;
}

