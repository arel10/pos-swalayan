import React, { useState, useEffect } from 'react';
import { reportsApi } from '../lib/api/endpoints';
import { formatRupiah, formatNumber, todayISO, daysAgoISO } from '../lib/formatters';
import { toast } from '../store/toastStore';
import type { SalesReportRow, TopProductRow, ProfitReportRow } from '../types';
import {
  BarChart3,
  TrendingUp,
  Package,
  Calendar,
  RotateCw,
  Printer,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sales' | 'top_products' | 'profit'>('sales');
  const [startDate, setStartDate] = useState<string>(daysAgoISO(30));
  const [endDate, setEndDate] = useState<string>(todayISO());

  const [salesData, setSalesData] = useState<SalesReportRow[]>([]);
  const [topProductsData, setTopProductsData] = useState<TopProductRow[]>([]);
  const [profitData, setProfitData] = useState<ProfitReportRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = { start_date: startDate, end_date: endDate };
      const [salesRes, topRes, profitRes] = await Promise.all([
        reportsApi.sales(params),
        reportsApi.topProducts(params),
        reportsApi.profit(params),
      ]);

      if (salesRes.data.success) setSalesData(salesRes.data.data);
      if (topRes.data.success) setTopProductsData(topRes.data.data);
      if (profitRes.data.success) setProfitData(profitRes.data.data);
    } catch {
      toast.error('Gagal mengambil laporan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const handleQuickPeriod = (days: number) => {
    setStartDate(daysAgoISO(days));
    setEndDate(todayISO());
  };

  const totalSales = salesData.reduce((acc, row) => acc + row.total_sales, 0);
  const totalTransactions = salesData.reduce((acc, row) => acc + row.transactions, 0);
  const totalGrossProfit = profitData.reduce((acc, row) => acc + row.gross_profit, 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Laporan Analitik Bisnis & Penjualan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis penjualan harian, tren produk terlaris, serta kalkulasi margin laba kotor (Gross Profit).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Laporan</span>
          </button>
          <button
            onClick={fetchReports}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-slate-400" />
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600">Dari:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/50 font-medium"
            />
            <span className="font-semibold text-slate-600">Sampai:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/50 font-medium"
            />
          </div>
        </div>

        {/* Quick Period Buttons */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => handleQuickPeriod(0)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 font-medium text-slate-600"
          >
            Hari Ini
          </button>
          <button
            onClick={() => handleQuickPeriod(7)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 font-medium text-slate-600"
          >
            7 Hari
          </button>
          <button
            onClick={() => handleQuickPeriod(30)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 font-medium text-slate-600"
          >
            30 Hari
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Omzet Penjualan Periode Ini
          </span>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">{formatRupiah(totalSales)}</h3>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Transaksi Selesai
          </span>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">
            {formatNumber(totalTransactions)} struk
          </h3>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Gross Profit (Laba Kotor)
          </span>
          <h3 className="text-xl font-extrabold text-emerald-600 mt-1">
            {formatRupiah(totalGrossProfit)}
          </h3>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('sales')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'sales'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Laporan Penjualan
        </button>
        <button
          onClick={() => setActiveTab('top_products')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'top_products'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          Produk Terlaris
        </button>
        <button
          onClick={() => setActiveTab('profit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'profit'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Laba Kotor (Gross Profit)
        </button>
      </div>

      {/* Tab 1: Sales Report */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          {/* Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="font-bold text-sm text-slate-800 mb-4">Grafik Tren Penjualan Harian</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[...salesData].reverse()}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(value: unknown) => [formatRupiah(Number(value) || 0), 'Total Penjualan']}
                  />
                  <Area
                    type="monotone"
                    dataKey="total_sales"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#salesGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-5">Tanggal</th>
                  <th className="py-3 px-5 text-center">Jumlah Transaksi</th>
                  <th className="py-3 px-5 text-center">Barang Terjual</th>
                  <th className="py-3 px-5 text-right">Total Penjualan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {salesData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      Tidak ada data penjualan pada rentang tanggal ini.
                    </td>
                  </tr>
                ) : (
                  salesData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-5 font-medium text-slate-900">{row.date}</td>
                      <td className="py-3.5 px-5 text-center">{row.transactions} struk</td>
                      <td className="py-3.5 px-5 text-center">{formatNumber(row.items_sold)} pcs</td>
                      <td className="py-3.5 px-5 text-right font-extrabold text-slate-900">
                        {formatRupiah(row.total_sales)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Top Products */}
      {activeTab === 'top_products' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="font-bold text-sm text-slate-800 mb-4">Grafik 10 Produk Terlaris</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsData.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="product_name" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip />
                  <Bar dataKey="qty_sold" fill="#6366f1" radius={[6, 6, 0, 0]} name="Qty Terjual" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-5 w-16">Peringkat</th>
                  <th className="py-3 px-5">Nama Produk</th>
                  <th className="py-3 px-5 text-center">Kuantitas Terjual</th>
                  <th className="py-3 px-5 text-right">Total Pendapatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {topProductsData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      Tidak ada data produk terjual pada rentang tanggal ini.
                    </td>
                  </tr>
                ) : (
                  topProductsData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-5 font-bold text-slate-400">#{i + 1}</td>
                      <td className="py-3.5 px-5 font-semibold text-slate-900">{row.product_name}</td>
                      <td className="py-3.5 px-5 text-center font-bold text-indigo-700">
                        {formatNumber(row.qty_sold)} pcs
                      </td>
                      <td className="py-3.5 px-5 text-right font-extrabold text-slate-900">
                        {formatRupiah(row.revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Profit Report */}
      {activeTab === 'profit' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-5">Tanggal</th>
                <th className="py-3 px-5 text-right">Pendapatan Kotor (Revenue)</th>
                <th className="py-3 px-5 text-right">Harga Pokok Penjualan (HPP / COGS)</th>
                <th className="py-3 px-5 text-right">Laba Kotor (Gross Profit)</th>
                <th className="py-3 px-5 text-center">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {profitData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Tidak ada data profit pada rentang tanggal ini.
                  </td>
                </tr>
              ) : (
                profitData.map((row, i) => {
                  const marginPct = row.revenue > 0 ? (row.gross_profit / row.revenue) * 100 : 0;
                  return (
                    <tr key={i} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-5 font-medium text-slate-900">{row.date}</td>
                      <td className="py-3.5 px-5 text-right font-semibold text-slate-900">
                        {formatRupiah(row.revenue)}
                      </td>
                      <td className="py-3.5 px-5 text-right text-slate-500">
                        {formatRupiah(row.cogs)}
                      </td>
                      <td className="py-3.5 px-5 text-right font-extrabold text-emerald-600">
                        {formatRupiah(row.gross_profit)}
                      </td>
                      <td className="py-3.5 px-5 text-center font-bold text-emerald-700">
                        {marginPct.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
