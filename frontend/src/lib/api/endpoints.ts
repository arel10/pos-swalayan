import { apiClient } from './client';
import type {
  ApiResponse,
  ApiListResponse,
  LoginRequest,
  LoginResponse,
  AuthUser,
  User,
  CreateUserRequest,
  UpdateUserRequest,
  ResetPasswordRequest,
  Role,
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  Unit,
  CreateUnitRequest,
  UpdateUnitRequest,
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  Purchase,
  CreatePurchaseRequest,
  StockMovement,
  AdjustmentRequest,
  Sale,
  CheckoutRequest,
  VoidRequest,
  CashierShift,
  OpenShiftRequest,
  CloseShiftRequest,
  DashboardData,
  SalesReportRow,
  TopProductRow,
  ProfitReportRow,
  AuditLog,
  PageParams,
} from '../../types';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data),
  logout: () => apiClient.post<ApiResponse<{ message: string }>>('/auth/logout'),
  me: () => apiClient.get<ApiResponse<AuthUser>>('/auth/me'),
};

// ─── Roles ────────────────────────────────────────────────────────────────────

export const rolesApi = {
  list: () => apiClient.get<ApiResponse<Role[]>>('/roles'),
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const usersApi = {
  list: (params?: PageParams & { search?: string }) =>
    apiClient.get<ApiListResponse<User>>('/users', { params }),
  get: (id: number) => apiClient.get<ApiResponse<User>>(`/users/${id}`),
  create: (data: CreateUserRequest) =>
    apiClient.post<ApiResponse<User>>('/users', data),
  update: (id: number, data: UpdateUserRequest) =>
    apiClient.patch<ApiResponse<User>>(`/users/${id}`, data),
  resetPassword: (id: number, data: ResetPasswordRequest) =>
    apiClient.post<ApiResponse<{ message: string }>>(`/users/${id}/reset-password`, data),
};

// ─── Categories ───────────────────────────────────────────────────────────────

export const categoriesApi = {
  list: (params?: PageParams & { search?: string }) =>
    apiClient.get<ApiListResponse<Category>>('/categories', { params }),
  get: (id: number) => apiClient.get<ApiResponse<Category>>(`/categories/${id}`),
  create: (data: CreateCategoryRequest) =>
    apiClient.post<ApiResponse<Category>>('/categories', data),
  update: (id: number, data: UpdateCategoryRequest) =>
    apiClient.patch<ApiResponse<Category>>(`/categories/${id}`, data),
};

// ─── Units ────────────────────────────────────────────────────────────────────

export const unitsApi = {
  list: (params?: PageParams & { search?: string }) =>
    apiClient.get<ApiListResponse<Unit>>('/units', { params }),
  get: (id: number) => apiClient.get<ApiResponse<Unit>>(`/units/${id}`),
  create: (data: CreateUnitRequest) =>
    apiClient.post<ApiResponse<Unit>>('/units', data),
  update: (id: number, data: UpdateUnitRequest) =>
    apiClient.patch<ApiResponse<Unit>>(`/units/${id}`, data),
};

// ─── Products ─────────────────────────────────────────────────────────────────

export const productsApi = {
  list: (params?: PageParams & { search?: string; status?: string }) =>
    apiClient.get<ApiListResponse<Product>>('/products', { params }),
  get: (id: number) => apiClient.get<ApiResponse<Product>>(`/products/${id}`),
  create: (data: CreateProductRequest) =>
    apiClient.post<ApiResponse<Product>>('/products', data),
  update: (id: number, data: UpdateProductRequest) =>
    apiClient.patch<ApiResponse<Product>>(`/products/${id}`, data),
  // POS barcode/name search — returns active products only
  posSearch: (q: string) =>
    apiClient.get<ApiResponse<Product[]>>('/pos/products', { params: { q } }),
};

// ─── Suppliers ────────────────────────────────────────────────────────────────

export const suppliersApi = {
  list: (params?: PageParams & { search?: string }) =>
    apiClient.get<ApiListResponse<Supplier>>('/suppliers', { params }),
  get: (id: number) => apiClient.get<ApiResponse<Supplier>>(`/suppliers/${id}`),
  create: (data: CreateSupplierRequest) =>
    apiClient.post<ApiResponse<Supplier>>('/suppliers', data),
  update: (id: number, data: UpdateSupplierRequest) =>
    apiClient.patch<ApiResponse<Supplier>>(`/suppliers/${id}`, data),
};

// ─── Purchases ────────────────────────────────────────────────────────────────

export const purchasesApi = {
  list: (params?: PageParams & { status?: string }) =>
    apiClient.get<ApiListResponse<Purchase>>('/purchases', { params }),
  get: (id: number) => apiClient.get<ApiResponse<Purchase>>(`/purchases/${id}`),
  create: (data: CreatePurchaseRequest) =>
    apiClient.post<ApiResponse<Purchase>>('/purchases', data),
  receive: (id: number) =>
    apiClient.post<ApiResponse<{ message: string }>>(`/purchases/${id}/receive`),
  cancel: (id: number) =>
    apiClient.post<ApiResponse<{ message: string }>>(`/purchases/${id}/cancel`),
};

// ─── Inventory ────────────────────────────────────────────────────────────────

export const inventoryApi = {
  movements: (params?: PageParams & { product_id?: number }) =>
    apiClient.get<ApiListResponse<StockMovement>>('/inventory/movements', { params }),
  adjust: (data: AdjustmentRequest) =>
    apiClient.post<ApiResponse<{ message: string }>>('/inventory/adjustments', data),
};

// ─── Sales ────────────────────────────────────────────────────────────────────

export const salesApi = {
  list: (params?: PageParams & { status?: string; cashier_id?: number }) =>
    apiClient.get<ApiListResponse<Sale>>('/sales', { params }),
  get: (id: number) => apiClient.get<ApiResponse<Sale>>(`/sales/${id}`),
  checkout: (data: CheckoutRequest) =>
    apiClient.post<ApiResponse<Sale>>('/sales', data),
  void: (id: number, data: VoidRequest) =>
    apiClient.post<ApiResponse<{ message: string }>>(`/sales/${id}/void`, data),
};

// ─── Shifts ───────────────────────────────────────────────────────────────────

export const shiftsApi = {
  list: (params?: PageParams & { status?: string; cashier_id?: number }) =>
    apiClient.get<ApiListResponse<CashierShift>>('/shifts', { params }),
  get: (id: number) => apiClient.get<ApiResponse<CashierShift>>(`/shifts/${id}`),
  open: (data: OpenShiftRequest) =>
    apiClient.post<ApiResponse<CashierShift>>('/shifts/open', data),
  close: (id: number, data: CloseShiftRequest) =>
    apiClient.post<ApiResponse<CashierShift>>(`/shifts/${id}/close`, data),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const dashboardApi = {
  get: () => apiClient.get<ApiResponse<DashboardData>>('/dashboard'),
};

// ─── Reports ──────────────────────────────────────────────────────────────────

export const reportsApi = {
  sales: (params: { start_date: string; end_date: string }) =>
    apiClient.get<ApiResponse<SalesReportRow[]>>('/reports/sales', { params }),
  topProducts: (params: { start_date: string; end_date: string }) =>
    apiClient.get<ApiResponse<TopProductRow[]>>('/reports/top-products', { params }),
  profit: (params: { start_date: string; end_date: string }) =>
    apiClient.get<ApiResponse<ProfitReportRow[]>>('/reports/profit', { params }),
};

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export const auditApi = {
  list: (params?: PageParams & { module?: string; action?: string }) =>
    apiClient.get<ApiListResponse<AuditLog>>('/audit-logs', { params }),
};
