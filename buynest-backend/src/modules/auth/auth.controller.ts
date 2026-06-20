import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../../config/supabase';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import logger from '../../config/logger';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, full_name, role = 'customer' } = req.body;

    if (!email || !password || !full_name) {
      res.status(400).json({ success: false, error: 'Email, password and full_name are required' });
      return;
    }

    // SignUp user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
        }
      }
    });

    if (authError || !authData.user) {
      logger.error('Supabase Auth SignUp error:', authError);
      res.status(400).json({ success: false, error: authError?.message || 'Failed to sign up' });
      return;
    }

    // Update user profile role if custom role requested (e.g. seller, admin)
    if (role && role !== 'customer') {
      const { error: roleUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({ role })
        .eq('id', authData.user.id);
      
      if (roleUpdateError) logger.error('Failed to update role in profile:', roleUpdateError);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Verification email sent (if configured).',
      data: {
        user: authData.user,
      }
    });
  } catch (error) {
    logger.error('register controller error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.session) {
      logger.error('Supabase Auth Login error:', authError);
      res.status(400).json({ success: false, error: authError?.message || 'Invalid email or password' });
      return;
    }

    // Retrieve profile detail
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token: authData.session.access_token,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          full_name: profile?.full_name || authData.user.user_metadata.full_name,
          role: profile?.role || 'customer',
          wallet_balance: profile?.wallet_balance || 0.00,
        }
      }
    });
  } catch (error) {
    logger.error('login controller error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      res.status(404).json({ success: false, error: 'Profile not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        ...profile
      }
    });
  } catch (error) {
    logger.error('getMe controller error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
