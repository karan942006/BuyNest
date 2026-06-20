import { Response } from 'express';
import { supabaseAdmin } from '../../config/supabase';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { razorpay } from '../../config/razorpay';
import { env } from '../../config/env';
import logger from '../../config/logger';

export const createOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { shipping_address_id, payment_method, coupon_code, use_wallet = false, notes } = req.body;

    if (!shipping_address_id || !payment_method) {
      res.status(400).json({ success: false, error: 'shipping_address_id and payment_method are required' });
      return;
    }

    // Fetch user profile (for wallet balance)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      res.status(404).json({ success: false, error: 'User profile not found' });
      return;
    }

    // Fetch address details
    const { data: address, error: addressError } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('id', shipping_address_id)
      .eq('user_id', user.id)
      .single();

    if (addressError || !address) {
      res.status(400).json({ success: false, error: 'Invalid shipping address' });
      return;
    }

    // Fetch cart items
    const { data: cartItems, error: cartError } = await supabaseAdmin
      .from('cart_items')
      .select('*, product:products(*), variant:product_variants(*)')
      .eq('user_id', user.id);

    if (cartError || !cartItems || cartItems.length === 0) {
      res.status(400).json({ success: false, error: 'Shopping cart is empty' });
      return;
    }

    // Verify stock and calculate subtotal
    let subtotal = 0;
    let shippingCharge = 0;
    const orderItemsPayload: any[] = [];

    for (const item of cartItems) {
      const quantity = item.quantity;
      const product = item.product;
      const variant = item.variant;

      // Verify product stock
      if (product.stock < quantity) {
        res.status(400).json({ success: false, error: `Product ${product.name} is out of stock` });
        return;
      }

      let price = product.price;
      let mrp = product.mrp;

      if (variant) {
        if (variant.stock < quantity) {
          res.status(400).json({ success: false, error: `Product Variant ${product.name} - ${variant.name} is out of stock` });
          return;
        }
        if (variant.price) price = variant.price;
        if (variant.mrp) mrp = variant.mrp;
      }

      const itemTotal = price * quantity;
      subtotal += itemTotal;
      shippingCharge += (product.shipping_charge || 0);

      orderItemsPayload.push({
        product_id: product.id,
        variant_id: variant ? variant.id : null,
        seller_id: product.seller_id,
        name: product.name,
        image_url: variant?.image_url || product.image_url || null,
        quantity,
        price,
        mrp,
        discount: (mrp - price) * quantity,
        gst_rate: product.gst_rate || 18.00,
        gst_amount: parseFloat((itemTotal - (itemTotal / (1 + (product.gst_rate || 18.00) / 100))).toFixed(2)),
        total: itemTotal,
      });
    }

    // Check free shipping threshold
    if (subtotal >= 499) {
      shippingCharge = 0;
    }

    let discount = 0;
    let couponId: string | null = null;
    let couponDiscount = 0;

    // Validate coupon code
    if (coupon_code) {
      const { data: coupon, error: couponError } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('code', coupon_code.toUpperCase())
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString())
        .single();

      if (!couponError && coupon) {
        if (subtotal >= (coupon.min_order || 0)) {
          couponId = coupon.id;
          if (coupon.type === 'percentage') {
            couponDiscount = (subtotal * coupon.value) / 100;
            if (coupon.max_discount) {
              couponDiscount = Math.min(couponDiscount, coupon.max_discount);
            }
          } else if (coupon.type === 'flat') {
            couponDiscount = coupon.value;
          }
          couponDiscount = Math.min(couponDiscount, subtotal);
          discount += couponDiscount;
        }
      }
    }

    let walletUsed = 0;
    let totalAmount = subtotal + shippingCharge - discount;

    // Apply wallet points
    if (use_wallet && profile.wallet_balance > 0) {
      walletUsed = Math.min(profile.wallet_balance, totalAmount);
      totalAmount -= walletUsed;
    }

    // Initialize Order DB Record
    const { data: order, error: orderInsertError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: user.id,
        status: 'pending',
        subtotal,
        discount,
        shipping_charge: shippingCharge,
        tax_amount: orderItemsPayload.reduce((acc, item) => acc + item.gst_amount, 0),
        total_amount: totalAmount,
        coupon_id: couponId,
        coupon_discount: couponDiscount,
        wallet_used: walletUsed,
        payment_method,
        payment_status: totalAmount === 0 ? 'paid' : 'pending',
        shipping_address: address,
        billing_address: address,
        notes,
      })
      .select()
      .single();

    if (orderInsertError || !order) {
      logger.error('Error inserting order:', orderInsertError);
      res.status(500).json({ success: false, error: 'Database error placing order' });
      return;
    }

    // Insert order items
    const itemsPayload = orderItemsPayload.map(item => ({ ...item, order_id: order.id }));
    const { error: itemsInsertError } = await supabaseAdmin
      .from('order_items')
      .insert(itemsPayload);

    if (itemsInsertError) {
      logger.error('Error inserting order items:', itemsInsertError);
      res.status(500).json({ success: false, error: 'Database error placing order items' });
      return;
    }

    // Track order creation in order_tracking
    await supabaseAdmin.from('order_tracking').insert({
      order_id: order.id,
      status: 'pending',
      description: 'Order placed successfully.'
    });

    // If fully paid via Wallet or COD
    if (totalAmount === 0 || payment_method === 'cod' || payment_method === 'wallet') {
      // Deduct wallet balance if wallet was used
      if (walletUsed > 0) {
        const newBalance = profile.wallet_balance - walletUsed;
        await supabaseAdmin.from('profiles').update({ wallet_balance: newBalance }).eq('id', user.id);
        
        await supabaseAdmin.from('wallet_transactions').insert({
          user_id: user.id,
          type: 'debit',
          amount: walletUsed,
          balance: newBalance,
          description: `Paid for order ${order.order_number}`,
          ref_type: 'order',
          ref_id: order.id,
        });
      }

      // Update order status to confirmed
      const { data: confirmedOrder, error: updateError } = await supabaseAdmin
        .from('orders')
        .update({
          status: 'confirmed',
          payment_status: payment_method === 'wallet' || totalAmount === 0 ? 'paid' : 'pending'
        })
        .eq('id', order.id)
        .select()
        .single();

      if (updateError) logger.error('Error updating order status:', updateError);

      // Track confirmation
      await supabaseAdmin.from('order_tracking').insert({
        order_id: order.id,
        status: 'confirmed',
        description: 'Payment status verified. Order confirmed.'
      });

      // Clear Cart
      await supabaseAdmin.from('cart_items').delete().eq('user_id', user.id);

      res.status(201).json({
        success: true,
        message: 'Order placed successfully',
        data: confirmedOrder || order,
      });
      return;
    }

    // If Razorpay checkout is selected
    if (payment_method === 'razorpay') {
      if (!razorpay) {
        res.status(500).json({ success: false, error: 'Razorpay integration is offline. Choose COD/Wallet.' });
        return;
      }

      try {
        const razorpayOrder = await razorpay.orders.create({
          amount: Math.round(totalAmount * 100), // in paise
          currency: 'INR',
          receipt: order.id,
          notes: {
            order_number: order.order_number,
            user_id: user.id
          }
        });

        // Save razorpay_order_id in payments table
        await supabaseAdmin.from('payments').insert({
          order_id: order.id,
          user_id: user.id,
          razorpay_order_id: razorpayOrder.id,
          amount: totalAmount,
          method: 'razorpay',
          status: 'pending'
        });

        res.status(201).json({
          success: true,
          message: 'Order created, proceed to payment',
          data: order,
          razorpay: {
            order_id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            key: env.RAZORPAY_KEY_ID
          }
        });
      } catch (rzpError) {
        logger.error('Razorpay Order creation error:', rzpError);
        res.status(500).json({ success: false, error: 'Failed to create payment order with Razorpay' });
      }
      return;
    }

    res.status(400).json({ success: false, error: 'Unsupported payment method' });
  } catch (error) {
    logger.error('createOrder controller error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const getOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*, product:products(*))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching orders:', error);
      res.status(500).json({ success: false, error: 'Database error fetching orders' });
      return;
    }

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    logger.error('getOrders controller error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const getOrderById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*, product:products(*)), tracking:order_tracking(*)')
      .eq('id', id)
      .single();

    if (error || !order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    // Role guard: Only buyer, admin or the items' seller can view
    const isBuyer = order.user_id === user.id;
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    
    if (!isBuyer && !isAdmin) {
      res.status(403).json({ success: false, error: 'Forbidden: Unauthorized access' });
      return;
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    logger.error('getOrderById controller error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
