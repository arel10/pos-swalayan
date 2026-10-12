import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { shiftsApi } from '../../lib/api/endpoints';
import { useShiftStore } from '../../store/shiftStore';
import { toast } from '../../store/toastStore';
import { formatRupiah } from '../../lib/formatters';
import type { CashierShift } from '../../types';
import { Calculator } from 'lucide-react';

interface CloseShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: CashierShift | null;
  onSuccess?: (closedShift: CashierShift) => void;
}

export const CloseShiftModal: React.FC<CloseShiftModalProps> = ({
  isOpen,
  onClose,
  shift,
  onSuccess,
}) => {
  const [actualCash, setActualCash] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { setActiveShift } = useShiftStore();

  if (!shift) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (actualCash < 0) {
      toast.error('Uang fisik di laci tidak boleh negatif');
      return;
    }

    try {
      setLoading(true);
      const res = await shiftsApi.close(shift.id, {
        actual_cash: actualCash,
        notes,
      });
      if (res.data.success) {
        setActiveShift(null);
        toast.success('Shift berhasil ditutup dan direkonsiliasi!');
        onClose();
        if (onSuccess) onSuccess(res.data.data);
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Gagal menutup shift';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tutup Shift & Rekonsiliasi Kas" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Modal Awal Kasir:</span>
            <span className="font-semibold text-slate-800">{formatRupiah(shift.opening_cash)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Total Penjualan Shift:</span>
            <span className="font-semibold text-emerald-600">
              {formatRupiah(shift.total_sales || 0)}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Jumlah Transaksi:</span>
            <span className="font-semibold text-slate-800">{shift.transaction_count || 0}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Uang Fisik Kasir Aktual (Drawer Cash)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
              Rp
            </span>
            <input
              type="number"
              min="0"
              step="1000"
              required
              value={actualCash || ''}
              onChange={(e) => setActualCash(Number(e.target.value))}
              placeholder="0"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-lg text-slate-800"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
            <Calculator className="w-3.5 h-3.5 text-slate-400" />
            Hitung seluruh uang fisik kertas & koin di laci kasir saat ini.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Catatan Rekonsiliasi (Opsional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Keterangan selisih kas / kondisi pergantian shift..."
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm transition"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm transition shadow-sm disabled:opacity-50"
          >
            {loading ? 'Menutup Shift...' : 'Konfirmasi Tutup Shift'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
