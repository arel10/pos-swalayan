import React, { useState } from 'react';
import { useCartStore } from '../../store/cartStore';
import { formatRupiah } from '../../lib/formatters';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag } from 'lucide-react';

interface CartPanelProps {
  onCheckout: () => void;
  disabledCheckout?: boolean;
}

export const CartPanel: React.FC<CartPanelProps> = ({
  onCheckout,
  disabledCheckout = false,
}) => {
  const { items, discount, setDiscount, updateQuantity, removeItem, clearCart, totalAmount, finalAmount } =
    useCartStore();

  const [showDiscountInput, setShowDiscountInput] = useState(false);

  const subtotal = totalAmount();
  const payable = finalAmount();
  const totalItemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Cart Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800">Keranjang Kasir</h3>
            <span className="text-[11px] text-slate-500 font-medium">
              {totalItemCount} barang dipilih
            </span>
          </div>
        </div>

        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-rose-600 hover:text-rose-700 hover:underline font-semibold"
          >
            Hapus Semua
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs text-center p-6 space-y-2">
            <ShoppingBag className="w-12 h-12 text-slate-200" />
            <p className="font-bold text-slate-700">Keranjang Masih Kosong</p>
            <p className="text-slate-400">
              Scan barcode di kolom pencarian atau klik produk di katalog sebelah kiri.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.product.id}
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition"
            >
              <div className="flex-1 min-w-0 mr-3">
                <h5 className="font-semibold text-xs text-slate-800 truncate">
                  {item.product.name}
                </h5>
                <p className="text-[11px] text-slate-500">
                  {formatRupiah(item.product.sell_price)} x {item.quantity}
                </p>
                <p className="text-xs font-bold text-indigo-900 mt-0.5">
                  {formatRupiah(item.subtotal)}
                </p>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    updateQuantity(item.product.id, Math.max(1, Number(e.target.value) || 1))
                  }
                  className="w-10 text-center font-bold text-xs py-1 border border-slate-200 rounded-lg bg-white"
                />
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition ml-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary & Checkout Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/80 space-y-3">
        {/* Subtotal & Discount row */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span className="font-semibold text-slate-900">{formatRupiah(subtotal)}</span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <button
              type="button"
              onClick={() => setShowDiscountInput(!showDiscountInput)}
              className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline"
            >
              <Tag className="w-3 h-3" />
              {showDiscountInput ? 'Sembunyikan Diskon' : '+ Beri Diskon'}
            </button>
            {discount > 0 && (
              <span className="font-semibold text-rose-600">-{formatRupiah(discount)}</span>
            )}
          </div>

          {showDiscountInput && (
            <div className="flex items-center gap-2 pt-1 animate-in fade-in">
              <span className="text-[11px] text-slate-500 font-medium">Diskon (Rp):</span>
              <input
                type="number"
                min="0"
                step="1000"
                value={discount || ''}
                onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                placeholder="0"
                className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white font-medium"
              />
            </div>
          )}
        </div>

        {/* Total Grand */}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
            Total Akhir
          </span>
          <span className="font-extrabold text-xl text-indigo-950">
            {formatRupiah(payable)}
          </span>
        </div>

        {/* Checkout Button */}
        <button
          onClick={onCheckout}
          disabled={items.length === 0 || disabledCheckout}
          className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span>Bayar Sekarang (F9)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
