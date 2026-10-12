import React, { useState, useEffect } from 'react';
import { auditApi } from '../lib/api/endpoints';
import { formatDateTime } from '../lib/formatters';
import { Badge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { toast } from '../store/toastStore';
import type { AuditLog, PaginationMeta } from '../types';
import { RotateCw } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [page, setPage] = useState(1);
  const [moduleFilter, setModuleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await auditApi.list({
        page,
        per_page: 20,
        module: moduleFilter || undefined,
      });
      if (res.data.success) {
        setLogs(res.data.data);
        setMeta(res.data.meta);
      }
    } catch {
      toast.error('Gagal mengambil audit log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, moduleFilter]);

  const modules = ['', 'AUTH', 'SALES', 'INVENTORY', 'PRODUCTS', 'PURCHASES', 'USERS', 'SHIFTS'];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Audit Trail & Log Aktivitas Sistem
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Rekam jejak setiap aksi krusial pengguna untuk kepatuhan operasional dan keamanan data.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Module Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider mr-2">
          Modul:
        </span>
        {modules.map((m) => (
          <button
            key={m}
            onClick={() => {
              setModuleFilter(m);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              moduleFilter === m
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {m === '' ? 'Semua Modul' : m}
          </button>
        ))}
      </div>

      {/* Audit Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-5">Waktu</th>
                <th className="py-3 px-5">Pengguna</th>
                <th className="py-3 px-5 text-center">Modul</th>
                <th className="py-3 px-5 text-center">Aksi (Action)</th>
                <th className="py-3 px-5">Deskripsi / Detail Aktivitas</th>
                <th className="py-3 px-5 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Memuat log aktivitas...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Belum ada audit log tercatat untuk filter ini.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-5 text-slate-500 font-mono text-[11px]">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-slate-900">
                      {log.user?.name ?? `User #${log.user_id}`}
                    </td>
                    <td className="py-3.5 px-5 text-center font-bold text-[10px] text-slate-600 font-mono">
                      <span className="bg-slate-100 px-2 py-0.5 rounded">{log.module}</span>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <Badge variant="neutral" size="sm">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-5 text-slate-700 max-w-md">
                      {log.description}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-slate-400 text-[11px]">
                      {log.ip_address || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination meta={meta} onPageChange={(p) => setPage(p)} />
      </div>
    </div>
  );
};
