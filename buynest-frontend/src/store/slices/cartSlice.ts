import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  price: number;
  mrp: number;
  saved_for_later: boolean;
  product: {
    name: string;
    description?: string;
    price: number;
    mrp: number;
    images?: Array<{ url: string }>;
  };
}

interface CartState {
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  isLoading: boolean;
}

const initialState: CartState = {
  items: [],
  subtotal: 0,
  discount: 0,
  shipping: 0,
  total: 0,
  isLoading: false,
};

const calculateTotals = (state: CartState) => {
  const activeItems = state.items.filter(item => !item.saved_for_later);
  
  state.subtotal = activeItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  state.discount = activeItems.reduce((acc, item) => acc + ((item.mrp - item.price) * item.quantity), 0);
  
  if (state.subtotal === 0) {
    state.shipping = 0;
  } else {
    state.shipping = state.subtotal >= 499 ? 0 : 40; // 40 INR delivery fee below 499
  }
  
  state.total = state.subtotal + state.shipping;
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCart(state, action: PayloadAction<CartItem[]>) {
      state.items = action.payload;
      calculateTotals(state);
    },
    clearCart(state) {
      state.items = [];
      state.subtotal = 0;
      state.discount = 0;
      state.shipping = 0;
      state.total = 0;
    },
    setCartLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    }
  }
});

export const { setCart, clearCart, setCartLoading } = cartSlice.actions;
export default cartSlice.reducer;
