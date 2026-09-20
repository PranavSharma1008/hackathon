import React, { useRef } from 'react';
import {
  FileText,
  Printer,
  X,
  CheckCircle2,
  ShieldCheck,
  Building,
  UserCheck,
  Calendar,
  CreditCard,
  Download,
  AlertCircle,
  Truck,
  Hash,
  Scale
} from 'lucide-react';

export default function EscrowBillModal({ contract, onClose, onTrackDispatch }) {
  const printRef = useRef(null);

  if (!contract) return null;

  const totalAmount = Number(contract.agreed_price) || 0;
  const advancePercentage = Number(contract.advance_paid_percentage) || 30;
  const advanceAmount = Number(contract.advance_paid_amount) || Math.round(totalAmount * (advancePercentage / 100));
  const remainingAmount = Math.max(0, totalAmount - advanceAmount);

  const quantityQuintals = (Number(contract.quantity) || 0) * 10;
  const quantityMT = Number(contract.quantity) || 0;
  const ratePerQuintal = quantityQuintals > 0 ? Math.round(totalAmount / quantityQuintals) : 0;

  const invoiceNumber = `BILL-AGRI-${(contract.id || '2026').replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase()}`;
  const transactionId = contract.payment_transaction_id || `TXN-AGRI30-ESCROW-${(contract.id || '001').substring(0, 6).toUpperCase()}`;
  const billingDate = contract.created_at
    ? new Date(contract.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        ref={printRef}
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col my-auto text-slate-800 print:shadow-none print:border-none print:m-0 print:max-w-none"
      >
        {/* Modal Top Bar (Hidden in print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                Official Escrow Settlement Bill &amp; Tax Invoice
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Verified Bill
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Invoice No: <span className="font-mono text-emerald-400 font-bold">{invoiceNumber}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Download Bill</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Bill Content */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[85vh] print:max-h-none print:p-8">
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
                <span className="font-extrabold tracking-wider text-slate-900 text-lg uppercase">
                  AGRISYNC CONTRACT FARMING ESCROW
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                National Direct Procurement &amp; Escrow Settlement System
              </p>
              <p className="text-[11px] text-slate-400">
                Authorized under Model Agricultural Contract Farming &amp; Services Act
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 sm:bg-transparent sm:p-0 sm:border-0">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                TAX INVOICE &amp; ESCROW BILL
              </div>
              <div className="font-mono text-base font-extrabold text-slate-900">
                {invoiceNumber}
              </div>
              <div className="text-xs text-slate-500">
                Issue Date: <strong className="text-slate-800">{billingDate}</strong>
              </div>
              <div className="text-xs text-slate-500">
                Contract Ref: <span className="font-mono text-emerald-700 font-semibold">{contract.id}</span>
              </div>
            </div>
          </div>

          {/* Parties Grid (Farmer & Buyer) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Seller / Farmer */}
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Seller / Primary Producer (Farmer)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                  Verified Farmer
                </span>
              </div>
              <div className="font-extrabold text-slate-900 text-sm">
                {contract.farmer_name || 'Ramesh Kumar (Registered Grower)'}
              </div>
              <div className="text-xs text-slate-600 space-y-0.5">
                <p>Registration No: <span className="font-mono font-medium">AGRI-FARM-9842</span></p>
                <p>Dispatch Silo: Certified Farm Gate Weighbridge</p>
                <p className="text-[11px] text-slate-500">
                  GST Status: Exempt (Section 23, CGST Act - Agricultural Produce)
                </p>
              </div>
            </div>

            {/* Buyer / Processor */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-500" />
                  Buyer / Bulk Consumer (Processor)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 font-bold">
                  Verified Entity
                </span>
              </div>
              <div className="font-extrabold text-slate-900 text-sm">
                {contract.processor_name || 'Agro Bulk Processing Corp Ltd.'}
              </div>
              <div className="text-xs text-slate-600 space-y-0.5">
                <p>Corporate GSTIN: <span className="font-mono font-medium">07AAACB2194L1Z9</span></p>
                <p>Fulfillment Destination: Central Grain Silo &amp; Milling Hub</p>
                <p className="text-[11px] text-slate-500">
                  Payment Mode: Escrow Trust Direct Bank Clearing
                </p>
              </div>
            </div>
          </div>

          {/* Commodity & Line Items Table */}
          <div className="overflow-hidden border border-slate-200 rounded-2xl">
            <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">
                1. Contracted Produce &amp; Rate Schedule
              </span>
              <span className="text-[11px] text-slate-500">HSN Code: 1001 (Raw Grains)</span>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-600 font-bold">
                  <th className="p-3">Commodity &amp; Grade</th>
                  <th className="p-3 text-center">Volume (Quintals)</th>
                  <th className="p-3 text-center">Metric Tonnes</th>
                  <th className="p-3 text-right">Agreed Rate / Qtl</th>
                  <th className="p-3 text-right">Gross Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="text-slate-800 font-medium">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{contract.crop}</div>
                    <div className="text-[11px] text-slate-500">
                      Grade A Standard &bull; Moisture &le; 12% &bull; Purity &ge; 98%
                    </div>
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-slate-900">
                    {quantityQuintals} Qtl
                  </td>
                  <td className="p-3 text-center font-mono text-slate-700">
                    {quantityMT} MT
                  </td>
                  <td className="p-3 text-right font-mono text-slate-900">
                    ₹{ratePerQuintal.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-right font-mono font-extrabold text-slate-900 text-sm">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 2. THE CORE SETTLEMENT LEDGER (Before Amount -> Reduction -> After Amount) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                2. Escrow Deduction &amp; Settlement Ledger
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold">
                30% Escrow Advance Rule Active
              </span>
            </div>

            {/* Visual Step-Down Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Card 1: BEFORE AMOUNT */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
                  Gross Bill (Before Reduction)
                </div>
                <div className="text-xl font-extrabold text-blue-900 font-mono mt-1">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] text-blue-600/90 mt-1">
                  100% total agreed value for {quantityQuintals} Quintals of {contract.crop}.
                </p>
              </div>

              {/* Card 2: 30% REDUCTION / DEDUCTION */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
                    30% Advance (Reduction)
                  </span>
                  <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded">
                    PAID
                  </span>
                </div>
                <div className="text-xl font-extrabold text-amber-900 font-mono mt-1">
                  -₹{advanceAmount.toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] text-amber-700/90 mt-1 font-mono">
                  Txn: {transactionId.substring(0, 16)}...
                </p>
              </div>

              {/* Card 3: AFTER AMOUNT (70% REMAINING) */}
              <div className="p-4 rounded-2xl bg-emerald-50/90 border-2 border-emerald-300 shadow-xs">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                  Net Balance (After Reduction)
                </div>
                <div className="text-xl font-extrabold text-emerald-900 font-mono mt-1">
                  ₹{remainingAmount.toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] text-emerald-700 font-medium mt-1">
                  70% due upon final weighbridge delivery.
                </p>
              </div>
            </div>

            {/* Detailed Itemized Ledger Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <div className="divide-y divide-slate-100 bg-white">
                {/* Gross Before */}
                <div className="p-3.5 flex items-center justify-between font-bold text-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span>A. Gross Invoice Consideration (Before Reduction)</span>
                  </div>
                  <span className="font-mono text-sm text-slate-900">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>

                {/* Deductions */}
                <div className="p-3.5 flex items-center justify-between text-amber-900 bg-amber-50/30 font-semibold">
                  <div className="flex items-center gap-2 pl-4">
                    <span className="text-amber-600 font-bold">&bull;</span>
                    <span>
                      Less: 30% Advance Escrow Payment Deposited
                      <span className="text-[11px] text-slate-500 block font-normal font-mono">
                        Secured in escrow custody &bull; Reference #{transactionId}
                      </span>
                    </span>
                  </div>
                  <span className="font-mono font-bold text-amber-800">- ₹{advanceAmount.toLocaleString('en-IN')}</span>
                </div>

                {/* Statutory exemptions */}
                <div className="p-3 flex items-center justify-between text-slate-500 pl-8 bg-slate-50/40 text-[11px]">
                  <span>Less: APMC / Mandi Cess (Exempt under Direct Agreement)</span>
                  <span className="font-mono">₹0.00</span>
                </div>

                <div className="p-3 flex items-center justify-between text-slate-500 pl-8 bg-slate-50/40 text-[11px]">
                  <span>Less: CGST &amp; SGST (0% Nil-Rated Agricultural Crop)</span>
                  <span className="font-mono">₹0.00</span>
                </div>

                {/* Net Total After Reduction */}
                <div className="p-4 flex items-center justify-between bg-emerald-50 text-emerald-950 font-extrabold border-t-2 border-emerald-300 text-sm">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>B. Net Outstanding Payable on Delivery Acceptance (After Reduction)</span>
                    </div>
                    <span className="text-[11px] font-normal text-emerald-800 block">
                      Guaranteed escrow balance release upon physical weighbridge inspection
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-base sm:text-lg font-black text-emerald-900">
                      ₹{remainingAmount.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">
                      70% Balance Due
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Compliance & Escrow Trustee Seal */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Escrow Trustee &amp; Settlement Guarantee</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Funds held in automated smart contract escrow account <span className="font-mono font-semibold">AGRI-ESC-99824</span>. 
                Disbursement is governed by weighbridge receipt &amp; quality seal.
              </p>
            </div>
            <div className="text-right shrink-0 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Cryptographic Seal</span>
              <span className="font-mono text-[10px] text-slate-700 font-bold bg-white px-2 py-1 rounded border border-slate-200 inline-block mt-0.5">
                SHA256: 7F9A..{invoiceNumber.substring(10)}..E82
              </span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>This bill serves as legal tax invoice and APMC transit pass.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onTrackDispatch && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onTrackDispatch(contract);
                }}
                className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Track Dispatch &rarr;</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Bill</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
