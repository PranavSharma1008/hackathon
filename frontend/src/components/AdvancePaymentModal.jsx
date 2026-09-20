import React, { useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  X,
  Building,
  Smartphone,
  Check,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AdvancePaymentModal({ contract, onClose, onSuccess, onTrackDispatch }) {
  if (!contract) return null;

  const totalAmount = Number(contract.agreed_price) || 0;
  const advancePercentage = 30;
  const advanceAmount = Math.round(totalAmount * (advancePercentage / 100));
  const remainingAmount = totalAmount - advanceAmount;

  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'netbanking' | 'card' | 'instant'
  const [upiId, setUpiId] = useState('consumer@okhdfcbank');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [paymentDone, setPaymentDone] = useState(false);
  const [receipt, setReceipt] = useState(null);

  async function handleConfirmPayment(e) {
    if (e) e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const txnRef = `TXN-AGRI30-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const res = await fetch(`/api/contracts/${contract.id}/pay-advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: advanceAmount,
          payment_method: paymentMethod.toUpperCase(),
          transaction_ref: txnRef
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process advance escrow payment');
      }

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}

      setReceipt({
        txnRef,
        amount: advanceAmount,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }),
        delivery: data.delivery
      });
      setPaymentDone(true);

      if (onSuccess) {
        onSuccess(data.data, data.delivery);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <CreditCard className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                30% Advance Escrow Payment
              </h3>
              <p className="text-xs text-emerald-100">
                Both parties agreed &bull; Deposit 30% advance to activate dispatch
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 text-xl font-bold cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {paymentDone && receipt ? (
          /* Payment Success Confirmation */
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner border border-emerald-200">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold rounded-full text-xs uppercase tracking-wider">
                Escrow Deposit Confirmed
              </span>
              <h4 className="text-xl font-extrabold text-slate-900 mt-2">
                ₹{receipt.amount.toLocaleString('en-IN')} Locked in Escrow
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Contract status updated to <strong className="text-emerald-700">Signed</strong>. Freight dispatch is now activated!
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction Ref:</span>
                <span className="font-mono font-bold text-slate-800">{receipt.txnRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contract / Crop:</span>
                <span className="font-semibold text-slate-800">{contract.crop} ({contract.quantity * 10} Qtl)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Beneficiary Farmer:</span>
                <span className="font-semibold text-slate-800">{contract.farmer_name || 'Farmer'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Remaining Balance (70%):</span>
                <span className="font-mono font-bold text-slate-700">₹{remainingAmount.toLocaleString('en-IN')} (Due on Delivery)</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Timestamp:</span>
                <span className="text-slate-600">{receipt.date} at {receipt.timestamp}</span>
              </div>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-2 text-left">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <p className="text-xs text-indigo-900 font-medium">
                Produce is being loaded at farm gate. Driver Jagtar Singh (PB-10-AZ-9981) has been assigned for transit.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onTrackDispatch) {
                    onTrackDispatch(receipt.delivery || null);
                  }
                  onClose();
                }}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Track Location of Dispatch &rarr;</span>
              </button>
            </div>
          </div>
        ) : (
          /* Payment Form */
          <form onSubmit={handleConfirmPayment} className="p-5 sm:p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Amount Breakdown Card */}
            <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-2.5">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-600 font-medium">Total Contract Consideration:</span>
                <span className="text-sm font-bold text-slate-800 font-mono">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between items-baseline pt-2 border-t border-emerald-200">
                <div>
                  <span className="text-sm font-extrabold text-emerald-950 block">
                    30% Advance Escrow Required:
                  </span>
                  <span className="text-[10px] text-emerald-700">
                    Mandatory advance payment before dispatch initiates
                  </span>
                </div>
                <span className="text-xl font-black text-emerald-900 font-mono">
                  ₹{advanceAmount.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 border-t border-emerald-100">
                <span>Remaining 70% Balance (₹{remainingAmount.toLocaleString('en-IN')}):</span>
                <span className="font-semibold text-slate-700">Released upon weighbridge check</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-2">
                Select Payment Mode (Simulated / Test Escrow Gateway)
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                    paymentMethod === 'upi'
                      ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-emerald-700" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Instant UPI</p>
                    <p className="text-[10px] text-slate-400">GPay, PhonePe, Paytm</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                    paymentMethod === 'netbanking'
                      ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Building className="w-4 h-4 text-emerald-700" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Net Banking</p>
                    <p className="text-[10px] text-slate-400">SBI, HDFC, PNB Agri</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Corporate Card</p>
                    <p className="text-[10px] text-slate-400">Visa / Mastercard</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('instant')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                    paymentMethod === 'instant'
                      ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">⚡ 1-Click Demo Pay</p>
                    <p className="text-[10px] text-slate-400">Direct Escrow Deposit</p>
                  </div>
                </button>
              </div>
            </div>

            {paymentMethod === 'upi' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  UPI Virtual Payment Address (VPA)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            )}

            {/* Escrow Guarantee Note */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-600 leading-relaxed">
                <strong className="text-slate-800">State APMC Escrow Protection:</strong> Funds remain securely locked in platform escrow until the truck arrives at your processing intake weighbridge and quality is verified.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {submitting ? (
                  <span>Securing Escrow Deposit...</span>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Confirm 30% Payment (₹{advanceAmount.toLocaleString('en-IN')})</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
