import { create } from 'zustand';
import type { CartItem, Product } from '../types';

interface CartState {
  items: CartItem[];
  discount: number;
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  setDiscount: (amount: number) => void;
  clearCart: () => void;
  // Derived totals
  totalAmount: () => number;
  finalAmount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discount: 0,

  addItem: (product) => {
    const { items } = get();
    const existing = items.find((i) => i.product.id === product.id);
    if (existing) {
      set({
        items: items.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.product.sell_price }
            : i
        ),
      });
    } else {
      set({
        items: [
          ...items,
          { product, quantity: 1, subtotal: product.sell_price },
        ],
      });
    }
  },

  removeItem: (productId) => {
    set({ items: get().items.filter((i) => i.product.id !== productId) });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      set({ items: get().items.filter((i) => i.product.id !== productId) });
      return;
    }
    set({
      items: get().items.map((i) =>
        i.product.id === productId
          ? { ...i, quantity, subtotal: quantity * i.product.sell_price }
          : i
      ),
    });
  },

  setDiscount: (amount) => set({ discount: amount }),

  clearCart: () => set({ items: [], discount: 0 }),

  totalAmount: () => get().items.reduce((sum, i) => sum + i.subtotal, 0),

  finalAmount: () => {
    const total = get().totalAmount();
    const final = total - get().discount;
    return final < 0 ? 0 : final;
  },
}));
