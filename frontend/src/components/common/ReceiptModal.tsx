import React from 'react';
import { Modal } from './Modal';
import { Printer } from 'lucide-react';
import type { Sale } from '../../types';
import { formatRupiah, formatDateTime } from '../../lib/formatters';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  sale,
}) => {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceDisplay = sale.sale_number || sale.invoice_number || `#${sale.id}`;
  const discountVal = sale.discount_amount || sale.discount || 0;
  const paymentObj = sale.payment || (sale.payments && sale.payments.length > 0 ? sale.payments[0] : null);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Struk Pembayaran" maxWidth="md">
      <div className="flex flex-col items-center">
        {/* Thermal Receipt Preview Paper */}
        <div
          id="printable-receipt"
          className="w-full max-w-[340px] bg-white border border-dashed border-slate-300 p-5 rounded-lg shadow-sm font-mono text-xs text-slate-900 selection:bg-none"
        >
          {/* Header */}
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <h2 className="font-bold text-sm tracking-wide">POS SWALAYAN SEJAHTERA</h2>
            <p className="text-[11px] text-slate-600">Jl. Raya Swalayan No. 88, Jakarta</p>
            <p className="text-[11px] text-slate-600">Telp: (021) 7890-1234</p>
          </div>

          {/* Meta Info */}
          <div className="py-2.5 text-[11px] border-b border-dashed border-slate-300 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">No. Transaksi:</span>
              <span className="font-bold">{invoiceDisplay}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Waktu:</span>
              <span>{formatDateTime(sale.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Kasir:</span>
              <span>{sale.cashier?.name ?? `Kasir #${sale.cashier_id}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="font-bold">{sale.status}</span>
            </div>
          </div>

          {/* Items */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
            {sale.items?.map((item, idx) => {
              const itemName = item.name || item.product?.name || `Item #${item.product_id}`;
              const itemPrice = item.unit_price || item.price || 0;
              return (
                <div key={idx} className="flex flex-col">
                  <span className="font-medium text-slate-800">{itemName}</span>
                  <div className="flex justify-between text-slate-600 text-[11px] pl-1">
                    <span>
                      {item.quantity} x {formatRupiah(itemPrice)}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {formatRupiah(item.subtotal)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatRupiah(sale.total_amount)}</span>
            </div>
            {discountVal > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Diskon:</span>
                <span>-{formatRupiah(discountVal)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-200">
              <span>TOTAL:</span>
              <span className="text-sm">{formatRupiah(sale.final_amount)}</span>
            </div>

            {paymentObj ? (
              <>
                <div className="flex justify-between pt-1">
                  <span>Metode:</span>
                  <span className="font-semibold uppercase">{paymentObj.method || paymentObj.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bayar:</span>
                  <span>{formatRupiah(paymentObj.amount || paymentObj.amount_paid || sale.paid_amount)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Kembali:</span>
                  <span>{formatRupiah(paymentObj.change_amount ?? sale.change_amount)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between pt-1">
                  <span>Bayar:</span>
                  <span>{formatRupiah(sale.paid_amount)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Kembali:</span>
                  <span>{formatRupiah(sale.change_amount)}</span>
                </div>
              </>
            )}
          </div>

          {/* Footer Note */}
          <div className="text-center pt-3 text-[10px] text-slate-500 space-y-1">
            <p>*** TERIMA KASIH ATAS KUNJUNGAN ANDA ***</p>
            <p>Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-6 w-full max-w-[340px]">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Cetak Struk
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
};
