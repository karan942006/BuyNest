import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { setCart, clearCart as clearCartAction, setCartLoading } from '../store/slices/cartSlice';
import api from '../services/api';
import toast from 'react-hot-toast';

export const useCart = () => {
  const dispatch = useDispatch();
  const { items, subtotal, discount, shipping, total, isLoading } = useSelector((state: RootState) => state.cart);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const fetchCart = async () => {
    if (!isAuthenticated) return;
    dispatch(setCartLoading(true));
    try {
      const response = await api.get('/cart');
      dispatch(setCart(response.data.data));
    } catch (error: any) {
      console.error('Fetch cart error:', error);
    } finally {
      dispatch(setCartLoading(false));
    }
  };

  const addItem = async (productId: string, variantId: string | null = null, quantity: number = 1) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }
    dispatch(setCartLoading(true));
    try {
      await api.post('/cart', { product_id: productId, variant_id: variantId, quantity });
      toast.success('Item added to cart!');
      await fetchCart();
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Failed to add item';
      toast.error(msg);
    } finally {
      dispatch(setCartLoading(false));
    }
  };

  const updateItem = async (itemId: string, payload: { quantity?: number; saved_for_later?: boolean }) => {
    dispatch(setCartLoading(true));
    try {
      await api.put(`/cart/${itemId}`, payload);
      await fetchCart();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update item');
    } finally {
      dispatch(setCartLoading(false));
    }
  };

  const removeItem = async (itemId: string) => {
    dispatch(setCartLoading(true));
    try {
      await api.delete(`/cart/${itemId}`);
      toast.success('Item removed');
      await fetchCart();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to remove item');
    } finally {
      dispatch(setCartLoading(false));
    }
  };

  const clearCart = async () => {
    dispatch(setCartLoading(true));
    try {
      await api.delete('/cart');
      dispatch(clearCartAction());
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to clear cart');
    } finally {
      dispatch(setCartLoading(false));
    }
  };

  return {
    items,
    subtotal,
    discount,
    shipping,
    total,
    isLoading,
    fetchCart,
    addItem,
    updateItem,
    removeItem,
    clearCart,
  };
};

export default useCart;
