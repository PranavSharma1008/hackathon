import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  FileText,
  CheckCircle2,
  Clock,
  Truck,
  CheckCheck,
  ShieldCheck,
  Building2,
  Tractor,
  PenTool,
  Printer,
  Copy,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Sparkles,
  MapPin,
  Calendar,
  Radio,
  Gauge,
  Thermometer,
  Lock,
  Stamp
} from 'lucide-react';
import { api } from '../utils/api';
import SignaturePad from '../components/SignaturePad';

export default function ContractTrackingView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [contract, setContract] = useState(null);
  const [contractsList, setContractsList] = useState([]);
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [updatingDelivery, setUpdatingDelivery] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  useEffect(() => {
    loadAllContracts();
  }, []);

  useEffect(() => {
    if (id) {
      loadContractDetails(id);
    }
  }, [id]);

  async function loadAllContracts() {
    try {
      const res = await api.getContracts();
      if (res.data && res.data.length > 0) {
        setContractsList(res.data);
        if (!id) {
          navigate(`/contract/${res.data[0].id}`, { replace: true });
        }
      }
    } catch (err) {
      console.error('Failed to load contracts list', err);
    }
  }

  async function loadContractDetails(contractId) {
    setLoading(true);
    setError(null);
    try {
      const contractRes = await api.getContractById(contractId);
      setContract(contractRes.data);

      const delRes = await api.getDeliveries();
      const match = (delRes.data || []).find((d) => d.contract_id === contractId);
      setDelivery(match || null);
    } catch (err) {
      setError(err.message || 'Failed to load contract details');
    } finally {
      setLoading(false);
    }
  }

  // Handle signature confirmation from SignaturePad
  async function handleConfirmSignature(sigData) {
    if (!contract) return;
    setSigning(true);
    setError(null);
    try {
      const res = await api.signContract(contract.id);
      setContract(res.data);
      setShowSignModal(false);
      setActionSuccess('Contract successfully digitally attested & signed!');
      setTimeout(() => setActionSuccess(null), 3500);

      // Initialize delivery milestone if none exists
      if (!delivery) {
        const delRes = await api.trackDelivery({
          contract_id: contract.id,
          status: 'Scheduled',
          checkpoint: 'Contract executed. Farm pre-dispatch inspection verified.',
          notes: 'Logistics dispatch order sent to regional agro transport terminal.',
        });
        setDelivery(delRes.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to sign contract');
    } finally {
      setSigning(false);
    }
  }

  // Advance Delivery Milestone
  async function handleAdvanceMilestone(targetStatus, checkpointDesc, notesDesc) {
    if (!contract) return;
    setUpdatingDelivery(true);
    setError(null);
    try {
      const payload = {
        contract_id: contract.id,
        delivery_id: delivery?.id,
        status: targetStatus,
        checkpoint: checkpointDesc,
        notes: notesDesc,
      };

      const res = await api.trackDelivery(payload);
      setDelivery(res.data);
      setActionSuccess(`Delivery milestone successfully updated to '${targetStatus}'!`);
      setTimeout(() => setActionSuccess(null), 3500);

      // If delivered, fire confetti!
      if (targetStatus === 'Delivered') {
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.5 },
          colors: ['#10b981', '#22c55e', '#3b82f6', '#f59e0b'],
        });
      }

      // Reload contract to reflect Fulfilled status if delivered
      const updatedContract = await api.getContractById(contract.id);
      setContract(updatedContract.data);
    } catch (err) {
      setError(err.message || 'Failed to update delivery milestone');
    } finally {
      setUpdatingDelivery(false);
    }
  }

  function handleCopyContractText() {
    if (!contract) return;
    navigator.clipboard.writeText(contract.contract_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePrintContract() {
    window.print();
  }

  const isStep1Complete =
    contract?.status === 'Accepted' || contract?.status === 'Signed' || contract?.status === 'Fulfilled';
  const isStep2Complete =
    isStep1Complete &&
    (delivery?.status === 'In Transit' ||
      delivery?.status === 'Delivered' ||
      (delivery?.tracking_notes && delivery.tracking_notes.length >= 1));
  const isStep3Complete = delivery?.status === 'In Transit' || delivery?.status === 'Delivered';
  const isStep4Complete = delivery?.status === 'Delivered' || contract?.status === 'Fulfilled';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Top Breadcrumb & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase text-emerald-700 tracking-wider mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Smart Legal Agreement & Supply Chain Escrow
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            Contract & Logistics Tracker
          </h1>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 text-emerald-800 text-sm flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{actionSuccess}</span>
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 text-rose-800 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4" />
          <div className="font-bold text-slate-800 text-lg">Retrieving Contract & Logistics Records...</div>
        </div>
      )}

      {!loading && !contract && (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-lg">Contract Not Found</h3>
          <p className="text-xs text-slate-500 mt-1">Please select an existing contract from the dropdown or generate one in the Consumer Portal.</p>
        </div>
      )}

      {!loading && contract && (
        <>
          {/* Visual Step-by-Step Progress Tracker Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-emerald-600" />
                  Supply Chain Execution Lifecycle
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time milestone progression with automatic escrow fulfillment upon weighbridge acceptance
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className={`px-3.5 py-1 text-xs font-extrabold uppercase rounded-full border shadow-2xs ${
                  contract.status === 'Fulfilled'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : contract.status === 'Signed'
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}>
                  ● Contract {contract.status}
                </span>
              </div>
            </div>

            {/* Stepper Bar */}
            <div className="relative">
              <div className="hidden sm:block absolute top-1/2 left-8 right-8 h-1.5 bg-slate-200 -translate-y-1/2 z-0 rounded-full" />
              <div
                className="hidden sm:block absolute top-1/2 left-8 h-1.5 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-500 rounded-full"
                style={{
                  width: isStep4Complete
                    ? '90%'
                    : isStep3Complete
                    ? '65%'
                    : isStep2Complete
                    ? '35%'
                    : isStep1Complete
                    ? '10%'
                    : '0%',
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative z-10">
                {/* Step 1: Contract Signed */}
                <div className={`p-4 rounded-xl border text-center transition-all ${
                  isStep1Complete
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}>
                  <div className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center font-bold text-sm mb-2 ${
                    isStep1Complete ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isStep1Complete ? <CheckCheck className="w-5 h-5" /> : '1'}
                  </div>
                  <div className="font-bold text-xs uppercase">1. Farmer Acceptance</div>
                  <div className="text-[11px] mt-0.5 opacity-80 font-medium">
                    {isStep1Complete ? 'Accepted & Agreement Active' : 'Awaiting Farmer Acceptance'}
                  </div>
                </div>

                {/* Step 2: Harvest & QA Prep */}
                <div className={`p-4 rounded-xl border text-center transition-all ${
                  isStep2Complete
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}>
                  <div className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center font-bold text-sm mb-2 ${
                    isStep2Complete ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isStep2Complete ? <CheckCheck className="w-5 h-5" /> : '2'}
                  </div>
                  <div className="font-bold text-xs uppercase">2. Harvest & QA Prep</div>
                  <div className="text-[11px] mt-0.5 opacity-80 font-medium">
                    {isStep2Complete ? 'Moisture & Grade Validated' : 'Cultivation Lead Time'}
                  </div>
                </div>

                {/* Step 3: In Transit */}
                <div className={`p-4 rounded-xl border text-center transition-all ${
                  isStep3Complete
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}>
                  <div className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center font-bold text-sm mb-2 ${
                    isStep3Complete ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isStep3Complete ? <CheckCheck className="w-5 h-5" /> : '3'}
                  </div>
                  <div className="font-bold text-xs uppercase">3. In Transit</div>
                  <div className="text-[11px] mt-0.5 opacity-80 font-medium">
                    {isStep3Complete ? 'Highway Freight Active' : 'Pending Farm Gate Dispatch'}
                  </div>
                </div>

                {/* Step 4: Delivered & Verified */}
                <div className={`p-4 rounded-xl border text-center transition-all ${
                  isStep4Complete
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-950 shadow-md ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}>
                  <div className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center font-bold text-sm mb-2 ${
                    isStep4Complete ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isStep4Complete ? <CheckCheck className="w-5 h-5" /> : '4'}
                  </div>
                  <div className="font-bold text-xs uppercase">4. Delivered & Verified</div>
                  <div className="text-[11px] mt-0.5 opacity-80 font-medium">
                    {isStep4Complete ? 'Weighbridge Certified & Escrow Released' : 'Weighbridge Intake Pending'}
                  </div>
                </div>
              </div>
            </div>

            {/* Logistics & Escrow Operational Controls */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-xs text-slate-600">
                <span className="font-bold text-slate-900">Logistics & Escrow Operations:</span> Manage and verify delivery milestones across the active fulfillment lifecycle.
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {contract.status === 'Pending' && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await api.serveContract(contract.id, 'farmer');
                          setActionSuccess('Procurement offer accepted! Forward contract is now active.');
                          await loadContractDetails(contract.id);
                        } catch (err) {
                          setError(err.message || 'Failed to accept contract');
                        }
                      }}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>✓ Accept Procurement Offer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSignModal(true)}
                      className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span>✍️ Digital Signature Pad</span>
                    </button>
                  </div>
                )}

                {contract.status !== 'Pending' && !isStep3Complete && (
                  <button
                    type="button"
                    onClick={() =>
                      handleAdvanceMilestone(
                        'In Transit',
                        'Dispatched from farm gate via Heavy Freight Carrier PB-10-CZ-4421',
                        'Pre-dispatch Mandi inspection approved: Sharbati Wheat, moisture 10.8%, purity 99.1% verified.'
                      )
                    }
                    disabled={updatingDelivery}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5 active:scale-95 transition-all"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>{updatingDelivery ? 'Updating...' : 'Record Highway Dispatch & Activate GPS Freight'}</span>
                  </button>
                )}

                {contract.status !== 'Pending' && isStep3Complete && !isStep4Complete && (
                  <button
                    type="button"
                    onClick={() =>
                      handleAdvanceMilestone(
                        'Delivered',
                        'Weighbridge inspection complete. Official weighment slip generated and Mandi QA Lab verified.',
                        'Produce purity 99.2% confirmed. Final 80% escrow settlement disbursed via DBT to farmer.'
                      )
                    }
                    disabled={updatingDelivery}
                    className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5 active:scale-95 transition-all"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>{updatingDelivery ? 'Updating...' : 'Confirm Weighbridge Receipt & Disburse Escrow'}</span>
                  </button>
                )}

                {isStep4Complete && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/80 px-3 py-1.5 rounded-lg border border-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Lifecycle Completed & Escrow Released</span>
                  </div>
                )}
              </div>
            </div>

            {/* Live Freight Telemetry Console (When in Transit or Delivered) */}
            {(isStep3Complete || isStep4Complete) && (
              <div className="bg-slate-900 rounded-xl p-4 text-white border border-slate-800">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2 mb-3">
                  <span className="font-bold flex items-center gap-2 text-emerald-400">
                    <Radio className="w-4 h-4 animate-pulse" /> Live Telemetry Feed &bull; Carrier PB-10-CZ-4421 (Tata LPT 2818)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">GPS PING: ACTIVE</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400">Speed / Velocity</div>
                    <div className="text-sm font-extrabold text-white flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5 text-blue-400" /> {isStep4Complete ? '0 km/h (Weighbridge Dock)' : '58.4 km/h (GT Road NH-44)'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Cargo Temperature</div>
                    <div className="text-sm font-extrabold text-white flex items-center gap-1">
                      <Thermometer className="w-3.5 h-3.5 text-emerald-400" /> 18.2 °C (Ventilated Grain Hold)
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Logistics Driver</div>
                    <div className="text-sm font-extrabold text-white">Gurmeet Singh (+91-98765-88990)</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Transit Status & ETA</div>
                    <div className="text-sm font-extrabold text-emerald-400">
                      {isStep4Complete ? 'Unloaded at Silo Gate 2' : 'ETA: 35 mins (Khanna -> Ludhiana Hub)'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tracking History Timeline */}
            {delivery && delivery.tracking_notes && delivery.tracking_notes.length > 0 && (
              <div className="border-t border-slate-100 pt-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Chronological Checkpoint Audit Log:
                </div>
                <div className="space-y-2">
                  {delivery.tracking_notes.map((event, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100"
                    >
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900">{event.checkpoint}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {event.notes && <p className="text-slate-500 mt-0.5">{event.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Key Terms Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <div className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                Buyer / Consumer
              </div>
              <div className="text-base font-extrabold text-slate-900">{contract.processor_name || 'Agro Consumer'}</div>
              <div className="text-xs text-slate-500">ID: {contract.processor_id}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <div className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
                <Tractor className="w-3.5 h-3.5 text-green-600" />
                Seller / Farmer
              </div>
              <div className="text-base font-extrabold text-slate-900">{contract.farmer_name || 'Farmer'}</div>
              <div className="text-xs text-slate-500">ID: {contract.farmer_id}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <div className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Agreed Value & Volume
              </div>
              <div className="text-base font-extrabold text-emerald-700">
                ₹{Number(contract.agreed_price).toLocaleString('en-IN')} INR
              </div>
              <div className="text-xs text-slate-600 font-medium">
                {contract.quantity * 10} Quintals ({contract.quantity} MT) &bull; {contract.crop}
              </div>
              <div className="text-[10px] text-slate-400">
                (1 Quintal = 100 kg | {(Number(contract.quantity) * 1000).toLocaleString('en-IN')} kg)
              </div>
            </div>
          </div>

          {/* Signature Modal */}
          {showSignModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="max-w-lg w-full">
                <SignaturePad
                  signerName={contract.farmer_name}
                  onConfirmSignature={handleConfirmSignature}
                  isSubmitting={signing}
                />
                <div className="text-center mt-2">
                  <button
                    type="button"
                    onClick={() => setShowSignModal(false)}
                    className="text-xs text-slate-300 hover:text-white underline cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Formal AI-Generated Contract Document Preview Box */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Box Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-lg text-emerald-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    AI-Generated Contract Document (Ref: {contract.id})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Bilateral Forward Procurement Agreement & Escrow Protocol
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintContract}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyContractText}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                </button>

                {contract.status === 'Pending' ? (
                  <button
                    type="button"
                    onClick={() => setShowSignModal(true)}
                    disabled={signing}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>✍️ Sign Contract</span>
                  </button>
                ) : (
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-700 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Signed & Attested</span>
                  </span>
                )}
              </div>
            </div>

            {/* Document Content Box with Stamp Watermark */}
            <div className="p-6 bg-slate-950 text-slate-200 overflow-x-auto relative">
              {contract.status !== 'Pending' && (
                <div className="absolute top-12 right-12 border-4 border-emerald-500/40 text-emerald-400/40 px-6 py-2 rounded-xl rotate-12 font-mono font-extrabold text-xl uppercase tracking-widest pointer-events-none select-none">
                  ✓ EXECUTED & ATTESTED
                </div>
              )}
              <pre className="font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-emerald-300/90 font-light selection:bg-emerald-800 selection:text-white">
                {contract.contract_text}
              </pre>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
