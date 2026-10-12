import React, { useState, useEffect } from 'react';
import { purchasesApi, suppliersApi, productsApi } from '../lib/api/endpoints';
import { formatRupiah, formatDateTime } from '../lib/formatters';
import { Badge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { Modal } from '../components/common/Modal';
import { toast } from '../store/toastStore';
import type { Purchase, Supplier, Product, PaginationMeta, CreatePurchaseRequest } from '../types';
import {
  Plus,
  RotateCw,
  XCircle,
  Eye,
  Trash2,
  PackageCheck,
} from 'lucide-react';

interface PurchaseItemInput {
  product_id: number;
  quantity: number;
  cost_price: number;
}

export const PurchasesPage: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Detail Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  // Create Purchase Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState<number | undefined>();
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItemInput[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchAux = async () => {
    try {
      const [sRes, pRes] = await Promise.all([
        suppliersApi.list({ per_page: 100 }),
        productsApi.list({ per_page: 100 }),
      ]);
      if (sRes.data.success) setSuppliers(sRes.data.data);
      if (pRes.data.success) setProducts(pRes.data.data);
    } catch {
      // ignore
    }
  };

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await purchasesApi.list({
        page,
        per_page: 15,
        status: statusFilter || undefined,
      });
      if (res.data.success) {
        setPurchases(res.data.data);
        setMeta(res.data.meta);
      }
    } catch {
      toast.error('Gagal mengambil data pembelian barang');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAux();
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [page, statusFilter]);

  const handleOpenCreate = () => {
    setSupplierId(suppliers[0]?.id);
    setInvoiceNumber(`PO-${Date.now().toString().slice(-6)}`);
    setNotes('');
    if (products.length > 0) {
      setPurchaseItems([
        {
          product_id: products[0].id,
          quantity: 10,
          cost_price: products[0].buy_price,
        },
      ]);
    } else {
      setPurchaseItems([]);
    }
    setCreateModalOpen(true);
  };

  const handleAddItemRow = () => {
    if (products.length === 0) return;
    setPurchaseItems([
      ...purchaseItems,
      {
        product_id: products[0].id,
        quantity: 10,
        cost_price: products[0].buy_price,
      },
    ]);
  };

  const handleRemoveItemRow = (idx: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== idx));
  };

  const handleItemChange = (
    idx: number,
    field: keyof PurchaseItemInput,
    value: number
  ) => {
    const updated = [...purchaseItems];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === 'product_id') {
      const prod = products.find((p) => p.id === value);
      if (prod) {
        updated[idx].cost_price = prod.buy_price;
      }
    }
    setPurchaseItems(updated);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || !invoiceNumber.trim() || purchaseItems.length === 0) {
      toast.error('Mohon lengkapi data supplier, nomor PO, dan item');
      return;
    }

    try {
      setSubmitting(true);
      const payload: CreatePurchaseRequest = {
        supplier_id: supplierId,
        invoice_number: invoiceNumber.trim(),
        items: purchaseItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          buy_price: item.cost_price,
        })),
        notes: notes || undefined,
      };
      const res = await purchasesApi.create(payload);
      if (res.data.success) {
        toast.success(`Pembelian ${invoiceNumber} berhasil dibuat (Status DRAFT)`);
        setCreateModalOpen(false);
        fetchPurchases();
      }
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Gagal membuat pembelian';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceivePurchase = async (p: Purchase) => {
    const num = p.purchase_number || p.invoice_number || `#${p.id}`;
    if (!window.confirm(`Konfirmasi penerimaan barang untuk PO ${num}? Stok produk akan otomatis bertambah.`)) {
      return;
    }

    try {
      const res = await purchasesApi.receive(p.id);
      if (res.data.success) {
        toast.success(`Barang PO ${num} berhasil diterima. Stok telah bertambah!`);
        fetchPurchases();
      }
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Gagal memproses penerimaan barang';
      toast.error(errMsg);
    }
  };

  const handleCancelPurchase = async (p: Purchase) => {
    const num = p.purchase_number || p.invoice_number || `#${p.id}`;
    if (!window.confirm(`Batalkan PO ${num}?`)) {
      return;
    }

    try {
      const res = await purchasesApi.cancel(p.id);
      if (res.data.success) {
        toast.success(`PO ${num} dibatalkan`);
        fetchPurchases();
      }
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Gagal membatalkan pembelian';
      toast.error(errMsg);
    }
  };

  const totalCalculated = purchaseItems.reduce(
    (sum, i) => sum + i.quantity * i.cost_price,
    0
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Pembelian Barang (Purchasing / PO)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan faktur pembelian dari supplier dan penerimaan barang untuk penambahan stok otomatis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPurchases}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Buat PO Baru</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-700">Filter Status:</span>
        <div className="flex items-center gap-1 text-xs">
          {['', 'DRAFT', 'RECEIVED', 'CANCELLED'].map((st) => (
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

      {/* Purchases Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">No. PO / Faktur</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Tanggal Buat</th>
                <th className="py-3 px-4 text-right">Total Biaya</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi Operasional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Memuat data pembelian...
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Belum ada data pembelian barang.
                  </td>
                </tr>
              ) : (
                purchases.map((p) => {
                  const supp = suppliers.find((s) => s.id === p.supplier_id);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {p.purchase_number || p.invoice_number || `#${p.id}`}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {supp?.name ?? p.supplier?.name ?? `Supplier #${p.supplier_id}`}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{formatDateTime(p.created_at)}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatRupiah(p.total_amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant={
                            p.status === 'RECEIVED'
                              ? 'success'
                              : p.status === 'CANCELLED'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {p.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedPurchase(p);
                              setDetailModalOpen(true);
                            }}
                            title="Lihat Detail Item"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {p.status === 'DRAFT' && (
                            <>
                              <button
                                onClick={() => handleReceivePurchase(p)}
                                title="Terima Barang & Tambah Stok"
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition"
                              >
                                <PackageCheck className="w-3.5 h-3.5" />
                                Terima Barang
                              </button>
                              <button
                                onClick={() => handleCancelPurchase(p)}
                                title="Batalkan PO"
                                className="p-1.5 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 transition"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
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

      {/* Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Detail Pembelian ${selectedPurchase?.purchase_number || selectedPurchase?.invoice_number || ''}`}
        maxWidth="lg"
      >
        {selectedPurchase && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Supplier:</span>
                <span className="font-bold">
                  {suppliers.find((s) => s.id === selectedPurchase.supplier_id)?.name ??
                    selectedPurchase.supplier?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <Badge
                  variant={
                    selectedPurchase.status === 'RECEIVED'
                      ? 'success'
                      : selectedPurchase.status === 'CANCELLED'
                      ? 'danger'
                      : 'warning'
                  }
                >
                  {selectedPurchase.status}
                </Badge>
              </div>
              {selectedPurchase.notes && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Catatan:</span>
                  <span>{selectedPurchase.notes}</span>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2">Produk</th>
                    <th className="py-2 text-center">Jumlah</th>
                    <th className="py-2 text-right">Harga Beli Satuan</th>
                    <th className="py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedPurchase.items?.map((item, i) => {
                    const pr = products.find((p) => p.id === item.product_id);
                    return (
                      <tr key={i}>
                        <td className="py-2.5 font-semibold text-slate-800">
                          {pr?.name ?? item.product?.name ?? `Produk #${item.product_id}`}
                        </td>
                        <td className="py-2.5 text-center font-bold">{item.quantity}</td>
                        <td className="py-2.5 text-right">
                          {formatRupiah(item.buy_price ?? item.cost_price ?? 0)}
                        </td>
                        <td className="py-2.5 text-right font-bold text-slate-900">
                          {formatRupiah(item.subtotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm">
              <span className="font-bold text-slate-700">Total Nilai Pembelian:</span>
              <span className="font-extrabold text-base text-indigo-950">
                {formatRupiah(selectedPurchase.total_amount)}
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Purchase Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Buat Pembelian Barang (PO)"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Pilih Supplier *
              </label>
              <select
                required
                value={supplierId ?? ''}
                onChange={(e) => setSupplierId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nomor Faktur / PO *
              </label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Daftar Barang Masuk
              </label>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Baris Produk
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto p-1">
              {purchaseItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
                >
                  <select
                    value={item.product_id}
                    onChange={(e) => handleItemChange(idx, 'product_id', Number(e.target.value))}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatRupiah(p.buy_price)})
                      </option>
                    ))}
                  </select>

                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                      placeholder="Qty"
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs text-center font-bold bg-white"
                    />
                  </div>

                  <div className="w-28">
                    <input
                      type="number"
                      min="0"
                      step="500"
                      required
                      value={item.cost_price}
                      onChange={(e) => handleItemChange(idx, 'cost_price', Number(e.target.value))}
                      placeholder="Harga"
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs text-right font-bold bg-white"
                    />
                  </div>

                  <div className="w-24 text-right font-bold text-xs text-slate-800">
                    {formatRupiah(item.quantity * item.cost_price)}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItemRow(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center p-3 rounded-xl bg-indigo-50 border border-indigo-100">
            <span className="text-xs font-bold text-indigo-900">Total Nilai PO:</span>
            <span className="text-base font-extrabold text-indigo-950">
              {formatRupiah(totalCalculated)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Catatan Pembelian (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Pengiriman batch awal bulan..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || purchaseItems.length === 0}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Draft PO'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
