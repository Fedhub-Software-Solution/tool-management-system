import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors';
import { AuthenticatedRequest } from '../types/common.types';

/**
 * Role-based authorization middleware
 * @param roles - Array of allowed roles
 * @returns Middleware function
 */
export const authorize = (...roles: string[] | string[][]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authenticatedReq = req as AuthenticatedRequest;

      if (!authenticatedReq.user) {
        throw new ForbiddenError('User not authenticated');
      }

      // Flatten roles array in case an array was passed (e.g., authorize(['Approver']))
      // or individual roles were passed (e.g., authorize('Approver', 'NPD'))
      const flattenedRoles: string[] = [];
      roles.forEach(role => {
        if (Array.isArray(role)) {
          flattenedRoles.push(...role);
        } else {
          flattenedRoles.push(role);
        }
      });

      // Normalize roles for comparison (trim whitespace and handle case)
      const userRole = String(authenticatedReq.user.role).trim();
      const normalizedRoles = flattenedRoles.map(r => String(r).trim());

      // Log for debugging
      console.log('[Authorization] Checking access:', {
        userRole: userRole,
        userRoleRaw: authenticatedReq.user.role,
        requiredRoles: normalizedRoles,
        requiredRolesRaw: roles,
        userEmail: authenticatedReq.user.email,
        userId: authenticatedReq.user.id,
        roleType: typeof authenticatedReq.user.role,
        rolesMatch: normalizedRoles.includes(userRole),
        roleComparison: normalizedRoles.map(r => ({
          role: r,
          matches: r === userRole,
          equals: r === userRole,
        })),
      });

      // Check if user role is in the allowed roles (case-sensitive exact match)
      if (!normalizedRoles.includes(userRole)) {
        console.error('[Authorization] Access denied:', {
          userRole: userRole,
          userRoleRaw: authenticatedReq.user.role,
          requiredRoles: normalizedRoles,
          requiredRolesRaw: roles,
          rolesMatch: normalizedRoles.includes(userRole),
          roleType: typeof authenticatedReq.user.role,
          roleLength: userRole.length,
          requiredRoleLength: normalizedRoles[0]?.length,
        });
        throw new ForbiddenError(
          `Access denied. Required roles: ${flattenedRoles.join(', ')}. Your role: ${authenticatedReq.user.role}`
        );
      }

      console.log('[Authorization] Access granted:', {
        userRole: userRole,
        requiredRoles: normalizedRoles,
      });

      next();
    } catch (error) {
      next(error);
    }
  };
};

