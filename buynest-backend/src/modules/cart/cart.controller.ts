import { Response } from 'express';
import { supabaseAdmin } from '../../config/supabase';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import logger from '../../config/logger';

export const getCart = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    const { data: items, error } = await supabaseAdmin
      .from('cart_items')
      .select('*, product:products(*, images:product_images(*)), variant:product_variants(*)')
      .eq('user_id', user.id);

    if (error) {
      logger.error('Error fetching cart:', error);
      res.status(500).json({ success: false, error: 'Database error fetching cart' });
      return;
    }

    res.status(200).json({ success: true, data: items });
  } catch (error) {
    logger.error('getCart controller error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const addToCart = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { product_id, variant_id, quantity = 1 } = req.body;

    if (!product_id) {
      res.status(400).json({ success: false, error: 'product_id is required' });
      return;
    }

    // Fetch product details (price, mrp, stock)
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('price, mrp, stock')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    // Check stock limit
    if (product.stock < quantity) {
      res.status(400).json({ success: false, error: 'Insufficient product stock' });
      return;
    }

    let itemPrice = product.price;
    let itemMrp = product.mrp;

    // Check variant details if variant_id is provided
    if (variant_id) {
      const { data: variant, error: variantError } = await supabaseAdmin
        .from('product_variants')
        .select('price, mrp, stock')
        .eq('id', variant_id)
        .single();

      if (variantError || !variant) {
        res.status(404).json({ success: false, error: 'Product variant not found' });
        return;
      }

      if (variant.stock < quantity) {
        res.status(400).json({ success: false, error: 'Insufficient variant stock' });
        return;
      }

      if (variant.price) itemPrice = variant.price;
      if (variant.mrp) itemMrp = variant.mrp;
    }

    // Insert or update cart item
    const { data: existingItem, error: existingError } = await supabaseAdmin
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', product_id)
      .eq('variant_id', variant_id || null)
      .maybeSingle();

    let result;
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      const { data: updatedItem, error: updateError } = await supabaseAdmin
        .from('cart_items')
        .update({ quantity: newQuantity, price: itemPrice, mrp: itemMrp })
        .eq('id', existingItem.id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      result = updatedItem;
    } else {
      const { data: newItem, error: insertError } = await supabaseAdmin
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id,
          variant_id: variant_id || null,
          quantity,
          price: itemPrice,
          mrp: itemMrp,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      result = newItem;
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error('addToCart controller error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const updateCartItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { quantity, saved_for_later } = req.body;

    const updateFields: any = {};
    if (quantity !== undefined) updateFields.quantity = quantity;
    if (saved_for_later !== undefined) updateFields.saved_for_later = saved_for_later;

    const { data: updatedItem, error } = await supabaseAdmin
      .from('cart_items')
      .update(updateFields)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !updatedItem) {
      res.status(404).json({ success: false, error: 'Cart item not found or unauthorized' });
      return;
    }

    res.status(200).json({ success: true, data: updatedItem });
  } catch (error) {
    logger.error('updateCartItem controller error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const removeCartItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      res.status(404).json({ success: false, error: 'Cart item not found or unauthorized' });
      return;
    }

    res.status(200).json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    logger.error('removeCartItem controller error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const clearCart = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    const { error } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      res.status(500).json({ success: false, error: 'Database error clearing cart' });
      return;
    }

    res.status(200).json({ success: true, message: 'Cart cleared successfully' });
  } catch (error) {
    logger.error('clearCart controller error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
