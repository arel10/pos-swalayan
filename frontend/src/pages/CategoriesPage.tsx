import React, { useState, useEffect } from 'react';
import { categoriesApi, unitsApi } from '../lib/api/endpoints';
import { Modal } from '../components/common/Modal';
import { toast } from '../store/toastStore';
import type { Category, Unit } from '../types';
import { Layers, Plus, Edit2, RotateCw, Tag } from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'categories' | 'units'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');

  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitName, setUnitName] = useState('');
  const [unitAbbreviation, setUnitAbbreviation] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cRes, uRes] = await Promise.all([
        categoriesApi.list({ per_page: 100 }),
        unitsApi.list({ per_page: 100 }),
      ]);
      if (cRes.data.success) setCategories(cRes.data.data);
      if (uRes.data.success) setUnits(uRes.data.data);
    } catch {
      toast.error('Gagal memuat kategori atau satuan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatModalOpen(true);
  };

  const handleOpenEditCategory = (c: Category) => {
    setEditingCategory(c);
    setCatName(c.name);
    setCatModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    try {
      setSubmitting(true);
      if (editingCategory) {
        await categoriesApi.update(editingCategory.id, { name: catName.trim() });
        toast.success(`Kategori "${catName}" diperbarui`);
      } else {
        await categoriesApi.create({ name: catName.trim() });
        toast.success(`Kategori "${catName}" dibuat`);
      }
      setCatModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Gagal menyimpan kategori';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAddUnit = () => {
    setEditingUnit(null);
    setUnitName('');
    setUnitAbbreviation('');
    setUnitModalOpen(true);
  };

  const handleOpenEditUnit = (u: Unit) => {
    setEditingUnit(u);
    setUnitName(u.name);
    setUnitAbbreviation(u.abbreviation ?? u.name);
    setUnitModalOpen(true);
  };

  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitName.trim()) return;

    try {
      setSubmitting(true);
      const abbr = unitAbbreviation.trim() || unitName.trim();
      if (editingUnit) {
        await unitsApi.update(editingUnit.id, { name: unitName.trim(), abbreviation: abbr });
        toast.success(`Satuan "${unitName}" diperbarui`);
      } else {
        await unitsApi.create({ name: unitName.trim(), abbreviation: abbr });
        toast.success(`Satuan "${unitName}" dibuat`);
      }
      setUnitModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Gagal menyimpan satuan';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Kategori & Satuan Produk
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengelompokan barang supermarket dan satuan kemasan (Pcs, Box, Pack, Kg, dll).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {activeTab === 'categories' ? (
            <button
              onClick={handleOpenAddCategory}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kategori</span>
            </button>
          ) : (
            <button
              onClick={handleOpenAddUnit}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Satuan</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'categories'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          Kategori Produk ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('units')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'units'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Tag className="w-4 h-4" />
          Satuan Unit ({units.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'categories' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-5 w-16">ID</th>
                  <th className="py-3 px-5">Nama Kategori</th>
                  <th className="py-3 px-5 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400">
                      Belum ada data kategori.
                    </td>
                  </tr>
                ) : (
                  categories.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-5 font-mono text-slate-400">#{c.id}</td>
                      <td className="py-3.5 px-5 font-semibold text-slate-900">{c.name}</td>
                      <td className="py-3.5 px-5 text-center">
                        <button
                          onClick={() => handleOpenEditCategory(c)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-5 w-16">ID</th>
                  <th className="py-3 px-5">Nama Satuan</th>
                  <th className="py-3 px-5">Singkatan (Abbr)</th>
                  <th className="py-3 px-5 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {units.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      Belum ada data satuan.
                    </td>
                  </tr>
                ) : (
                  units.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-5 font-mono text-slate-400">#{u.id}</td>
                      <td className="py-3.5 px-5 font-semibold text-slate-900">{u.name}</td>
                      <td className="py-3.5 px-5 font-mono text-slate-600">{u.abbreviation || '-'}</td>
                      <td className="py-3.5 px-5 text-center">
                        <button
                          onClick={() => handleOpenEditUnit(u)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category Modal */}
      <Modal
        isOpen={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title={editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}
        maxWidth="sm"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nama Kategori *
            </label>
            <input
              type="text"
              required
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="Contoh: Makanan & Minuman"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCatModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Unit Modal */}
      <Modal
        isOpen={unitModalOpen}
        onClose={() => setUnitModalOpen(false)}
        title={editingUnit ? 'Edit Satuan' : 'Tambah Satuan'}
        maxWidth="sm"
      >
        <form onSubmit={handleSaveUnit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nama Satuan Unit *
            </label>
            <input
              type="text"
              required
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              placeholder="Contoh: Pieces"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Singkatan (Abbreviation) *
            </label>
            <input
              type="text"
              required
              value={unitAbbreviation}
              onChange={(e) => setUnitAbbreviation(e.target.value)}
              placeholder="Contoh: Pcs"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setUnitModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
