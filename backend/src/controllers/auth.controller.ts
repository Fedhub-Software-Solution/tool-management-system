import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import { LoginDto, RefreshTokenDto } from '../types/user.types';

export class AuthController {
  /**
   * POST /auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loginData = req.body as LoginDto;
      const result = await authService.login(loginData);

      res.json({
        success: true,
        data: result,
        message: 'Login successful',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/refresh
   */
  async refresh(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const refreshData = req.body as RefreshTokenDto;
      const result = await authService.refreshToken(refreshData);

      res.json({
        success: true,
        data: result,
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Since we're using stateless JWT tokens, logout is handled client-side
      // by removing the token from storage
      // In a production app, you might want to maintain a token blacklist

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();

