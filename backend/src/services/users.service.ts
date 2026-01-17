import usersRepository from '../repositories/users.repository';
import { hashPassword, comparePassword } from '../utils/password';
import {
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
  UserResponse,
} from '../types/user.types';
import {
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from '../utils/errors';

export class UsersService {
  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<UserResponse> {
    const user = await usersRepository.findById(id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.mapToUserResponse(user);
  }

  /**
   * Get all users
   */
  async getAllUsers(includeInactive = false): Promise<UserResponse[]> {
    const users = await usersRepository.findAll(includeInactive);
    return users.map((user) => this.mapToUserResponse(user));
  }

  /**
   * Create user
   */
  async createUser(data: CreateUserDto, createdBy?: string): Promise<UserResponse> {
    // Check if email already exists
    const existingUser = await usersRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('Email already exists');
    }

    // Check if employee ID already exists (if provided)
    if (data.employeeId) {
      const existingEmployee = await usersRepository.findByEmployeeId(
        data.employeeId
      );
      if (existingEmployee) {
        throw new ConflictError('Employee ID already exists');
      }
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const user = await usersRepository.create({
      ...data,
      passwordHash,
    });

    return this.mapToUserResponse(user);
  }

  /**
   * Update user
   */
  async updateUser(
    id: string,
    data: UpdateUserDto,
    updatedBy?: string
  ): Promise<UserResponse> {
    const user = await usersRepository.findById(id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updatedUser = await usersRepository.update(id, {
      ...data,
      updatedBy,
    });

    return this.mapToUserResponse(updatedUser);
  }

  /**
   * Change password
   */
  async changePassword(
    id: string,
    passwordData: ChangePasswordDto
  ): Promise<void> {
    const user = await usersRepository.findById(id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(
      passwordData.currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Validate new password
    if (passwordData.newPassword.length < 8) {
      throw new ValidationError('New password must be at least 8 characters long');
    }

    // Hash new password
    const newPasswordHash = await hashPassword(passwordData.newPassword);

    // Update password
    await usersRepository.updatePassword(id, newPasswordHash);
  }

  /**
   * Deactivate user
   */
  async deactivateUser(id: string, updatedBy: string): Promise<UserResponse> {
    const user = await usersRepository.findById(id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const deactivatedUser = await usersRepository.deactivate(id, updatedBy);

    return this.mapToUserResponse(deactivatedUser);
  }

  /**
   * Activate user
   */
  async activateUser(id: string, updatedBy: string): Promise<UserResponse> {
    const user = await usersRepository.findById(id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const activatedUser = await usersRepository.activate(id, updatedBy);

    return this.mapToUserResponse(activatedUser);
  }

  /**
   * Map User entity to UserResponse
   */
  private mapToUserResponse(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    employeeId: string | null;
    phone: string | null;
    department: string | null;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as any,
      employeeId: user.employeeId,
      phone: user.phone,
      department: user.department,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

export default new UsersService();

