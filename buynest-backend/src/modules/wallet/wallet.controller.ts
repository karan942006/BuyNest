import { Response } from 'express';
import { supabaseAdmin } from '../../config/supabase';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import logger from '../../config/logger';

export const getTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    const { data: transactions, error } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching transactions:', error);
      res.status(500).json({ success: false, error: 'Database error fetching transactions' });
      return;
    }

    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    logger.error('getTransactions controller error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const topupWallet = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { amount } = req.body;

    const topupAmount = parseFloat(amount);
    if (isNaN(topupAmount) || topupAmount <= 0) {
      res.status(400).json({ success: false, error: 'Valid top-up amount is required' });
      return;
    }

    // Get current profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('wallet_balance')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      res.status(404).json({ success: false, error: 'Profile not found' });
      return;
    }

    const newBalance = parseFloat(profile.wallet_balance.toString()) + topupAmount;

    // Update wallet balance
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ wallet_balance: newBalance })
      .eq('id', user.id);

    if (updateError) {
      logger.error('Error updating wallet balance:', updateError);
      res.status(500).json({ success: false, error: 'Database error updating balance' });
      return;
    }

    // Add wallet transaction log
    const { data: tx, error: txError } = await supabaseAdmin
      .from('wallet_transactions')
      .insert({
        user_id: user.id,
        type: 'credit',
        amount: topupAmount,
        balance: newBalance,
        description: 'Wallet top-up',
        ref_type: 'topup',
      })
      .select()
      .single();

    if (txError) logger.error('Error logging wallet transaction:', txError);

    res.status(200).json({
      success: true,
      message: 'Wallet balance topped up successfully',
      data: {
        transaction: tx,
        new_balance: newBalance
      }
    });
  } catch (error) {
    logger.error('topupWallet controller error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
