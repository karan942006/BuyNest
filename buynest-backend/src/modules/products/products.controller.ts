import { Request, Response } from 'express';
import { supabaseAdmin } from '../../config/supabase';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import logger from '../../config/logger';

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, brand, search, minPrice, maxPrice, sort, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from('products')
      .select('*, seller:sellers(store_name), images:product_images(*)', { count: 'exact' });

    // Filter by active products unless requested by seller/admin
    query = query.eq('status', 'active');

    if (category) {
      query = query.eq('category_id', category as string);
    }
    if (brand) {
      query = query.eq('brand_id', brand as string);
    }
    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice as string));
    }
    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice as string));
    }
    if (search) {
      query = query.textSearch('search_vector', search as string);
    }

    // Sort options
    if (sort === 'price_asc') {
      query = query.order('price', { ascending: true });
    } else if (sort === 'price_desc') {
      query = query.order('price', { ascending: false });
    } else if (sort === 'rating') {
      query = query.order('rating', { ascending: false });
    } else if (sort === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order('sold_count', { ascending: false });
    }

    // Pagination
    query = query.range(offset, offset + limitNum - 1);

    const { data: products, count, error } = await query;

    if (error) {
      logger.error('Error fetching products:', error);
      res.status(500).json({ success: false, error: 'Database error fetching products' });
      return;
    }

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total: count || 0,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil((count || 0) / limitNum)
      }
    });
  } catch (error) {
    logger.error('getProducts controller error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select('*, seller:sellers(*), images:product_images(*), variants:product_variants(*), videos:product_videos(*)')
      .eq('id', id)
      .single();

    if (error || !product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    // Increment view count asynchronously
    supabaseAdmin.rpc('increment_view_count', { product_id: id }).then(({ error: rpcError }) => {
      if (rpcError) logger.error('Error incrementing view count:', rpcError);
    });

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    logger.error('getProductById controller error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const createProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    
    // Retrieve seller profile for the current user
    const { data: seller, error: sellerError } = await supabaseAdmin
      .from('sellers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (sellerError || !seller) {
      res.status(403).json({ success: false, error: 'Forbidden: User is not registered as a seller' });
      return;
    }

    const { images, ...productData } = req.body;

    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .insert({
        ...productData,
        seller_id: seller.id,
      })
      .select()
      .single();

    if (productError || !product) {
      logger.error('Error creating product:', productError);
      res.status(500).json({ success: false, error: 'Database error creating product' });
      return;
    }

    // Insert product images if provided
    if (images && images.length > 0) {
      const imagesPayload = images.map((img: any, index: number) => ({
        product_id: product.id,
        url: img.url,
        alt_text: img.alt_text || product.name,
        is_primary: img.is_primary || index === 0,
        sort_order: img.sort_order || index,
      }));

      const { error: imagesError } = await supabaseAdmin
        .from('product_images')
        .insert(imagesPayload);

      if (imagesError) {
        logger.error('Error uploading product images:', imagesError);
      }
    }

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    logger.error('createProduct controller error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const updateProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Check ownership of product (must be owned by the seller)
    const { data: product, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('seller_id, sellers(user_id)')
      .eq('id', id)
      .single();

    if (fetchError || !product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    const sellerUserId = (product.sellers as any)?.user_id || (product as any).seller?.user_id;
    if (sellerUserId !== user.id && user.role !== 'admin' && user.role !== 'super_admin') {
      res.status(403).json({ success: false, error: 'Forbidden: You do not own this product' });
      return;
    }

    const { images, ...productData } = req.body;

    const { data: updatedProduct, error: updateError } = await supabaseAdmin
      .from('products')
      .update(productData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      logger.error('Error updating product:', updateError);
      res.status(500).json({ success: false, error: 'Database error updating product' });
      return;
    }

    res.status(200).json({ success: true, data: updatedProduct });
  } catch (error) {
    logger.error('updateProduct controller error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const deleteProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Check ownership
    const { data: product, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('seller_id, sellers(user_id)')
      .eq('id', id)
      .single();

    if (fetchError || !product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    const sellerUserId = (product.sellers as any)?.user_id || (product as any).seller?.user_id;
    if (sellerUserId !== user.id && user.role !== 'admin' && user.role !== 'super_admin') {
      res.status(403).json({ success: false, error: 'Forbidden: You do not own this product' });
      return;
    }

    const { error: deleteError } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);

    if (deleteError) {
      logger.error('Error deleting product:', deleteError);
      res.status(500).json({ success: false, error: 'Database error deleting product' });
      return;
    }

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    logger.error('deleteProduct controller error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      logger.error('Error fetching categories:', error);
      res.status(500).json({ success: false, error: 'Database error fetching categories' });
      return;
    }

    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    logger.error('getCategories controller error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
