import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { salesApi } from '../../lib/api/endpoints';
import { useCartStore } from '../../store/cartStore';
import { useShiftStore } from '../../store/shiftStore';
import { toast } from '../../store/toastStore';
import { formatRupiah } from '../../lib/formatters';
import type { Sale } from '../../types';
import {
  Banknote,
  QrCode,
  CreditCard,
  Building,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (completedSale: Sale) => void;
}

type PaymentMethodType = 'CASH' | 'QRIS' | 'DEBIT' | 'TRANSFER';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { items, discount, finalAmount, clearCart } = useCartStore();
  const { activeShift } = useShiftStore();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CASH');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const payable = finalAmount();

  useEffect(() => {
    if (isOpen) {
      setAmountPaid(payable);
    }
  }, [isOpen, payable, paymentMethod]);

  const changeAmount = amountPaid - payable;
  const isSufficient = amountPaid >= payable;

  const getQuickCashOptions = () => {
    const opts = new Set<number>();
    opts.add(payable);
    [10000, 20000, 50000, 100000, 200000, 500000].forEach((base) => {
      if (base >= payable) {
        opts.add(base);
      } else {
        const ceilBase = Math.ceil(payable / base) * base;
        opts.add(ceilBase);
      }
    });
    return Array.from(opts).sort((a, b) => a - b).slice(0, 5);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error('Keranjang masih kosong');
      return;
    }

    if (!activeShift) {
      toast.error('Shift kasir belum dibuka');
      return;
    }

    if (paymentMethod === 'CASH' && !isSufficient) {
      toast.error('Jumlah uang tunai yang dibayarkan kurang');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        shift_id: activeShift.id,
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
        })),
        payment_method: paymentMethod,
        paid_amount: paymentMethod === 'CASH' ? amountPaid : payable,
        discount_amount: discount,
        notes: notes || undefined,
      };

      const res = await salesApi.checkout(payload);
      if (res.data.success) {
        const sale = res.data.data;
        const invoiceNum = sale.sale_number || sale.invoice_number || `#${sale.id}`;
        toast.success(`Transaksi ${invoiceNum} berhasil!`);
        clearCart();
        onSuccess(sale);
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Gagal memproses transaksi checkout';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Selesaikan Pembayaran (Checkout)" maxWidth="lg">
      <form onSubmit={handleCheckout} className="space-y-5">
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 rounded-2xl text-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
                Total Tagihan Belanja
              </span>
              <h2 className="text-3xl font-extrabold text-white mt-0.5 tracking-tight">
                {formatRupiah(payable)}
              </h2>
            </div>
            {discount > 0 && (
              <div className="text-right">
                <span className="text-[11px] text-indigo-300">Diskon Transaksi:</span>
                <p className="text-sm font-semibold text-rose-300">-{formatRupiah(discount)}</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Metode Pembayaran
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'CASH', label: 'Tunai (Cash)', icon: Banknote },
              { id: 'QRIS', label: 'QRIS', icon: QrCode },
              { id: 'DEBIT', label: 'Kartu Debit', icon: CreditCard },
              { id: 'TRANSFER', label: 'Transfer Bank', icon: Building },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = paymentMethod === m.id;
              return (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => {
                    setPaymentMethod(m.id as PaymentMethodType);
                    if (m.id !== 'CASH') {
                      setAmountPaid(payable);
                    }
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/20 font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="text-xs">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {paymentMethod === 'CASH' ? (
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Jumlah Uang Diterima (Cash)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                  Rp
                </span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  required
                  value={amountPaid || ''}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  placeholder="0"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-lg text-slate-900 bg-white"
                  autoFocus
                />
              </div>

              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {getQuickCashOptions().map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => setAmountPaid(opt)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${
                      amountPaid === opt
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {opt === payable ? 'Uang Pas' : formatRupiah(opt)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-sm">
              <span className="font-semibold text-slate-600">Uang Kembalian:</span>
              <span
                className={`font-extrabold text-lg ${
                  changeAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {changeAmount >= 0 ? formatRupiah(changeAmount) : `Kurang ${formatRupiah(Math.abs(changeAmount))}`}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Catatan Transaksi Digital (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Pembayaran QRIS Berhasil / No Ref"
                className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs bg-white"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm transition"
          >
            Kembali
          </button>
          <button
            type="submit"
            disabled={loading || (paymentMethod === 'CASH' && !isSufficient)}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition shadow-md disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Memproses...' : 'Bayar & Selesaikan (F9)'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
