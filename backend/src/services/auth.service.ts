import jwt from 'jsonwebtoken';
import { jwtConfig, JWTPayload } from '../config/jwt';
import usersRepository from '../repositories/users.repository';
import { hashPassword, comparePassword } from '../utils/password';
import { UnauthorizedError, NotFoundError } from '../utils/errors';
import { LoginDto, AuthResponse, RefreshTokenDto } from '../types/user.types';

export class AuthService {
  /**
   * Generate access token
   */
  generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
    });
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(payload: JWTPayload): string {
    return jwt.sign(payload, jwtConfig.refreshSecret, {
      expiresIn: jwtConfig.refreshExpiresIn,
    });
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, jwtConfig.refreshSecret) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Refresh token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid refresh token');
      }
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(loginData: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginData;

    // Find user by email
    const user = await usersRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedError('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update last login
    await usersRepository.updateLastLogin(user.id);

    // Generate tokens
    const payload: JWTPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const token = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    // Return user data (exclude password hash)
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      employeeId: user.employeeId,
      phone: user.phone,
      department: user.department,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return {
      user: userResponse,
      token,
      refreshToken,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshData: RefreshTokenDto): Promise<{ token: string }> {
    const { refreshToken } = refreshData;

    // Verify refresh token
    const payload = this.verifyRefreshToken(refreshToken);

    // Check if user still exists and is active
    const user = await usersRepository.findById(payload.id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is inactive');
    }

    // Generate new access token
    const newPayload: JWTPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const token = this.generateAccessToken(newPayload);

    return { token };
  }
}

export default new AuthService();

