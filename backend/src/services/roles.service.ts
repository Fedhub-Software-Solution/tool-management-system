import rolesRepository from '../repositories/roles.repository';
import { CreateRoleDto, UpdateRoleDto, RoleResponse } from '../types/role.types';
import { NotFoundError, ConflictError } from '../utils/errors';

export class RolesService {
  /**
   * Get all roles
   */
  async getAllRoles(includeInactive = false): Promise<RoleResponse[]> {
    const roles = await rolesRepository.findAll(includeInactive);
    return roles.map((role) => this.mapToRoleResponse(role));
  }

  /**
   * Get role by ID
   */
  async getRoleById(id: string): Promise<RoleResponse> {
    const role = await rolesRepository.findById(id);

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    return this.mapToRoleResponse(role);
  }

  /**
   * Create role
   */
  async createRole(data: CreateRoleDto, createdBy?: string): Promise<RoleResponse> {
    // Check if role name already exists
    const existingRole = await rolesRepository.findByName(data.name);
    if (existingRole) {
      throw new ConflictError('Role name already exists');
    }

    const role = await rolesRepository.create({
      ...data,
      createdBy,
    });

    return this.mapToRoleResponse(role);
  }

  /**
   * Update role
   */
  async updateRole(id: string, data: UpdateRoleDto, updatedBy?: string): Promise<RoleResponse> {
    const role = await rolesRepository.findById(id);

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    // Check if role name is being changed and if it already exists
    if (data.name && data.name !== role.name) {
      const existingRole = await rolesRepository.findByName(data.name);
      if (existingRole) {
        throw new ConflictError('Role name already exists');
      }
    }

    const updatedRole = await rolesRepository.update(id, {
      ...data,
      updatedBy,
    });

    return this.mapToRoleResponse(updatedRole);
  }

  /**
   * Delete role
   */
  async deleteRole(id: string): Promise<void> {
    const role = await rolesRepository.findById(id);

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    await rolesRepository.delete(id);
  }

  /**
   * Map Role entity to RoleResponse
   */
  private mapToRoleResponse(role: any): RoleResponse {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions || [],
      isActive: role.isActive,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      createdBy: role.createdBy,
      updatedBy: role.updatedBy,
      userCount: role.userCount || 0,
    };
  }
}

export default new RolesService();

