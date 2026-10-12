import { create } from 'zustand';
import type { CashierShift } from '../types';
import { shiftsApi } from '../lib/api/endpoints';

interface ShiftState {
  activeShift: CashierShift | null;
  isLoading: boolean;
  fetchActiveShift: () => Promise<void>;
  setActiveShift: (shift: CashierShift | null) => void;
}

export const useShiftStore = create<ShiftState>((set) => ({
  activeShift: null,
  isLoading: false,

  fetchActiveShift: async () => {
    try {
      set({ isLoading: true });
      const res = await shiftsApi.list({ status: 'OPEN', page: 1, per_page: 1 });
      if (res.data.success && res.data.data.length > 0) {
        set({ activeShift: res.data.data[0] });
      } else {
        set({ activeShift: null });
      }
    } catch {
      set({ activeShift: null });
    } finally {
      set({ isLoading: false });
    }
  },

  setActiveShift: (shift) => set({ activeShift: shift }),
}));
