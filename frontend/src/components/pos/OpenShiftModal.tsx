import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { shiftsApi } from '../../lib/api/endpoints';
import { useShiftStore } from '../../store/shiftStore';
import { toast } from '../../store/toastStore';
import { formatRupiah } from '../../lib/formatters';
import { Banknote } from 'lucide-react';

interface OpenShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const QUICK_OPENING_AMOUNTS = [100000, 200000, 300000, 500000];

export const OpenShiftModal: React.FC<OpenShiftModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [openingCash, setOpeningCash] = useState<number>(200000);
  const [notes, setNotes] = useState<string>('Modal kasir awal');
  const [loading, setLoading] = useState(false);
  const { setActiveShift } = useShiftStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (openingCash < 0) {
      toast.error('Modal awal tidak boleh negatif');
      return;
    }

    try {
      setLoading(true);
      const res = await shiftsApi.open({ opening_cash: openingCash, notes });
      if (res.data.success) {
        setActiveShift(res.data.data);
        toast.success(`Shift berhasil dibuka dengan modal ${formatRupiah(openingCash)}`);
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Gagal membuka shift';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buka Shift Kasir" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed flex items-start gap-3">
          <Banknote className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-0.5">Operasional Shift Kasir</p>
            <p>Masukkan nominal uang modal awal (uang kas) di laci kasir sebelum memulai transaksi penjualan.</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Modal Awal Kasir (IDR)
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
              value={openingCash || ''}
              onChange={(e) => setOpeningCash(Number(e.target.value))}
              placeholder="0"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-lg text-slate-800"
            />
          </div>

          <div className="flex flex-wrap gap-2 mt-2.5">
            {QUICK_OPENING_AMOUNTS.map((amt) => (
              <button
                type="button"
                key={amt}
                onClick={() => setOpeningCash(amt)}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${
                  openingCash === amt
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {formatRupiah(amt)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Catatan (Opsional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Shift 1 Pagi"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
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
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition shadow-sm disabled:opacity-50"
          >
            {loading ? 'Membuka Shift...' : 'Konfirmasi Buka Shift'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
