import { Request, Response } from 'express';
import crypto from 'crypto';
import { supabaseAdmin } from '../../config/supabase';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { env } from '../../config/env';
import logger from '../../config/logger';

export const verifyPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({ success: false, error: 'Missing Razorpay keys in body' });
      return;
    }

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      res.status(400).json({ success: false, error: 'Payment signature verification failed' });
      return;
    }

    // Update payment record in database
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('razorpay_order_id', razorpay_order_id)
      .select()
      .single();

    if (paymentError || !payment) {
      logger.error('Error fetching/updating payment record:', paymentError);
      res.status(500).json({ success: false, error: 'Failed to record payment' });
      return;
    }

    // Update order status to confirmed
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'confirmed',
        payment_status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.order_id)
      .select()
      .single();

    if (orderError) {
      logger.error('Error confirming order:', orderError);
    }

    // Log tracking info
    await supabaseAdmin.from('order_tracking').insert({
      order_id: payment.order_id,
      status: 'confirmed',
      description: 'Razorpay signature verified. Payment completed successfully.'
    });

    // Clear cart items for this user
    await supabaseAdmin.from('cart_items').delete().eq('user_id', user.id);

    res.status(200).json({
      success: true,
      message: 'Payment verified and order confirmed successfully',
      data: order,
    });
  } catch (error) {
    logger.error('verifyPayment controller error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    if (!signature) {
      res.status(400).json({ success: false, error: 'Webhook signature is missing' });
      return;
    }

    // Validate webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (expectedSignature !== signature) {
      logger.error('Razorpay Webhook signature verification failed');
      res.status(400).json({ success: false, error: 'Signature verification failed' });
      return;
    }

    const event = req.body.event;
    logger.info(`Received Razorpay Webhook Event: ${event}`);

    if (event === 'payment.captured') {
      const paymentEntity = req.body.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;

      // Update payment record in database if not already updated
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('razorpay_order_id', razorpayOrderId)
        .single();

      if (!paymentError && payment && payment.status !== 'paid') {
        await supabaseAdmin
          .from('payments')
          .update({
            razorpay_payment_id: razorpayPaymentId,
            status: 'paid',
            gateway_response: paymentEntity,
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.id);

        await supabaseAdmin
          .from('orders')
          .update({
            status: 'confirmed',
            payment_status: 'paid',
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.order_id);

        await supabaseAdmin.from('order_tracking').insert({
          order_id: payment.order_id,
          status: 'confirmed',
          description: 'Payment captured via Razorpay Webhook.'
        });

        // Clear cart
        await supabaseAdmin.from('cart_items').delete().eq('user_id', payment.user_id);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('handleWebhook controller error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
