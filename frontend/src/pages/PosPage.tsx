import React, { useState, useEffect } from 'react';
import { ProductCatalog } from '../components/pos/ProductCatalog';
import { CartPanel } from '../components/pos/CartPanel';
import { CheckoutModal } from '../components/pos/CheckoutModal';
import { ReceiptModal } from '../components/common/ReceiptModal';
import { OpenShiftModal } from '../components/pos/OpenShiftModal';
import { useShiftStore } from '../store/shiftStore';
import { useCartStore } from '../store/cartStore';
import type { Sale } from '../types';
import { AlertTriangle } from 'lucide-react';

export const PosPage: React.FC = () => {
  const { activeShift, fetchActiveShift } = useShiftStore();
  const { items, clearCart } = useCartStore();

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [openShiftModalOpen, setOpenShiftModalOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F9 for checkout
      if (e.key === 'F9') {
        e.preventDefault();
        if (items.length > 0 && activeShift) {
          setCheckoutModalOpen(true);
        }
      }
      // F4 to clear cart
      if (e.key === 'F4') {
        e.preventDefault();
        clearCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, activeShift, clearCart]);

  const handleCheckoutSuccess = (sale: Sale) => {
    setCheckoutModalOpen(false);
    setCompletedSale(sale);
    setReceiptModalOpen(true);
    // Refresh shift stats
    fetchActiveShift();
  };

  return (
    <div className="h-[calc(100vh-4rem)] p-4 flex flex-col gap-3">
      {/* Shift Alert Banner if Not Open */}
      {!activeShift && (
        <div className="bg-amber-500 text-white px-4 py-2.5 rounded-xl shadow-sm flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Perhatian: Shift Kasir saat ini belum dibuka. Anda perlu membuka shift kasir untuk memulai transaksi penjualan.
            </span>
          </div>
          <button
            onClick={() => setOpenShiftModalOpen(true)}
            className="px-3.5 py-1 rounded-lg bg-white text-amber-900 font-bold text-xs hover:bg-amber-50 transition shadow-xs shrink-0 ml-3"
          >
            Buka Shift Sekarang
          </button>
        </div>
      )}

      {/* Main Dual-Column POS Viewport */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
        {/* Left Column: Product Catalog (7 cols on lg, 8 on xl) */}
        <div className="lg:col-span-7 xl:col-span-8 h-full min-h-0">
          <ProductCatalog />
        </div>

        {/* Right Column: Cart Panel (5 cols on lg, 4 on xl) */}
        <div className="lg:col-span-5 xl:col-span-4 h-full min-h-0">
          <CartPanel
            onCheckout={() => setCheckoutModalOpen(true)}
            disabledCheckout={!activeShift || items.length === 0}
          />
        </div>
      </div>

      {/* Modals */}
      <CheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        onSuccess={handleCheckoutSuccess}
      />

      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        sale={completedSale}
      />

      <OpenShiftModal
        isOpen={openShiftModalOpen}
        onClose={() => setOpenShiftModalOpen(false)}
        onSuccess={() => fetchActiveShift()}
      />
    </div>
  );
};
