# PRODUCT REQUIREMENTS DOCUMENT

## POS Swalayan

**Production-Oriented MVP • Golang + React.js + MySQL**

| Dokumen | Nilai |
| --- | --- |
| Versi | 1.0 |
| Status | Draft / Development Baseline |
| Target | Web Application / Desktop Browser |
| Backend | Golang + Gin (recommended) |
| Frontend | React.js + TypeScript |
| Database | MySQL |
| Authentication | JWT + password hashing |
| Role | Admin, Kasir |

## 1. Ringkasan Produk

POS Swalayan adalah aplikasi Point of Sale untuk operasional swalayan/retail. Fokus MVP adalah transaksi penjualan, pengelolaan produk, stok, pembelian, shift kasir, dan laporan. Versi awal hanya memiliki dua role: Admin dan Kasir. Arsitektur dibuat modular agar dapat dikembangkan ke multi-outlet, member, loyalty, promosi, pembayaran digital, dan role tambahan.

## 2. Tujuan Produk

- Mempercepat proses transaksi kasir.

- Mengurangi kesalahan pencatatan penjualan dan stok.

- Menyediakan histori perubahan stok yang dapat ditelusuri.

- Menyediakan kontrol shift dan rekonsiliasi kas.

- Memberikan dashboard dan laporan operasional untuk Admin.

- Membangun fondasi POS yang mudah dikembangkan.

## 3. Ruang Lingkup MVP

| Modul | MVP |
| --- | --- |
| Authentication & Authorization | Login, logout, role-based access |
| User Management | Admin mengelola Admin/Kasir |
| Product Management | Produk, barcode, kategori, satuan, harga, stok minimum |
| Supplier | Data supplier |
| Purchasing | Pembelian dan penerimaan barang |
| Inventory | Stok dan stock movement |
| POS | Cart, barcode/search, checkout, pembayaran |
| Transaction | Riwayat, detail, void sesuai permission |
| Cashier Shift | Open shift, closing, cash reconciliation |
| Reports | Penjualan, produk, stok, kasir, profit sederhana |
| Dashboard | KPI penjualan dan stok kritis |
| Audit Log | Aktivitas penting |

## 4. Role & Permission

| Fitur | Admin | Kasir |
| --- | --- | --- |
| Dashboard | Full | Terbatas |
| POS / Transaksi | Ya | Ya |
| Riwayat Transaksi | Semua | Transaksi sesuai akses |
| Void/Cancel Transaksi | Ya | Dengan aturan/approval |
| Produk | CRUD | Lihat/Search |
| Kategori & Satuan | CRUD | Lihat |
| Supplier | CRUD | Tidak |
| Pembelian | CRUD | Tidak |
| Stok & Adjustment | CRUD | Lihat |
| User | CRUD | Tidak |
| Shift Kasir | Monitor | Open/Close |
| Laporan | Semua | Terbatas |
| Settings | Ya | Tidak |
| Audit Log | Lihat | Tidak |

## 5. User Flow Utama

### 5.1 Login

User → Login → Validasi kredensial → Generate JWT → Redirect berdasarkan role.

### 5.2 Transaksi Penjualan

1. Kasir login dan membuka shift.

1. Kasir scan barcode atau mencari produk.

1. Produk masuk ke keranjang.

1. Kasir mengubah quantity jika diperlukan.

1. Sistem menghitung subtotal, diskon jika tersedia, dan total.

1. Kasir memilih metode pembayaran.

1. Sistem memvalidasi pembayaran.

1. Sistem menyimpan sale, sale_items, payment, dan stock movement secara atomic.

1. Stok berkurang.

1. Struk ditampilkan/siap dicetak.

### 5.3 Pembelian Barang

Admin → Supplier → Purchase → Item → Receive → Stok bertambah → Stock movement tercatat.

### 5.4 Closing Shift

Kasir → Close shift → Expected cash dihitung → Cash aktual dimasukkan → Variance dihitung → Shift disimpan.

## 6. Functional Requirements

| ID | Modul | Requirement |
| --- | --- | --- |
| FR-AUTH | Authentication | Login/logout, JWT expiration, password hashing, role authorization. |
| FR-USER | User | Admin CRUD akun Admin/Kasir, activate/deactivate, reset password. |
| FR-PROD | Product | CRUD, barcode unik, kategori, satuan, harga beli/jual, minimum stock, status. |
| FR-SUP | Supplier | CRUD supplier, kontak, alamat, status aktif. |
| FR-PUR | Purchasing | Draft/receive/cancel purchase; receiving menambah stok. |
| FR-STK | Inventory | Stock, stock movement, adjustment, low-stock, histori. |
| FR-POS | POS | Scan/search, cart, quantity, subtotal, discount, total, checkout. |
| FR-PAY | Payment | Cash; struktur siap untuk QRIS/debit/transfer; kembalian. |
| FR-SALE | Sales | Nomor unik, cashier, item, total, payment, waktu, status. |
| FR-SHIFT | Shift | Open, modal awal, expected cash, closing, variance, history. |
| FR-RPT | Reports | Sales, top products, inventory, purchases, cashier, gross profit. |
| FR-DASH | Dashboard | Sales, transaksi, item terjual, profit, top product, low stock. |
| FR-AUDIT | Audit | Login, perubahan master, adjustment, void, purchase, aktivitas admin. |

## 7. Detail Modul POS

- POS dioptimalkan untuk keyboard dan barcode scanner.

- Produk dicari berdasarkan barcode, SKU, atau nama.

- Produk inactive tidak dapat dijual.

- Sistem menolak quantity melebihi stok, kecuali kebijakan negative stock diaktifkan Admin.

- Total final dihitung ulang di server sebagai source of truth.

- Checkout menggunakan database transaction.

- Nomor transaksi harus unik.

- Struk memuat toko, nomor transaksi, kasir, waktu, item, total, pembayaran, dan kembalian.

## 8. Inventory & Stock Rules

- Penjualan mengurangi stok.

- Penerimaan pembelian menambah stok.

- Adjustment dapat menambah/mengurangi stok dan wajib memiliki alasan.

- Setiap perubahan stok menghasilkan stock movement.

- Stock movement memiliki reference type/reference ID.

- Minimum stock menandai produk low stock.

- Produk yang sudah memiliki transaksi tidak di-hard-delete; gunakan inactive/soft delete.

## 9. Data Model / Entitas Utama

| Entity | Tujuan |
| --- | --- |
| users | Akun pengguna dan role |
| roles | Fondasi authorization |
| categories | Kategori produk |
| units | Satuan produk |
| products | Master produk dan harga |
| suppliers | Master supplier |
| purchases | Header pembelian |
| purchase_items | Detail pembelian |
| stock_movements | Histori perubahan stok |
| sales | Header transaksi |
| sale_items | Detail item penjualan |
| payments | Pembayaran transaksi |
| cashier_shifts | Shift dan rekonsiliasi kas |
| audit_logs | Audit aktivitas penting |

## 10. Status Utama

| Objek | Status |
| --- | --- |
| Product | ACTIVE, INACTIVE |
| Purchase | DRAFT, RECEIVED, CANCELLED |
| Sale | COMPLETED, VOID, REFUNDED |
| Shift | OPEN, CLOSED |
| User | ACTIVE, INACTIVE |

## 11. API Requirements

REST JSON dengan prefix /api/v1. Endpoint terlindungi menggunakan Bearer JWT dan middleware authorization.

| Area | Contoh Endpoint |
| --- | --- |
| Auth | POST /api/v1/auth/login |
| Users | GET/POST/PATCH /api/v1/users |
| Products | GET/POST/PATCH /api/v1/products |
| Categories | GET/POST/PATCH /api/v1/categories |
| Suppliers | GET/POST/PATCH /api/v1/suppliers |
| Purchases | GET/POST/PATCH /api/v1/purchases |
| Inventory | GET /api/v1/inventory; POST /api/v1/inventory/adjustments |
| POS | GET /api/v1/pos/products; POST /api/v1/sales |
| Sales | GET /api/v1/sales; GET /api/v1/sales/:id |
| Shifts | POST /api/v1/shifts/open; POST /api/v1/shifts/:id/close |
| Reports | GET /api/v1/reports/sales; /inventory; /profit |
| Dashboard | GET /api/v1/dashboard |
| Audit | GET /api/v1/audit-logs |

## 12. Non-Functional Requirements

- Security: Argon2id/bcrypt, JWT, authorization middleware, validation, login rate limiting, parameterized queries/ORM.

- Consistency: proses sale/payment/stock harus atomic.

- Performance: pencarian produk responsif untuk katalog ribuan produk.

- Reliability: format error API konsisten dan tidak membocorkan detail internal.

- Auditability: aktivitas kritis dapat ditelusuri berdasarkan user, waktu, action, dan reference.

- Maintainability: backend dipisah menjadi handler, service, repository, model, middleware.

- Frontend: desktop/laptop friendly, keyboard-friendly, barcode scanner friendly.

- Backup: database backup berkala dan prosedur restore diuji sebelum production.

## 13. Arsitektur Teknis

React.js + TypeScript berkomunikasi dengan REST API Golang. Backend menggunakan pemisahan handler/controller, service, repository, model/entity, middleware, dan konfigurasi. MySQL menjadi sumber data utama.

Contoh struktur backend:

- cmd/

- internal/modules/auth/

- internal/modules/users/

- internal/modules/products/

- internal/modules/purchases/

- internal/modules/inventory/

- internal/modules/sales/

- internal/modules/shifts/

- internal/modules/reports/

- internal/middleware/

- internal/database/

- internal/shared/

## 14. Frontend Pages

| Page | Role | Isi |
| --- | --- | --- |
| Login | Admin/Kasir | Authentication |
| Dashboard | Admin | KPI dan ringkasan |
| POS | Admin/Kasir | Transaksi penjualan |
| Sales History | Admin/Kasir | Riwayat transaksi |
| Products | Admin | Master produk |
| Categories | Admin | Kategori |
| Suppliers | Admin | Supplier |
| Purchases | Admin | Pembelian |
| Inventory | Admin/Kasir | Stok sesuai permission |
| Shifts | Admin/Kasir | Open/close dan monitoring |
| Reports | Admin | Laporan |
| Users | Admin | Pengguna |
| Audit Logs | Admin | Audit aktivitas |
| Settings | Admin | Konfigurasi toko |

## 15. Dashboard KPI

- Total penjualan hari ini.

- Jumlah transaksi hari ini.

- Total item terjual.

- Gross profit sederhana.

- Produk terlaris.

- Produk low stock.

- Penjualan berdasarkan metode pembayaran.

- Perbandingan penjualan berdasarkan periode.

## 16. Acceptance Criteria MVP

1. Admin dan Kasir dapat login dengan akses sesuai role.

1. Admin dapat mengelola produk, kategori, supplier, dan user.

1. Kasir dapat membuka shift sebelum transaksi.

1. Kasir dapat bertransaksi melalui barcode atau pencarian.

1. Checkout menghasilkan sale, payment, dan stock movement secara konsisten.

1. Stok otomatis berkurang setelah penjualan.

1. Penerimaan pembelian otomatis menambah stok.

1. Admin dapat melakukan adjustment dengan alasan.

1. Kasir dapat menutup shift dan sistem menghitung variance.

1. Admin dapat melihat laporan penjualan dan stok.

1. Aktivitas kritis tercatat dalam audit log.

1. Endpoint terlindungi dari akses role yang tidak berhak.

## 17. Roadmap

| Tahap | Fitur |
| --- | --- |
| MVP | Auth, roles, products, POS, payment, sales, stock, supplier, purchase, shift, reports |
| V1.1 | Discount engine, member/customer, refund, hold transaction, receipt customization |
| V1.2 | QRIS/payment integration, printer integration, barcode label printing |
| V2 | Multi-outlet, central inventory, outlet-level permissions |
| V3 | Loyalty, promotions, mobile companion, advanced analytics |

## 18. Out of Scope MVP

- Multi-outlet.

- Customer mobile application.

- Online store/e-commerce.

- Complex accounting/general ledger.

- Payroll.

- Advanced loyalty program.

- Payment gateway wajib.

## 19. Prinsip Pengembangan

- Bangun core transaction flow terlebih dahulu.

- Gunakan database transaction untuk operasi multi-tabel.

- Jangan hard-delete data transaksi.

- Semua perubahan stok harus memiliki jejak.

- Business rule penting divalidasi di backend.

- Siapkan extensibility tanpa membangun fitur yang belum diperlukan.

## 20. Definition of Done MVP

- Acceptance criteria terpenuhi.

- API memiliki validation dan error handling konsisten.

- Role authorization diuji.

- Alur penjualan dan stok diuji dengan data staging.

- Backup dan restore database telah diuji.

- Tidak ada stok berubah tanpa movement yang tercatat.

- Dashboard/laporan konsisten dengan data transaksi.

- Aplikasi siap digunakan untuk satu swalayan dan satu outlet.

— End of PRD —
