import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useShiftStore } from '../../store/shiftStore';
import { OpenShiftModal } from '../pos/OpenShiftModal';
import { CloseShiftModal } from '../pos/CloseShiftModal';
import { ToastContainer } from '../common/ToastContainer';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Layers,
  Truck,
  FileSpreadsheet,
  Warehouse,
  Clock,
  BarChart3,
  Users,
  ShieldCheck,
  LogOut,
  Store,
  ChevronRight,
  Menu,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth, isAdmin } = useAuthStore();
  const { activeShift, fetchActiveShift } = useShiftStore();

  const [openShiftModalOpen, setOpenShiftModalOpen] = useState(false);
  const [closeShiftModalOpen, setCloseShiftModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchActiveShift();
  }, [fetchActiveShift]);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const navItems = [
    ...(isAdmin()
      ? [
          { label: 'Dashboard', path: '/', icon: LayoutDashboard },
        ]
      : []),
    { label: 'Kasir POS', path: '/pos', icon: ShoppingCart },
    { label: 'Riwayat Transaksi', path: '/sales', icon: Receipt },
    ...(isAdmin()
      ? [
          { label: 'Master Produk', path: '/products', icon: Package },
          { label: 'Kategori & Satuan', path: '/categories', icon: Layers },
          { label: 'Supplier', path: '/suppliers', icon: Truck },
          { label: 'Pembelian (PO)', path: '/purchases', icon: FileSpreadsheet },
        ]
      : []),
    { label: 'Inventori & Stok', path: '/inventory', icon: Warehouse },
    { label: 'Shift Kasir', path: '/shifts', icon: Clock },
    ...(isAdmin()
      ? [
          { label: 'Laporan Bisnis', path: '/reports', icon: BarChart3 },
          { label: 'Manajemen Pengguna', path: '/users', icon: Users },
          { label: 'Audit Log', path: '/audit-logs', icon: ShieldCheck },
        ]
      : []),
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 shrink-0 text-slate-300">
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 bg-slate-950">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-tight leading-tight">
              POS Swalayan
            </h1>
            <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">
              Retail Supermarket
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                  }`}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
              </NavLink>
            );
          })}
        </div>

        {/* User Card & Logout in Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white uppercase">
                {user?.name ? user.name[0] : 'U'}
              </div>
              <div className="truncate">
                <p className="font-semibold text-xs text-white truncate">{user?.name}</p>
                <span className="inline-block text-[10px] px-1.5 py-0.2 rounded font-medium uppercase bg-slate-800 text-slate-300">
                  {user?.role}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Keluar"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <p className="text-xs text-slate-400 font-medium">Sistem Operasional Kasir & Swalayan</p>
            </div>
          </div>

          {/* Shift Status Bar */}
          <div className="flex items-center gap-3">
            {activeShift ? (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-800 hidden md:inline">
                  Shift Buka (ID #{activeShift.id})
                </span>
                <button
                  onClick={() => setCloseShiftModalOpen(true)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline pl-1"
                >
                  Tutup Shift
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-xs font-semibold text-amber-800 hidden md:inline">
                  Shift Kasir Belum Dibuka
                </span>
                <button
                  onClick={() => setOpenShiftModalOpen(true)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline pl-1"
                >
                  Buka Shift
                </button>
              </div>
            )}

            <button
              onClick={() => navigate('/pos')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>POS Kasir</span>
            </button>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-50/70">
          <Outlet />
        </main>
      </div>

      {/* Modals & Notifications */}
      <OpenShiftModal
        isOpen={openShiftModalOpen}
        onClose={() => setOpenShiftModalOpen(false)}
        onSuccess={() => fetchActiveShift()}
      />

      <CloseShiftModal
        isOpen={closeShiftModalOpen}
        onClose={() => setCloseShiftModalOpen(false)}
        shift={activeShift}
        onSuccess={() => fetchActiveShift()}
      />

      <ToastContainer />
    </div>
  );
};
