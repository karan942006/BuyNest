import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    category_id: z.string().uuid(),
    brand_id: z.string().uuid().optional(),
    name: z.string().min(3).max(255),
    slug: z.string().min(3).max(255),
    description: z.string().optional(),
    short_desc: z.string().optional(),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    price: z.number().nonnegative(),
    mrp: z.number().nonnegative(),
    stock: z.number().int().nonnegative(),
    low_stock_alert: z.number().int().optional(),
    weight: z.number().optional(),
    dimensions: z.object({
      l: z.number(),
      w: z.number(),
      h: z.number(),
      unit: z.string(),
    }).optional(),
    specifications: z.array(z.object({
      key: z.string(),
      value: z.string(),
    })).optional(),
    highlights: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(['draft', 'active', 'inactive', 'out_of_stock']).optional(),
    is_featured: z.boolean().optional(),
    is_returnable: z.boolean().optional(),
    return_days: z.number().int().optional(),
    is_cod: z.boolean().optional(),
    shipping_charge: z.number().optional(),
    free_shipping_above: z.number().optional(),
    images: z.array(z.object({
      url: z.string().url(),
      alt_text: z.string().optional(),
      is_primary: z.boolean().optional(),
      sort_order: z.number().optional()
    })).optional()
  })
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: createProductSchema.shape.body.partial(),
});
