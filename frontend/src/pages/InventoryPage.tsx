import React, { useState, useEffect } from 'react';
import { inventoryApi, productsApi } from '../lib/api/endpoints';
import { formatDateTime } from '../lib/formatters';
import { Badge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { Modal } from '../components/common/Modal';
import { toast } from '../store/toastStore';
import { useAuthStore } from '../store/authStore';
import type { StockMovement, Product, PaginationMeta } from '../types';
import {
  PlusCircle,
  MinusCircle,
  SlidersHorizontal,
  RotateCw,
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const { isAdmin } = useAuthStore();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [products, setProducts] = useState<Product[]>([]);

  const [page, setPage] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);

  // Adjustment Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [targetProductId, setTargetProductId] = useState<number | undefined>();
  const [adjustType, setAdjustType] = useState<'ADD' | 'SUBTRACT'>('ADD');
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAuxProducts = async () => {
    try {
      const res = await productsApi.list({ per_page: 150 });
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch {
      // ignore
    }
  };

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const res = await inventoryApi.movements({
        page,
        per_page: 15,
        product_id: selectedProductId || undefined,
      });
      if (res.data.success) {
        setMovements(res.data.data);
        setMeta(res.data.meta);
      }
    } catch {
      toast.error('Gagal mengambil data pergerakan stok');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuxProducts();
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [page, selectedProductId]);

  const handleOpenAdjustment = () => {
    setTargetProductId(products[0]?.id);
    setAdjustType('ADD');
    setAdjustQty(1);
    setNotes('');
    setModalOpen(true);
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProductId) {
      toast.error('Pilih produk terlebih dahulu');
      return;
    }
    if (adjustQty <= 0) {
      toast.error('Kuantitas adjustment harus lebih dari 0');
      return;
    }
    if (notes.trim().length < 5) {
      toast.error('Alasan adjustment wajib diisi minimal 5 karakter');
      return;
    }

    const calculatedQty = adjustType === 'ADD' ? adjustQty : -adjustQty;

    try {
      setSubmitting(true);
      const res = await inventoryApi.adjust({
        product_id: targetProductId,
        quantity: calculatedQty,
        notes: notes.trim(),
      });
      if (res.data.success) {
        toast.success('Penyesuaian stok berhasil disimpan');
        setModalOpen(false);
        fetchMovements();
        fetchAuxProducts();
      }
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Gagal melakukan penyesuaian stok';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const targetProductObj = products.find((p) => p.id === targetProductId);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Inventori & Kartu Stok Barang
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log jejak pergerakan stok (Stock Movement) dari penjualan, penerimaan barang, dan penyesuaian manual.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchMovements}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {isAdmin() && (
            <button
              onClick={handleOpenAdjustment}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Penyesuaian Stok (Adjustment)</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider shrink-0">
          Filter Produk:
        </label>
        <select
          value={selectedProductId ?? ''}
          onChange={(e) => {
            setSelectedProductId(e.target.value ? Number(e.target.value) : undefined);
            setPage(1);
          }}
          className="flex-1 max-w-md px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Semua Produk (Semua Pergerakan)</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (Stok Saat Ini: {p.stock})
            </option>
          ))}
        </select>
      </div>

      {/* Movements Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Tanggal & Jam</th>
                <th className="py-3 px-4">Produk</th>
                <th className="py-3 px-4 text-center">Tipe Referensi</th>
                <th className="py-3 px-4 text-center">Arah</th>
                <th className="py-3 px-4 text-center">Stok Awal</th>
                <th className="py-3 px-4 text-center">Perubahan</th>
                <th className="py-3 px-4 text-center">Stok Akhir</th>
                <th className="py-3 px-4">Keterangan / Alasan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Memuat riwayat stok...
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Belum ada catatan mutasi stok untuk filter ini.
                  </td>
                </tr>
              ) : (
                movements.map((m) => {
                  const isPositive = m.quantity > 0;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 text-slate-500">{formatDateTime(m.created_at)}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {m.product?.name ?? (products.find((p) => p.id === m.product_id)?.name ?? `Produk #${m.product_id}`)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-[11px]">
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-700">
                          {m.reference_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={m.type === 'IN' ? 'success' : 'danger'} size="sm">
                          {m.type}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                        {m.stock_before}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        <span className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                          {isPositive ? `+${m.quantity}` : m.quantity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-extrabold text-slate-900">
                        {m.stock_after}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        {m.notes || '-'}
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

      {/* Adjustment Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Penyesuaian Stok Barang (Stock Adjustment)"
        maxWidth="md"
      >
        <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Pilih Produk *
            </label>
            <select
              required
              value={targetProductId ?? ''}
              onChange={(e) => setTargetProductId(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stok Saat Ini: {p.stock})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Jenis Penyesuaian *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustType('ADD')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition ${
                  adjustType === 'ADD'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                Tambah Stok (+)
              </button>
              <button
                type="button"
                onClick={() => setAdjustType('SUBTRACT')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition ${
                  adjustType === 'SUBTRACT'
                    ? 'border-rose-600 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <MinusCircle className="w-4 h-4 text-rose-600" />
                Kurangi / Rusak (-)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Jumlah Unit *
            </label>
            <input
              type="number"
              min="1"
              required
              value={adjustQty}
              onChange={(e) => setAdjustQty(Math.max(1, Number(e.target.value) || 1))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Live Preview */}
          {targetProductObj && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between">
              <span className="text-slate-500">Estimasi Stok Akhir:</span>
              <span className="font-extrabold text-slate-900">
                {targetProductObj.stock}{' '}
                {adjustType === 'ADD' ? `+ ${adjustQty}` : `- ${adjustQty}`} ={' '}
                <strong className="text-indigo-600">
                  {adjustType === 'ADD'
                    ? targetProductObj.stock + adjustQty
                    : targetProductObj.stock - adjustQty}
                </strong>
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Alasan Penyesuaian (Wajib Diisi, min. 5 karakter) *
            </label>
            <textarea
              rows={2}
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Barang rusak saat display rak / hasil opname fisik..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Penyesuaian Stok'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
