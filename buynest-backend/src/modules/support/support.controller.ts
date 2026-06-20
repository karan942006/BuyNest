import { Response } from 'express';
import { supabaseAdmin } from '../../config/supabase';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import logger from '../../config/logger';

export const getTickets = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    const { data: tickets, error } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching support tickets:', error);
      res.status(500).json({ success: false, error: 'Database error fetching support tickets' });
      return;
    }

    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    logger.error('getTickets controller error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const createTicket = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { subject, description, order_id, priority = 'medium' } = req.body;

    if (!subject || !description) {
      res.status(400).json({ success: false, error: 'Subject and description are required' });
      return;
    }

    const { data: ticket, error } = await supabaseAdmin
      .from('support_tickets')
      .insert({
        user_id: user.id,
        order_id: order_id || null,
        subject,
        description,
        priority,
        status: 'open',
      })
      .select()
      .single();

    if (error || !ticket) {
      logger.error('Error creating support ticket:', error);
      res.status(500).json({ success: false, error: 'Database error creating support ticket' });
      return;
    }

    // Insert first message
    await supabaseAdmin.from('support_messages').insert({
      ticket_id: ticket.id,
      sender_id: user.id,
      message: description,
    });

    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    logger.error('createTicket controller error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const getTicketMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { id } = req.params;

    // Check ownership
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('support_tickets')
      .select('user_id')
      .eq('id', id)
      .single();

    if (ticketError || !ticket) {
      res.status(404).json({ success: false, error: 'Ticket not found' });
      return;
    }

    if (ticket.user_id !== user.id && user.role !== 'admin' && user.role !== 'super_admin') {
      res.status(403).json({ success: false, error: 'Forbidden: Access denied' });
      return;
    }

    const { data: messages, error } = await supabaseAdmin
      .from('support_messages')
      .select('*, sender:profiles(full_name, avatar_url, role)')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Error fetching support messages:', error);
      res.status(500).json({ success: false, error: 'Database error fetching messages' });
      return;
    }

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    logger.error('getTicketMessages controller error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const sendTicketMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
      res.status(400).json({ success: false, error: 'Message content is required' });
      return;
    }

    // Check ownership
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('support_tickets')
      .select('user_id')
      .eq('id', id)
      .single();

    if (ticketError || !ticket) {
      res.status(404).json({ success: false, error: 'Ticket not found' });
      return;
    }

    if (ticket.user_id !== user.id && user.role !== 'admin' && user.role !== 'super_admin') {
      res.status(403).json({ success: false, error: 'Forbidden: Access denied' });
      return;
    }

    const { data: msg, error } = await supabaseAdmin
      .from('support_messages')
      .insert({
        ticket_id: id,
        sender_id: user.id,
        message,
      })
      .select()
      .single();

    if (error || !msg) {
      logger.error('Error creating support message:', error);
      res.status(500).json({ success: false, error: 'Database error sending message' });
      return;
    }

    // Update ticket updated_at
    await supabaseAdmin
      .from('support_tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);

    res.status(201).json({ success: true, data: msg });
  } catch (error) {
    logger.error('sendTicketMessage controller error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
