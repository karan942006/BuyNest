import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { supabaseAdmin } from '../config/supabase';
import logger from '../config/logger';

export const authorize = (allowedRoles: string[]) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized: User not authenticated' });
        return;
      }

      // Query database profile to get the role
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || !profile) {
        logger.error(`Error fetching user role for ${user.id}:`, error);
        res.status(403).json({ success: false, error: 'Forbidden: Profile not found' });
        return;
      }

      if (!allowedRoles.includes(profile.role)) {
        res.status(403).json({ success: false, error: 'Forbidden: Insufficient permissions' });
        return;
      }

      // Attach full profile to req.user if needed
      req.user.role = profile.role;
      next();
    } catch (error) {
      logger.error('Authorization middleware error:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  };
};
export default authorize;
