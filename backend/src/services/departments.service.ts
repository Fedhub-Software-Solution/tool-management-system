import departmentsRepository from '../repositories/departments.repository';
import { CreateDepartmentDto, UpdateDepartmentDto, DepartmentResponse } from '../types/department.types';
import { NotFoundError, ConflictError } from '../utils/errors';

export class DepartmentsService {
  /**
   * Get all departments
   */
  async getAllDepartments(): Promise<DepartmentResponse[]> {
    const departments = await departmentsRepository.findAll();
    return departments.map((dept) => this.mapToDepartmentResponse(dept));
  }

  /**
   * Get department by ID
   */
  async getDepartmentById(id: string): Promise<DepartmentResponse> {
    const department = await departmentsRepository.findById(id);

    if (!department) {
      throw new NotFoundError('Department not found');
    }

    return this.mapToDepartmentResponse(department);
  }

  /**
   * Create department
   */
  async createDepartment(data: CreateDepartmentDto, createdBy?: string): Promise<DepartmentResponse> {
    // Check if department name already exists
    const existingDepartment = await departmentsRepository.findByName(data.name);
    if (existingDepartment) {
      throw new ConflictError('Department name already exists');
    }

    const department = await departmentsRepository.create({
      ...data,
      createdBy,
    });

    // Get member count for the new department
    const departmentWithMembers = await departmentsRepository.findById(department.id);

    return this.mapToDepartmentResponse(departmentWithMembers!);
  }

  /**
   * Update department
   */
  async updateDepartment(id: string, data: UpdateDepartmentDto, updatedBy?: string): Promise<DepartmentResponse> {
    const department = await departmentsRepository.findById(id);

    if (!department) {
      throw new NotFoundError('Department not found');
    }

    // Check if department name is being changed and if it already exists
    if (data.name && data.name !== department.name) {
      const existingDepartment = await departmentsRepository.findByName(data.name);
      if (existingDepartment) {
        throw new ConflictError('Department name already exists');
      }
    }

    const updatedDepartment = await departmentsRepository.update(id, {
      ...data,
      updatedBy,
    });

    // Get member count for the updated department
    const departmentWithMembers = await departmentsRepository.findById(updatedDepartment.id);

    return this.mapToDepartmentResponse(departmentWithMembers!);
  }

  /**
   * Delete department
   */
  async deleteDepartment(id: string): Promise<void> {
    const department = await departmentsRepository.findById(id);

    if (!department) {
      throw new NotFoundError('Department not found');
    }

    await departmentsRepository.delete(id);
  }

  /**
   * Map Department entity to DepartmentResponse
   */
  private mapToDepartmentResponse(department: any): DepartmentResponse {
    return {
      id: department.id,
      name: department.name,
      head: department.head,
      description: department.description,
      members: department.members || 0,
      createdAt: department.createdAt.toISOString(),
      updatedAt: department.updatedAt.toISOString(),
      createdBy: department.createdBy,
      updatedBy: department.updatedBy,
    };
  }
}

export default new DepartmentsService();

