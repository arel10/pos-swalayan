// ─── API Response Envelope ───────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_page: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthUser {
  id: number;
  name: string;
  username: string;
  role: string; // "admin" | "kasir"
  status: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

// ─── Roles ────────────────────────────────────────────────────────────────────

export interface Role {
  id: number;
  name: string;
  created_at?: string;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  username: string;
  role_id: number;
  role?: Role;
  status: string; // "ACTIVE" | "INACTIVE"
  created_at: string;
}

export interface CreateUserRequest {
  name: string;
  username: string;
  password: string;
  role_id: number;
}

export interface UpdateUserRequest {
  name?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface ResetPasswordRequest {
  password: string;
}

// ─── Categories ───────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  created_at?: string;
}

export interface CreateCategoryRequest {
  name: string;
}

export interface UpdateCategoryRequest {
  name: string;
}

// ─── Units ────────────────────────────────────────────────────────────────────

export interface Unit {
  id: number;
  name: string;
  abbreviation?: string;
  created_at?: string;
}

export interface CreateUnitRequest {
  name: string;
  abbreviation: string;
}

export interface UpdateUnitRequest {
  name?: string;
  abbreviation?: string;
}

// ─── Products ─────────────────────────────────────────────────────────────────

export interface Product {
  id: number;
  sku: string;
  barcode: string;
  name: string;
  category_id: number;
  unit_id: number;
  buy_price: number;
  sell_price: number;
  stock: number;
  min_stock: number;
  status: string; // "ACTIVE" | "INACTIVE"
  description?: string;
  category?: Category;
  unit?: Unit;
  created_at: string;
  updated_at: string;
}

export interface CreateProductRequest {
  sku: string;
  barcode?: string;
  name: string;
  category_id: number;
  unit_id: number;
  buy_price: number;
  sell_price: number;
  stock?: number;
  min_stock?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  description?: string;
}

export interface UpdateProductRequest {
  name?: string;
  barcode?: string;
  sku?: string;
  category_id?: number;
  unit_id?: number;
  buy_price?: number;
  sell_price?: number;
  min_stock?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  description?: string;
}

// ─── Suppliers ────────────────────────────────────────────────────────────────

export interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  status: string; // "ACTIVE" | "INACTIVE"
  created_at: string;
  updated_at: string;
}

export interface CreateSupplierRequest {
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface UpdateSupplierRequest {
  name?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

// ─── Purchases ────────────────────────────────────────────────────────────────

export interface PurchaseItem {
  id: number;
  purchase_id: number;
  product_id: number;
  product?: Product;
  quantity: number;
  buy_price: number;
  cost_price?: number; // alias
  subtotal: number;
}

export interface Purchase {
  id: number;
  purchase_number: string;
  invoice_number?: string; // alias
  supplier_id: number;
  supplier?: Supplier;
  status: string; // "DRAFT" | "RECEIVED" | "CANCELLED"
  total_amount: number;
  notes?: string;
  received_at?: string | null;
  created_by_id?: number;
  items?: PurchaseItem[];
  created_at: string;
  updated_at: string;
}

export interface CreatePurchaseItemInput {
  product_id: number;
  quantity: number;
  buy_price: number;
  cost_price?: number;
}

export interface CreatePurchaseRequest {
  supplier_id: number;
  invoice_number?: string;
  notes?: string;
  items: CreatePurchaseItemInput[];
}

// ─── Inventory / Stock Movements ──────────────────────────────────────────────

export interface StockMovement {
  id: number;
  product_id: number;
  product?: Product;
  type: string; // "IN" | "OUT"
  quantity: number;
  stock_before: number;
  stock_after: number;
  reference_type: string; // "SALE" | "PURCHASE" | "ADJUSTMENT"
  reference_id: number;
  notes: string;
  created_by_id: number;
  created_at: string;
}

export interface AdjustmentRequest {
  product_id: number;
  quantity: number; // positive = add, negative = subtract
  notes: string;
}

// ─── Sales / POS ──────────────────────────────────────────────────────────────

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  product?: Product;
  name: string;
  barcode: string;
  quantity: number;
  unit_price: number;
  price?: number; // alias
  subtotal: number;
}

export interface Payment {
  id: number;
  sale_id: number;
  method: string; // "CASH" | "QRIS" | "DEBIT" | "TRANSFER"
  payment_method?: string; // alias
  amount: number;
  amount_paid?: number; // alias
  change_amount: number;
  created_at: string;
}

export interface Sale {
  id: number;
  sale_number: string;
  invoice_number?: string; // alias
  cashier_id: number;
  cashier?: User;
  shift_id: number;
  status: string; // "COMPLETED" | "VOID"
  total_amount: number;
  discount_amount: number;
  discount?: number; // alias
  final_amount: number;
  paid_amount: number;
  change_amount: number;
  notes?: string;
  void_reason?: string;
  voided_at?: string | null;
  voided_by_id?: number | null;
  items?: SaleItem[];
  payment?: Payment;
  payments?: Payment[]; // alias for compatibility
  created_at: string;
  updated_at: string;
}

export interface CheckoutItemInput {
  product_id: number;
  quantity: number;
}

export interface CheckoutRequest {
  shift_id: number;
  items: CheckoutItemInput[];
  payment_method: 'CASH' | 'QRIS' | 'DEBIT' | 'TRANSFER';
  paid_amount: number;
  discount_amount?: number;
  notes?: string;
}

export interface VoidRequest {
  reason: string;
}

// ─── Cart (frontend-only state) ───────────────────────────────────────────────

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

// ─── Shifts ───────────────────────────────────────────────────────────────────

export interface CashierShift {
  id: number;
  cashier_id: number;
  status: string; // "OPEN" | "CLOSED"
  opening_cash: number;
  expected_cash: number;
  actual_cash: number;
  cash_variance: number;
  total_sales: number;
  transaction_count: number;
  notes: string;
  opened_at: string;
  closed_at: string | null;
  created_at: string;
}

export interface OpenShiftRequest {
  opening_cash: number;
  notes?: string;
}

export interface CloseShiftRequest {
  actual_cash: number;
  notes?: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface TopItem {
  product_id: number;
  product_name: string;
  qty_sold: number;
}

export interface StockItem {
  product_id: number;
  product_name: string;
  stock: number;
  min_stock: number;
}

export interface DashboardData {
  today_sales: number;
  today_transactions: number;
  today_items_sold: number;
  gross_profit: number;
  low_stock_count: number;
  top_products: TopItem[];
  low_stock_products: StockItem[];
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export interface SalesReportRow {
  date: string;
  total_sales: number;
  transactions: number;
  items_sold: number;
}

export interface TopProductRow {
  product_id: number;
  product_name: string;
  qty_sold: number;
  revenue: number;
}

export interface ProfitReportRow {
  date: string;
  revenue: number;
  cogs: number;
  gross_profit: number;
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export interface AuditLog {
  id: number;
  user_id: number;
  user?: User;
  username: string;
  action: string;
  module: string;
  reference_id: number;
  description: string;
  ip_address: string;
  created_at: string;
}

// ─── Pagination / Filter helpers ──────────────────────────────────────────────

export interface PageParams {
  page?: number;
  per_page?: number;
}
