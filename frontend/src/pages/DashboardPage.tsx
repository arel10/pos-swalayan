import React, { useEffect, useState } from 'react';
import { dashboardApi, salesApi } from '../lib/api/endpoints';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { formatRupiah, formatNumber, formatDateTime } from '../lib/formatters';
import type { DashboardData, Sale } from '../types';
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  Receipt,
  RotateCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashRes, salesRes] = await Promise.all([
        dashboardApi.get(),
        salesApi.list({ per_page: 5 }),
      ]);
      if (dashRes.data.success) {
        setData(dashRes.data.data);
      }
      if (salesRes.data.success) {
        setRecentSales(salesRes.data.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Dashboard Operasional & Ringkasan Swalayan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Metrik penjualan real-time, kondisi stok retail, dan ringkasan transaksi hari ini.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan Data</span>
          </button>
          <button
            onClick={() => navigate('/pos')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Buka Kasir POS</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Penjualan Hari Ini"
          value={formatRupiah(data?.today_sales ?? 0)}
          subtitle="Pendapatan kotor hari ini"
          icon={DollarSign}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Transaksi Selesai"
          value={data?.today_transactions ?? 0}
          subtitle="Struk berhasil dicetak"
          icon={Receipt}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Total Barang Terjual"
          value={`${formatNumber(data?.today_items_sold ?? 0)} pcs`}
          subtitle="Unit produk keluar"
          icon={Package}
          iconBgColor="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <StatCard
          title="Estimasi Profit Kotor"
          value={formatRupiah(data?.gross_profit ?? 0)}
          subtitle="Margin penjualan hari ini"
          icon={TrendingUp}
          iconBgColor="bg-violet-50"
          iconColor="text-violet-600"
        />
      </div>

      {/* Low Stock Alert and Top Products Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <Flame className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-800">Produk Terlaris Hari Ini</h3>
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-0.5"
            >
              Laporan Lengkap <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 mt-3 divide-y divide-slate-100">
            {!data?.top_products || data.top_products.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Belum ada transaksi penjualan tercatat hari ini.
              </div>
            ) : (
              data.top_products.map((item, idx) => (
                <div key={item.product_id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-5 font-bold text-xs text-slate-400">{idx + 1}</span>
                    <span className="font-semibold text-xs text-slate-800">
                      {item.product_name}
                    </span>
                  </div>
                  <span className="font-bold text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800">
                    {item.qty_sold} terjual
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Warning Products */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-800">Peringatan Stok Kritis (Menipis)</h3>
            </div>
            <button
              onClick={() => navigate('/inventory')}
              className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-0.5"
            >
              Inventori & Restock <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 mt-3 divide-y divide-slate-100">
            {!data?.low_stock_products || data.low_stock_products.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Seluruh produk berada pada batas stok aman.
              </div>
            ) : (
              data.low_stock_products.map((item) => (
                <div key={item.product_id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-xs text-slate-800 block">
                      {item.product_name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Batas Min: {item.min_stock} unit
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block font-extrabold text-xs px-2.5 py-0.5 rounded-full ${
                        item.stock <= 0
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Sisa: {item.stock}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <h3 className="font-bold text-sm text-slate-800">5 Transaksi Terakhir</h3>
          <button
            onClick={() => navigate('/sales')}
            className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-0.5"
          >
            Lihat Semua Transaksi <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-2.5">No. Faktur</th>
                <th className="pb-2.5">Waktu</th>
                <th className="pb-2.5">Kasir</th>
                <th className="pb-2.5 text-right">Total Akhir</th>
                <th className="pb-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentSales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    Belum ada riwayat transaksi.
                  </td>
                </tr>
              ) : (
                recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 font-mono font-semibold text-slate-900">
                      {sale.sale_number || sale.invoice_number}
                    </td>
                    <td className="py-3 text-slate-500">{formatDateTime(sale.created_at)}</td>
                    <td className="py-3 font-medium">
                      {sale.cashier?.name ?? `Kasir #${sale.cashier_id}`}
                    </td>
                    <td className="py-3 text-right font-bold text-slate-900">
                      {formatRupiah(sale.final_amount)}
                    </td>
                    <td className="py-3 text-center">
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
