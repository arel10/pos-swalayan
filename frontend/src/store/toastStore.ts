import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
}

interface ToastState {
  toasts: ToastItem[];
  show: (type: ToastType, message: string, title?: string) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (type, message, title) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { id, type, message, title }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  remove: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

export const toast = {
  success: (msg: string, title?: string) => useToastStore.getState().show('success', msg, title),
  error: (msg: string, title?: string) => useToastStore.getState().show('error', msg, title),
  info: (msg: string, title?: string) => useToastStore.getState().show('info', msg, title),
  warning: (msg: string, title?: string) => useToastStore.getState().show('warning', msg, title),
};
