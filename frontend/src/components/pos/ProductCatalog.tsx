import React, { useState, useEffect, useRef } from 'react';
import { productsApi, categoriesApi } from '../../lib/api/endpoints';
import { useCartStore } from '../../store/cartStore';
import { toast } from '../../store/toastStore';
import { formatRupiah } from '../../lib/formatters';
import type { Product, Category } from '../../types';
import { Search, Barcode, PackageCheck } from 'lucide-react';

export const ProductCatalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const { addItem } = useCartStore();

  // Load initial active products and categories
  useEffect(() => {
    loadCategories();
    loadProducts();
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      const res = await categoriesApi.list({ per_page: 50 });
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch {
      // ignore
    }
  };

  const loadProducts = async (query = '') => {
    try {
      setLoading(true);
      if (query.trim()) {
        const res = await productsApi.posSearch(query.trim());
        if (res.data.success) {
          setProducts(res.data.data);
        }
      } else {
        const res = await productsApi.list({
          status: 'ACTIVE',
          per_page: 50,
          search: query || undefined,
        });
        if (res.data.success) {
          let list = res.data.data;
          if (selectedCategory) {
            list = list.filter((p) => p.category_id === selectedCategory);
          }
          setProducts(list);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // Barcode scanner trigger on Enter
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    try {
      // Fast search
      const res = await productsApi.posSearch(code);
      if (res.data.success && res.data.data.length > 0) {
        const exactMatch =
          res.data.data.find(
            (p) =>
              p.barcode.toLowerCase() === code.toLowerCase() ||
              p.sku.toLowerCase() === code.toLowerCase()
          ) ?? res.data.data[0];

        if (exactMatch.stock <= 0) {
          toast.warning(`Stok ${exactMatch.name} habis (0)!`);
        } else {
          addItem(exactMatch);
          toast.success(`Ditambahkan: ${exactMatch.name}`);
        }
        setBarcodeInput('');
      } else {
        toast.error(`Produk barcode "${code}" tidak ditemukan`);
      }
    } catch {
      toast.error('Gagal memindai barcode');
    }
  };

  const handleProductClick = (product: Product) => {
    if (product.stock <= 0) {
      toast.warning(`Stok produk "${product.name}" habis!`);
      return;
    }
    addItem(product);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Search & Barcode Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/60 space-y-3">
        {/* Fast Barcode Input (Scanner Target) */}
        <form onSubmit={handleBarcodeSubmit} className="relative">
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-indigo-600">
              <Barcode className="w-5 h-5" />
            </span>
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan barcode di sini lalu tekan Enter (atau ketik barcode/SKU)..."
              className="w-full pl-11 pr-24 py-2.5 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs sm:text-sm bg-indigo-50/20 text-slate-900 placeholder:text-slate-400"
              autoFocus
            />
            <button
              type="submit"
              className="absolute right-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm"
            >
              Scan Enter
            </button>
          </div>
        </form>

        {/* Name / Keyword Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                loadProducts(e.target.value);
              }}
              placeholder="Cari nama barang..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs bg-white"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition ${
              selectedCategory === null
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Semua
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition ${
                selectedCategory === c.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid / List */}
      <div className="flex-1 p-4 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400 text-xs">
            Memuat produk...
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs text-center space-y-1">
            <PackageCheck className="w-8 h-8 text-slate-300" />
            <p className="font-semibold text-slate-600">Tidak ada produk ditemukan</p>
            <p>Pastikan produk aktif dan memiliki stok di sistem.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {products.map((product) => {
              const isOutOfStock = product.stock <= 0;
              const isLowStock = product.stock > 0 && product.stock <= product.min_stock;

              return (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className={`group relative flex flex-col justify-between p-3 rounded-xl border transition cursor-pointer select-none ${
                    isOutOfStock
                      ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                      : 'bg-white border-slate-200/80 hover:border-indigo-400 hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                        {product.barcode || product.sku}
                      </span>
                      {product.unit && <span>{product.unit.name}</span>}
                    </div>

                    <h4 className="font-semibold text-xs text-slate-800 line-clamp-2 leading-tight group-hover:text-indigo-600 transition">
                      {product.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Harga</span>
                      <span className="font-bold text-sm text-indigo-900">
                        {formatRupiah(product.sell_price)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          isOutOfStock
                            ? 'bg-rose-100 text-rose-700'
                            : isLowStock
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isOutOfStock ? 'Habis' : `Stok: ${product.stock}`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
