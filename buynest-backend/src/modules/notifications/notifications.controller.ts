import { Response } from 'express';
import { supabaseAdmin } from '../../config/supabase';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import logger from '../../config/logger';

export const getNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching notifications:', error);
      res.status(500).json({ success: false, error: 'Database error fetching notifications' });
      return;
    }

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    logger.error('getNotifications controller error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { id } = req.params;

    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !notification) {
      res.status(404).json({ success: false, error: 'Notification not found or unauthorized' });
      return;
    }

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    logger.error('markAsRead controller error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
