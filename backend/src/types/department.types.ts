export interface CreateDepartmentDto {
  name: string;
  head: string;
  description?: string;
}

export interface UpdateDepartmentDto {
  name?: string;
  head?: string;
  description?: string;
}

export interface DepartmentResponse {
  id: string;
  name: string;
  head: string;
  description?: string;
  members: number; // Automatically calculated from users
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

