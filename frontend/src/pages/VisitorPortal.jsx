import React, { useState, useEffect } from 'react';
import {
  User,
  Lock,
  ShoppingBag,
  Tractor,
  Building2,
  TrendingUp,
  MapPin,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle,
  Warehouse,
  Search,
  Filter,
  Clock,
  CheckCheck,
  X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { matchProduceWithAi } from '../utils/aiCropSynonyms';

const MANDI_RATES = [
  { crop: 'Sharbati Wheat (Grade A)', mandi: 'Khanna Mandi, PB', price: 2550, change: '+₹35' },
  { crop: 'Basmati Paddy 1121', mandi: 'Karnal Mandi, HR', price: 3950, change: '+₹60' },
  { crop: 'Soybean (Yellow Seed)', mandi: 'Indore Mandi, MP', price: 4420, change: '-₹20' },
  { crop: 'Kufri Chipsona Potato', mandi: 'Agra Mandi, UP', price: 1650, change: '+₹15' },
  { crop: 'Mustard (High Oil 42%)', mandi: 'Alwar Mandi, RJ', price: 5650, change: '+₹80' },
];

export default function VisitorPortal() {
  const navigate = useNavigate();
  const {
    user,
    isVisitor,
    isAuthenticated,
    isAdmin,
    isProcessor,
    isTrustedProcessor,
    isFarmer,
    refreshUser
  } = useAuth();

  const [storeItems, setStoreItems] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [processors, setProcessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Access state
  const hasActiveAccess = Boolean(isAdmin || isProcessor || isFarmer);
  const hasPendingRequest = Boolean(user?.requested_role);

  // Order Placement Modal state (For Processors & Admins)
  const [selectedProduce, setSelectedProduce] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderSuccessMessage, setOrderSuccessMessage] = useState(null);
  const [orderErrorMessage, setOrderErrorMessage] = useState(null);

  // Info Modal state (For Farmers or Visitors with pending requests)
  const [infoModal, setInfoModal] = useState(null); // { title: string, message: string }

  // Restricted Access Request Modal (For fresh Visitors without requests)
  const [showRestrictedModal, setShowRestrictedModal] = useState(false);
  const [upgradeSubmitted, setUpgradeSubmitted] = useState(false);
  const [upgradeRole, setUpgradeRole] = useState('processor');
  const [upgradeError, setUpgradeError] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [storeRes, farmersRes, procRes] = await Promise.all([
          fetch('/api/store/marketplace').then((r) => r.json()),
          api.getFarmers(),
          api.getProcessors()
        ]);
        setStoreItems(storeRes.data || []);
        setFarmers(farmersRes.data || []);
        setProcessors(procRes.data || []);
      } catch (err) {
        console.error('Failed to load explorer data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  function handleAttemptOrder(item) {
    if (isProcessor || isAdmin) {
      // Verified Buyer / Processor -> Open actual Order Placement Modal
      setSelectedProduce(item);
      setOrderQuantity(item.quantity_quintals);
      setOrderNotes('');
      setOrderErrorMessage(null);
    } else if (isFarmer) {
      // Logged in as Farmer -> Purchasing is for consumers
      setInfoModal({
        title: 'Cultivator Account Notice',
        message: `You are logged in as a verified Cultivator Farmer (${user?.name || 'Farmer'}). Material purchasing is designated for verified Bulk Consumers & Buyers. To list your own harvested produce for corporate buyers, please manage your inventory in the Farmer Portal.`
      });
    } else if (hasPendingRequest) {
      // Visitor with pending request -> Explain status
      setInfoModal({
        title: 'Trading Access Request Under Review',
        message: `You have already requested ${user.requested_role === 'farmer' ? 'Cultivator Farmer' : 'Bulk Consumer'} trading access for ${user.email}. The Platform Administrator is reviewing your credentials. Once approved, you will be able to order produce directly.`
      });
    } else {
      // Visitor without pending request -> Open modal to apply for single role
      setShowRestrictedModal(true);
    }
  }

  async function handleConfirmOrder(e) {
    e.preventDefault();
    if (!selectedProduce || !user) return;
    setSubmittingOrder(true);
    setOrderErrorMessage(null);
    try {
      const res = await fetch('/api/store/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_item_id: selectedProduce.id,
          buyer_user_id: user.id,
          buyer_name: user.name || 'Consumer Sourcing Desk',
          buyer_email: user.email,
          buyer_role: user.role || 'processor',
          quantity_quintals: Number(orderQuantity),
          offered_price_per_quintal: Number(selectedProduce.price_per_quintal),
          notes: orderNotes || `Direct procurement order from ${user.name || 'Consumer Desk'}`
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit trade order request');
      }

      const targetContractId = data.contract_id || (data.data && data.data.contract_id);

      setOrderSuccessMessage(
        `Trade procurement request for ${orderQuantity} Qtl of ${selectedProduce.crop_name} successfully dispatched to ${selectedProduce.farmer_name}! Opening Contract & Logistics Tracker...`
      );
      setSelectedProduce(null);

      // Transition immediately to the next part: Contract & Logistics Tracker!
      setTimeout(() => {
        if (targetContractId) {
          navigate(`/contract/${targetContractId}`);
        } else {
          navigate('/contract');
        }
      }, 1000);
    } catch (err) {
      setOrderErrorMessage(err.message || 'Failed to submit order');
    } finally {
      setSubmittingOrder(false);
    }
  }

  async function handleRequestUpgrade(e) {
    e.preventDefault();
    setUpgradeError(null);
    try {
      const res = await fetch('/api/auth/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          email: user?.email,
          requested_role: upgradeRole
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit access request');
      }

      setUpgradeSubmitted(true);
      if (refreshUser) {
        await refreshUser();
      }
      setTimeout(() => {
        setShowRestrictedModal(false);
        setUpgradeSubmitted(false);
      }, 3000);
    } catch (err) {
      setUpgradeError(err.message || 'Failed to submit request');
    }
  }

  const filteredProduce = storeItems.filter((item) => {
    return matchProduceWithAi(item, searchTerm).matches;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 space-y-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Success / Error Notification Banners */}
        {orderSuccessMessage && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-emerald-800 text-sm flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-semibold">{orderSuccessMessage}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => navigate('/contract')}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Go to Tracker &rarr;
              </button>
              <button
                type="button"
                onClick={() => setOrderSuccessMessage(null)}
                className="text-emerald-600 hover:text-emerald-900 cursor-pointer text-xs font-bold"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Top Hero Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden border border-emerald-900/40">
          <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-4">
            {/* Status Chip */}
            {isAdmin ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                Super Admin Master Control
              </div>
            ) : isProcessor ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                Industrial Procurement Desk &bull; Verified Consumer
              </div>
            ) : isFarmer ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
                <Tractor className="w-3.5 h-3.5 text-emerald-400" />
                Verified Cultivator Farmer &bull; Seller Account
              </div>
            ) : hasPendingRequest ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Trading Access Pending: {user?.requested_role === 'farmer' ? 'Cultivator Farmer' : 'Bulk Consumer'}
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-500/20 border border-slate-500/30 text-slate-300 text-xs font-semibold uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-slate-300" />
                Visitor Explorer Mode &bull; Read-Only
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Indian Contract Farming &amp; Produce Directory
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {isProcessor ? (
                <>
                  Explore available farm produce silos, verified grower lots, and real-time mandi benchmarks. Place direct orders or initiate procurement contracts below.
                </>
              ) : isFarmer ? (
                <>
                  Track live mandi rates across regional agricultural clusters, monitor corporate consumer demands, and inspect competitor asking rates.
                </>
              ) : isAdmin ? (
                <>
                  Manage registered farmlands, monitor industrial buyer demands, and oversee live produce inventories across the Punjab &amp; North India corridor.
                </>
              ) : hasPendingRequest ? (
                <>
                  Explore live produce stores, registered farmlands, and mandi pricing.
                  <span className="block mt-1.5 text-amber-300 font-medium">
                    Your application for {user?.requested_role === 'farmer' ? 'Cultivator Farmer' : 'Bulk Consumer'} trading access has been submitted to the Platform Admin (codekalesh@gmail.com). You will be able to order produce once reviewed.
                  </span>
                </>
              ) : (
                <>
                  Explore live produce stores, registered farmlands, mandi pricing indexes, and industrial consumer procurement demands.
                  <span className="block mt-1.5 text-amber-300 font-medium">
                    Note: Material ordering and contract execution require a verified commercial account granted by the Platform Admin.
                  </span>
                </>
              )}
            </p>

            {/* ONLY render Apply button if user has NO active access AND NO pending request */}
            {!hasActiveAccess && !hasPendingRequest && (
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setShowRestrictedModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition"
                >
                  <Sparkles className="w-4 h-4" />
                  Apply for Farmer or Consumer Trading Access
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Live Mandi Rates Ticker */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Live Indian Mandi Benchmark Rates (₹/Quintal)
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Updated today from Agmarknet</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {MANDI_RATES.map((m, idx) => (
              <div key={idx} className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-800 truncate">{m.crop}</div>
                  <div className="text-[10px] text-slate-500 truncate">{m.mandi}</div>
                </div>
                <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-slate-200/60">
                  <div className="text-sm font-extrabold text-slate-900">
                    ₹{m.price.toLocaleString('en-IN')}
                    <span className="text-[10px] font-normal text-slate-500">/Qtl</span>
                  </div>
                  <span className={`text-[10px] font-bold ${m.change.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {m.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Produce Marketplace Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Warehouse className="w-6 h-6 text-emerald-600" />
                Available Farmer Produce Silos &amp; Inventories
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Real farm lots with pricing set directly by verified growers (₹ per Quintal).
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600" />
              <input
                type="text"
                placeholder="Search crops, local tags (makka, kanak, aloo)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400 font-medium">Loading produce catalog...</div>
          ) : filteredProduce.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
              No produce matching your search criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProduce.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-300 hover:shadow-md transition-all p-5 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-block px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] font-semibold rounded-md mb-1">
                          {item.grade}
                        </span>
                        <h3 className="font-bold text-slate-900 text-base">{item.crop_name}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Tractor className="w-3.5 h-3.5 text-slate-400" /> {item.farmer_name}
                        </p>
                      </div>
                      <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-[10px] font-medium shrink-0">
                        {item.storage_type}
                      </span>
                    </div>

                    {/* Vernacular Tags & AI Match Indicator */}
                    {item.local_names && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.local_names.split(',').map((tag, idx) => {
                          const cleanTag = tag.trim();
                          const isMatched = searchTerm.trim() && cleanTag.toLowerCase().includes(searchTerm.toLowerCase().trim());
                          return (
                            <span
                              key={idx}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                isMatched
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold ring-1 ring-emerald-400'
                                  : 'bg-slate-50 text-slate-600 border-slate-200/80'
                              }`}
                            >
                              #{cleanTag}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Quantity</span>
                        <span className="font-bold text-slate-800">{item.quantity_quintals} Quintals</span>
                        <span className="text-[10px] text-slate-400 block">({(item.quantity_quintals / 10).toFixed(1)} MT)</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Asking Rate</span>
                        <span className="font-extrabold text-emerald-700">₹{item.price_per_quintal.toLocaleString('en-IN')}</span>
                        <span className="text-[10px] text-slate-400 block">per Quintal</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Lot Valuation</span>
                      <span className="text-xs font-bold text-slate-800">
                        ₹{(item.total_value_inr / 100000).toFixed(2)} Lakhs
                      </span>
                    </div>

                    {/* Order action button */}
                    <button
                      type="button"
                      onClick={() => handleAttemptOrder(item)}
                      className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border ${
                        isProcessor || isAdmin
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border-slate-200'
                      }`}
                    >
                      {isProcessor || isAdmin ? (
                        <ShoppingBag className="w-3.5 h-3.5 text-white" />
                      ) : isFarmer ? (
                        <Info className="w-3.5 h-3.5 text-slate-500" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>
                        {isProcessor || isAdmin
                          ? 'Order Material'
                          : isFarmer
                          ? 'Cultivator View'
                          : 'Order Material'}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Directory Highlights (Farmers & Processors) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Registered Farmlands */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base">
                <Tractor className="w-5 h-5 text-emerald-600" />
                Verified Farmlands ({farmers.length})
              </h3>
              <span className="text-xs text-slate-500">Cultivable Clusters</span>
            </div>
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
              {farmers.map((f) => (
                <div key={f.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-800">{f.name}</div>
                    <div className="text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" /> {f.location?.address || 'Punjab Agri Belt'}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-700">{f.total_acreage} Acres</span>
                    <span className="block text-[10px] text-slate-400">{f.soil_type} Soil</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Processor Sourcing Feed */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base">
                <Building2 className="w-5 h-5 text-emerald-600" />
                Consumer Procurement Feeds ({processors.length})
              </h3>
              <span className="text-xs text-slate-500">Corporate Buyers</span>
            </div>
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
              {processors.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-800">{p.company_name}</div>
                    <div className="text-slate-500">
                      Crop: <span className="font-medium text-slate-700">{p.required_crop} ({p.required_grade})</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">{p.quantity_needed_tons * 10} Qtl</span>
                    <span className="block text-[10px] text-emerald-600 font-semibold">Verified Buyer</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 1. Verified Trade Order Placement Modal (For Processors & Admins) */}
      {selectedProduce && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedProduce(null);
          }}
        >
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                    Procure Produce Batch
                  </h3>
                  <p className="text-xs text-slate-500">
                    Direct Trade Order &bull; Sourcing Desk
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduce(null)}
                aria-label="Close modal"
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-all cursor-pointer border border-slate-200 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Produce Summary Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                  {selectedProduce.crop_name}
                </span>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs">
                  {selectedProduce.grade}
                </span>
              </div>
              <div className="text-slate-600">
                Grower: <strong>{selectedProduce.farmer_name}</strong> &bull; Storage: {selectedProduce.storage_type}
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Available Stock</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {selectedProduce.quantity_quintals} Quintals
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    ({(selectedProduce.quantity_quintals / 10).toFixed(1)} MT)
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Asking Rate</span>
                  <span className="font-extrabold text-emerald-700 text-sm">
                    ₹{selectedProduce.price_per_quintal.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-400 block">per Quintal</span>
                </div>
              </div>
            </div>

            {orderErrorMessage && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{orderErrorMessage}</span>
              </div>
            )}

            <form onSubmit={handleConfirmOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Order Quantity (Quintals)
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedProduce.quantity_quintals}
                  required
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  = {orderQuantity ? (Number(orderQuantity) / 10).toFixed(1) : 0} Metric Tons &bull; Max Available: {selectedProduce.quantity_quintals} Quintals
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Delivery Destination &amp; Silo Intake Instructions
                </label>
                <textarea
                  rows="2"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Delivery at Ludhiana Industrial Complex Silo Gate 2. Pre-intake moisture test required."
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              {/* Total Calculation */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-emerald-800 block">Total Consideration</span>
                  <span className="text-xs text-emerald-700">
                    {orderQuantity || 0} Quintals &times; ₹{selectedProduce.price_per_quintal.toLocaleString('en-IN')}/Qtl
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base sm:text-lg font-extrabold text-emerald-900">
                    ₹{(Number(orderQuantity || 0) * Number(selectedProduce.price_per_quintal || 0)).toLocaleString('en-IN')} INR
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProduce(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOrder}
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{submittingOrder ? 'Submitting Order...' : 'Dispatch Trade Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Explanatory Info Modal (For Farmer or Pending Visitor) */}
      {infoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setInfoModal(null);
          }}
        >
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                aria-label="Close modal"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-all cursor-pointer border border-slate-200 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <Info className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                {infoModal.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {infoModal.message}
              </p>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Restricted Action & Upgrade Request Modal (For Fresh Visitors with no pending request) */}
      {showRestrictedModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRestrictedModal(false);
          }}
        >
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Trading Access Application
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRestrictedModal(false)}
                aria-label="Close modal"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-all cursor-pointer border border-slate-200 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center space-y-2">
              <p className="text-xs text-slate-600 leading-relaxed">
                Viewing produce silos is open to everyone, but ordering material or dispatching legal supply contracts requires a single designated commercial account.
              </p>
            </div>

            {upgradeError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{upgradeError}</span>
              </div>
            )}

            {upgradeSubmitted ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-emerald-800">Access Request Submitted!</p>
                <p className="text-[11px] text-emerald-700">
                  Platform Admin (codekalesh@gmail.com) has received your request. Once verified, your account will be granted access.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestUpgrade} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Your Single Platform Role
                  </label>
                  <select
                    value={upgradeRole}
                    onChange={(e) => setUpgradeRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="processor">Bulk Consumer Account (Procure harvest batches, post demand)</option>
                    <option value="farmer">Farmer / Cultivator Account (Sell produce, sign contracts)</option>
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    *Each account is granted one verified role on the platform.
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRestrictedModal(false)}
                    className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    Request Admin Access
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
