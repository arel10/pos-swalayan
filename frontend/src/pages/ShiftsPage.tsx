import React, { useState, useEffect } from 'react';
import { shiftsApi } from '../lib/api/endpoints';
import { formatRupiah, formatDateTime } from '../lib/formatters';
import { Badge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { OpenShiftModal } from '../components/pos/OpenShiftModal';
import { CloseShiftModal } from '../components/pos/CloseShiftModal';
import { useShiftStore } from '../store/shiftStore';
import { toast } from '../store/toastStore';
import type { CashierShift, PaginationMeta } from '../types';
import { Clock, Plus, RotateCw } from 'lucide-react';

export const ShiftsPage: React.FC = () => {
  const { activeShift, fetchActiveShift } = useShiftStore();

  const [shifts, setShifts] = useState<CashierShift[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [openModalOpen, setOpenModalOpen] = useState(false);
  const [closeTargetShift, setCloseTargetShift] = useState<CashierShift | null>(null);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const res = await shiftsApi.list({
        page,
        per_page: 15,
        status: statusFilter || undefined,
      });
      if (res.data.success) {
        setShifts(res.data.data);
        setMeta(res.data.meta);
      }
    } catch {
      toast.error('Gagal mengambil daftar shift kasir');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
    fetchActiveShift();
  }, [page, statusFilter]);

  const handleOpenCloseModal = (s: CashierShift) => {
    setCloseTargetShift(s);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Shift Kasir & Rekonsiliasi Kas
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen pergantian shift, pencatatan modal awal, rekonsiliasi uang laci kasir, dan audit selisih kas (variance).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchShifts();
              fetchActiveShift();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {!activeShift && (
            <button
              onClick={() => setOpenModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Buka Shift Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Shift Banner if any */}
      {activeShift && (
        <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                  Shift Sedang Buka
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-mono">
                  ID #{activeShift.id}
                </span>
              </div>
              <p className="text-sm font-semibold text-white mt-0.5">
                Modal Awal: {formatRupiah(activeShift.opening_cash)} • Total Penjualan Saat Ini:{' '}
                {formatRupiah(activeShift.total_sales || 0)}
              </p>
              <p className="text-[11px] text-emerald-200/70">
                Dibuka pada: {formatDateTime(activeShift.opened_at)}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleOpenCloseModal(activeShift)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm self-start sm:self-auto"
          >
            Tutup Shift & Rekonsiliasi
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-700">Filter Status:</span>
        <div className="flex items-center gap-1 text-xs">
          {['', 'OPEN', 'CLOSED'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st === '' ? 'Semua' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Shifts Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Kasir ID</th>
                <th className="py-3 px-4">Waktu Buka</th>
                <th className="py-3 px-4">Waktu Tutup</th>
                <th className="py-3 px-4 text-right">Modal Awal</th>
                <th className="py-3 px-4 text-right">Total Penjualan</th>
                <th className="py-3 px-4 text-right">Ekspektasi Kas</th>
                <th className="py-3 px-4 text-right">Kas Aktual</th>
                <th className="py-3 px-4 text-center">Selisih (Variance)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    Memuat riwayat shift...
                  </td>
                </tr>
              ) : shifts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    Belum ada riwayat shift.
                  </td>
                </tr>
              ) : (
                shifts.map((s) => {
                  const hasVariance = s.status === 'CLOSED';
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">#{s.id}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-semibold">Kasir #{s.cashier_id}</td>
                      <td className="py-3.5 px-4 text-slate-500">{formatDateTime(s.opened_at)}</td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {s.closed_at ? formatDateTime(s.closed_at) : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600">
                        {formatRupiah(s.opening_cash)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatRupiah(s.total_sales || 0)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600">
                        {s.status === 'CLOSED' ? formatRupiah(s.expected_cash) : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                        {s.status === 'CLOSED' ? formatRupiah(s.actual_cash) : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold">
                        {hasVariance ? (
                          s.cash_variance === 0 ? (
                            <span className="text-emerald-600">Pas (Rp 0)</span>
                          ) : s.cash_variance > 0 ? (
                            <span className="text-blue-600">+{formatRupiah(s.cash_variance)}</span>
                          ) : (
                            <span className="text-rose-600">{formatRupiah(s.cash_variance)}</span>
                          )
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={s.status === 'OPEN' ? 'warning' : 'success'}>
                          {s.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {s.status === 'OPEN' && (
                          <button
                            onClick={() => handleOpenCloseModal(s)}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] transition"
                          >
                            Tutup
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination meta={meta} onPageChange={(p) => setPage(p)} />
      </div>

      {/* Modals */}
      <OpenShiftModal
        isOpen={openModalOpen}
        onClose={() => setOpenModalOpen(false)}
        onSuccess={() => {
          fetchShifts();
          fetchActiveShift();
        }}
      />

      <CloseShiftModal
        isOpen={!!closeTargetShift}
        onClose={() => setCloseTargetShift(null)}
        shift={closeTargetShift}
        onSuccess={() => {
          fetchShifts();
          fetchActiveShift();
        }}
      />
    </div>
  );
};
