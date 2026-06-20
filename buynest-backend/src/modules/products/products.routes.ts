import { Router } from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getCategories } from './products.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createProductSchema, updateProductSchema } from './products.schema';

const router = Router();

// Public routes
router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/:id', getProductById);

// Protected routes (Sellers and Admins only)
router.post('/', authenticate, authorize(['seller', 'admin', 'super_admin']), validate(createProductSchema), createProduct);
router.put('/:id', authenticate, authorize(['seller', 'admin', 'super_admin']), validate(updateProductSchema), updateProduct);
router.delete('/:id', authenticate, authorize(['seller', 'admin', 'super_admin']), deleteProduct);

export default router;
