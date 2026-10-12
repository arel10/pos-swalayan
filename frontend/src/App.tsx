import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PosPage } from './pages/PosPage';
import { SalesHistoryPage } from './pages/SalesHistoryPage';
import { ProductsPage } from './pages/ProductsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { InventoryPage } from './pages/InventoryPage';
import { ShiftsPage } from './pages/ShiftsPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersPage } from './pages/UsersPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { useAuthStore } from './store/authStore';

// Role-based root route resolver: Admin goes to Dashboard, Cashier goes to POS
const IndexRouteResolver: React.FC = () => {
  const { isAdmin } = useAuthStore();
  return isAdmin() ? <DashboardPage /> : <Navigate to="/pos" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Protected App Shell */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Index Route */}
          <Route index element={<IndexRouteResolver />} />

          {/* Core POS & Shared Operations */}
          <Route path="pos" element={<PosPage />} />
          <Route path="sales" element={<SalesHistoryPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="shifts" element={<ShiftsPage />} />

          {/* Admin Management Routes */}
          <Route
            path="products"
            element={
              <ProtectedRoute adminOnly>
                <ProductsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="categories"
            element={
              <ProtectedRoute adminOnly>
                <CategoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="suppliers"
            element={
              <ProtectedRoute adminOnly>
                <SuppliersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="purchases"
            element={
              <ProtectedRoute adminOnly>
                <PurchasesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports"
            element={
              <ProtectedRoute adminOnly>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="users"
            element={
              <ProtectedRoute adminOnly>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="audit-logs"
            element={
              <ProtectedRoute adminOnly>
                <AuditLogsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
