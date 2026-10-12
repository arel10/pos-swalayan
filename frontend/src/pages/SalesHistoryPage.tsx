import React, { useState, useEffect } from 'react';
import { salesApi } from '../lib/api/endpoints';
import { formatRupiah, formatDateTime } from '../lib/formatters';
import { Badge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { ReceiptModal } from '../components/common/ReceiptModal';
import { Modal } from '../components/common/Modal';
import { toast } from '../store/toastStore';
import type { Sale, PaginationMeta } from '../types';
import {
  Filter,
  Ban,
  RotateCw,
  Printer,
  AlertTriangle,
} from 'lucide-react';

export const SalesHistoryPage: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [page, setPage] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Detail / Receipt preview
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // Void modal
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [voidTargetSale, setVoidTargetSale] = useState<Sale | null>(null);
  const [voidReason, setVoidReason] = useState<string>('');
  const [voidLoading, setVoidLoading] = useState(false);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await salesApi.list({
        page,
        per_page: 15,
        status: statusFilter || undefined,
      });
      if (res.data.success) {
        setSales(res.data.data);
        setMeta(res.data.meta);
      }
    } catch {
      toast.error('Gagal mengambil riwayat transaksi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [page, statusFilter]);

  const handleOpenReceipt = async (id: number) => {
    try {
      const res = await salesApi.get(id);
      if (res.data.success) {
        setSelectedSale(res.data.data);
        setReceiptModalOpen(true);
      }
    } catch {
      toast.error('Gagal memuat detail transaksi');
    }
  };

  const handleOpenVoidModal = (sale: Sale) => {
    setVoidTargetSale(sale);
    setVoidReason('');
    setVoidModalOpen(true);
  };

  const handleConfirmVoid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidTargetSale) return;
    if (!voidReason.trim()) {
      toast.error('Alasan void transaksi wajib diisi');
      return;
    }

    try {
      setVoidLoading(true);
      const res = await salesApi.void(voidTargetSale.id, { reason: voidReason.trim() });
      if (res.data.success) {
        const invNum = voidTargetSale.sale_number || voidTargetSale.invoice_number || `#${voidTargetSale.id}`;
        toast.success(`Transaksi ${invNum} berhasil di-void!`);
        setVoidModalOpen(false);
        fetchSales();
      }
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Gagal membatalkan transaksi';
      toast.error(errMsg);
    } finally {
      setVoidLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Riwayat Transaksi Penjualan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar lengkap transaksi, cetak ulang struk kasir, dan pembatalan transaksi (void).
          </p>
        </div>

        <button
          onClick={fetchSales}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition self-start sm:self-auto"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700">Filter Status:</span>
          <div className="flex items-center gap-1 text-xs">
            {['', 'COMPLETED', 'VOID'].map((st) => (
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
      </div>

      {/* Transactions Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">No. Transaksi</th>
                <th className="py-3 px-4">Tanggal & Waktu</th>
                <th className="py-3 px-4">Kasir</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Diskon</th>
                <th className="py-3 px-4 text-right">Total Akhir</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Memuat data transaksi...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada transaksi ditemukan.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => {
                  const discountVal = sale.discount_amount || sale.discount || 0;
                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {sale.sale_number || sale.invoice_number || `#${sale.id}`}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{formatDateTime(sale.created_at)}</td>
                      <td className="py-3.5 px-4 font-medium">
                        {sale.cashier?.name ?? `Kasir #${sale.cashier_id}`}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600">
                        {formatRupiah(sale.total_amount)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-rose-600">
                        {discountVal > 0 ? `-${formatRupiah(discountVal)}` : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                        {formatRupiah(sale.final_amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant={
                            sale.status === 'COMPLETED'
                              ? 'success'
                              : sale.status === 'VOID'
                              ? 'danger'
                              : 'neutral'
                          }
                        >
                          {sale.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenReceipt(sale.id)}
                            title="Lihat & Cetak Struk"
                            className="p-1.5 rounded-lg border border-slate-200 text-indigo-600 hover:bg-indigo-50 transition"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {sale.status === 'COMPLETED' && (
                            <button
                              onClick={() => handleOpenVoidModal(sale)}
                              title="Batalkan Transaksi (Void)"
                              className="p-1.5 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 transition"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
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

      {/* Receipt Preview Modal */}
      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        sale={selectedSale}
      />

      {/* Void Confirmation Modal */}
      <Modal
        isOpen={voidModalOpen}
        onClose={() => setVoidModalOpen(false)}
        title="Konfirmasi Void (Pembatalan Transaksi)"
        maxWidth="md"
      >
        <form onSubmit={handleConfirmVoid} className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-0.5">Peringatan Pembatalan Transaksi</p>
              <p>
                Pembatalan transaksi{' '}
                <strong className="underline">
                  {voidTargetSale?.sale_number || voidTargetSale?.invoice_number || ''}
                </strong>{' '}
                akan mengembalikan kuantitas stok barang ke gudang/rak secara otomatis.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Alasan Pembatalan (Wajib diisi)
            </label>
            <textarea
              rows={3}
              required
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="Contoh: Salah input pesanan kasir / pelanggan membatalkan pembelian..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setVoidModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={voidLoading}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-sm disabled:opacity-50"
            >
              {voidLoading ? 'Membatalkan...' : 'Konfirmasi Batalkan Transaksi'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
