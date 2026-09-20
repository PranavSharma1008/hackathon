import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Building2,
  Sparkles,
  MapPin,
  TrendingUp,
  Scale,
  Calendar,
  DollarSign,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  Layers,
  ChevronRight,
  Zap,
  Compass,
  LayoutGrid,
  Info,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Store,
  Warehouse,
  IndianRupee,
  Package,
  Phone,
  ArrowUpRight,
  RefreshCw,
  Lock,
  Power,
  FileText,
  Truck,
  Eye,
  Check,
  X,
  User,
  ExternalLink,
  Plus,
  FileCheck,
  CreditCard,
  Navigation
} from 'lucide-react';
import { api } from '../utils/api';
import CompatibilityBadge from '../components/CompatibilityBadge';
import GoogleMap from '../components/GoogleMap';
import { useAuth } from '../context/AuthContext';
import { matchProduceWithAi } from '../utils/aiCropSynonyms';
import ReportViewerModal from '../components/ReportViewerModal';
import AdvancePaymentModal from '../components/AdvancePaymentModal';
import DispatchTrackingModal from '../components/DispatchTrackingModal';
import EscrowBillModal from '../components/EscrowBillModal';

export default function ProcessorDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const demandParam = searchParams.get('demand');
  const tabParam = searchParams.get('tab');

  const {
    user,
    login,
    register,
    logout,
    isAuthenticated,
    isTrustedProcessor,
    isProcessor,
    isAdmin,
    providerApp,
    submitProviderApplication,
    refreshUser,
    isServiceActive,
    toggleServiceStatus,
    isVisitor,
    updateUserProfile
  } = useAuth();

  // Active subtab for verified processor: 'marketplace', 'matching', 'contracts', 'deliveries', 'demands', 'profile'
  const [activeSubTab, setActiveSubTab] = useState(tabParam || 'marketplace');
  const [previewMode, setPreviewMode] = useState(false);

  // Sync tab with URL search parameter (?tab=...)
  useEffect(() => {
    if (tabParam && tabParam !== activeSubTab) {
      setActiveSubTab(tabParam);
    }
  }, [tabParam]);

  const handleTabClick = (tabKey) => {
    setActiveSubTab(tabKey);
    const basePath = location.pathname.startsWith('/processor') ? '/processor' : '/consumer';
    navigate(`${basePath}?tab=${tabKey}`, { replace: true });
  };

  const handleTabChange = handleTabClick;

  // Processors list & selected active demand
  const [processors, setProcessors] = useState([]);
  const [selectedProcessorId, setSelectedProcessorId] = useState('');
  const [matches, setMatches] = useState([]);
  const [engineMetadata, setEngineMetadata] = useState(null);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [contractGeneratingId, setContractGeneratingId] = useState(null);
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [selectedFarmId, setSelectedFarmId] = useState(null);
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'list' | 'map'
  const [minScoreFilter, setMinScoreFilter] = useState(0);

  // Farmer Stores / Marketplace State
  const [marketItems, setMarketItems] = useState([]);
  const [loadingMarket, setLoadingMarket] = useState(false);
  const [searchCrop, setSearchCrop] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterStorage, setFilterStorage] = useState('');

  // Procurement Offer to Farmer Modal State
  const [procureModalItem, setProcureModalItem] = useState(null);
  const [procureQuantity, setProcureQuantity] = useState(0);
  const [procureNotes, setProcureNotes] = useState('');
  const [procureSubmitting, setProcureSubmitting] = useState(false);
  const [sentRequestIds, setSentRequestIds] = useState([]);
  const [selectedReportItem, setSelectedReportItem] = useState(null);

  // Live Vernacular and AI Filtered Market Items with Match-to-Top Ranking
  const displayMarketItems = useMemo(() => {
    let list = [...marketItems];

    if (searchCrop && searchCrop.trim()) {
      const query = searchCrop.trim().toLowerCase();

      const scored = list.map((item) => {
        const aiMatch = matchProduceWithAi(item, query);
        let score = 0;
        let matchedReason = null;

        const cropLower = (item.crop_name || '').toLowerCase();
        const farmerLower = (item.farmer_name || '').toLowerCase();
        const localNamesLower = (item.local_names || '').toLowerCase();
        const tags = item.tags || [];

        // 1. Exact match on crop name
        if (cropLower === query) {
          score = 100;
          matchedReason = item.crop_name;
        } else if (cropLower.includes(query)) {
          score = 80;
          matchedReason = item.crop_name;
        }
        // 2. Exact or partial tag match (e.g. #makka, #makki)
        else if (tags.some((t) => t.toLowerCase() === query)) {
          score = 95;
          matchedReason = `#${query}`;
        } else if (tags.some((t) => t.toLowerCase().includes(query))) {
          score = 85;
          matchedReason = `#${query}`;
        } else if (localNamesLower.includes(query)) {
          score = 75;
          matchedReason = `#${query}`;
        }
        // 3. AI Vernacular synonym match (e.g. makka -> Yellow Corn / Maize)
        else if (aiMatch.matches) {
          score = 70;
          matchedReason = aiMatch.matchedTag || 'Vernacular Match';
        }
        // 4. Farmer name match
        else if (farmerLower.includes(query)) {
          score = 50;
          matchedReason = item.farmer_name;
        }

        return { ...item, _matchScore: score, _matchedReason: matchedReason };
      });

      // Filter only matching items and SORT SO HIGHEST MATCH SCORE COMES TO THE TOP
      const matchingItems = scored.filter((item) => item._matchScore > 0);
      matchingItems.sort((a, b) => b._matchScore - a._matchScore);

      list = matchingItems;
    }

    if (filterMaxPrice) {
      const maxP = Number(filterMaxPrice);
      if (maxP > 0) {
        list = list.filter((item) => item.price_per_quintal <= maxP);
      }
    }

    if (filterStorage) {
      list = list.filter((item) => item.storage_type === filterStorage);
    }

    return list;
  }, [marketItems, searchCrop, filterMaxPrice, filterStorage]);

  // Active Contracts State
  const [contracts, setContracts] = useState([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [contractFilter, setContractFilter] = useState('all');
  const [signingContractId, setSigningContractId] = useState(null);
  const [advanceModalContract, setAdvanceModalContract] = useState(null);
  const [dispatchModalData, setDispatchModalData] = useState(null);
  const [viewingBillContract, setViewingBillContract] = useState(null);

  // Inbound Deliveries State
  const [deliveries, setDeliveries] = useState([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  const [updatingDeliveryId, setUpdatingDeliveryId] = useState(null);

  // Corporate Profile Form State
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    company_name: user?.name || 'AgroPure Flour Mills & Foods Ltd',
    phone: user?.phone || '+91-98765-00000',
    gst_number: '03AABCA1234F1Z8',
    fssai_license: '10019011000123',
    address: 'Industrial Focal Point, Ludhiana, Punjab',
    latitude: 30.9010,
    longitude: 75.8573,
    processing_capacity_tons: 800,
    target_crops: 'Wheat, Potato, Soybean'
  });

  // Provider Application Form State (For non-trusted users)
  const [appForm, setAppForm] = useState({
    company_name: '',
    phone: user?.phone || '+91-98765-00000',
    gst_number: '03AABCA1234F1Z8',
    fssai_license: '10019011000123',
    address: 'Industrial Focal Point, Ludhiana, Punjab',
    latitude: 30.9010,
    longitude: 75.8573,
    processing_capacity_tons: 800,
    target_crops: 'Wheat, Potato, Soybean'
  });
  const [submittingApp, setSubmittingApp] = useState(false);

  const farmRefs = useRef({});

  // Demand Form State
  const [formData, setFormData] = useState({
    company_name: user?.name || 'AgroPure Flour Mills & Foods Ltd',
    required_crop: 'Wheat',
    required_grade: 'Grade A',
    quantity_needed_tons: 50,
    max_distance_km: 100,
    deadline: '2026-11-30',
    target_price_per_ton: 24500, // ₹24,500/MT (₹2,450/quintal)
    address: 'Industrial Focal Point, Ludhiana, Punjab',
    latitude: 30.9010,
    longitude: 75.8573,
  });

  // Load processors, marketplace, contracts, deliveries on mount
  useEffect(() => {
    loadProcessors();
    loadMarketplace();
    loadContracts();
    loadDeliveries();
  }, []);

  // Handle URL query demand preset
  useEffect(() => {
    if (demandParam && processors.length > 0) {
      const match = processors.find((p) =>
        p.required_crop.toLowerCase().includes(demandParam.toLowerCase())
      );
      if (match) {
        setSelectedProcessorId(match.id);
        handleTabChange('matching');
      }
    }
  }, [demandParam, processors]);

  // When selected processor changes, fetch AI matches
  useEffect(() => {
    if (selectedProcessorId) {
      fetchMatches(selectedProcessorId);
    }
  }, [selectedProcessorId]);

  async function loadProcessors() {
    try {
      const res = await api.getProcessors();
      if (res.data && res.data.length > 0) {
        setProcessors(res.data);
        if (!selectedProcessorId) {
          setSelectedProcessorId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load processors', err);
    }
  }

  async function loadMarketplace() {
    setLoadingMarket(true);
    try {
      let url = '/api/store/marketplace?';
      if (searchCrop) url += `crop=${encodeURIComponent(searchCrop)}&`;
      if (filterMaxPrice) url += `max_price=${encodeURIComponent(filterMaxPrice)}&`;
      if (filterStorage) url += `storage_type=${encodeURIComponent(filterStorage)}&`;

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setMarketItems(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load marketplace:', err);
    } finally {
      setLoadingMarket(false);
    }
  }

  async function fetchMatches(processorId) {
    setLoadingMatches(true);
    setError(null);
    try {
      const res = await api.getMatches(processorId);
      setMatches(res.matches || []);
      setEngineMetadata(res.engine_metadata || null);
    } catch (err) {
      setError(err.message || 'Failed to calculate AI matches');
      setMatches([]);
    } finally {
      setLoadingMatches(false);
    }
  }

  // Handle Provider Application Submission
  async function handleSubmitApplication(e) {
    e.preventDefault();
    setSubmittingApp(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await submitProviderApplication(appForm);
      setSuccessMsg('Your application to become a Trusted Consumer has been submitted! It is now in the Admin review queue.');
    } catch (err) {
      setError(err.message || 'Application submission failed');
    } finally {
      setSubmittingApp(false);
    }
  }

  async function handleToggleService() {
    try {
      const nextStatus = await toggleServiceStatus();
      setSuccessMsg(`Procurement intake services are now ${nextStatus ? 'ACTIVE (ON)' : 'PAUSED (OFF)'}`);
      loadProcessors();
    } catch (err) {
      setError(err.message || 'Failed to toggle service status');
    }
  }

  // Submit new crop demand
  async function handlePostDemand(e) {
    e.preventDefault();
    if (isVisitor) {
      setError('Visitor Explorer Mode: Posting commercial crop demand requires an approved Bulk Consumer account.');
      return;
    }
    setPostSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload = {
        company_name: formData.company_name,
        location: {
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude),
          address: formData.address,
        },
        required_crop: formData.required_crop,
        required_grade: formData.required_grade,
        quantity_needed_tons: Number(formData.quantity_needed_tons),
        max_distance_km: Number(formData.max_distance_km),
        deadline: formData.deadline,
        target_price_per_ton: Number(formData.target_price_per_ton),
      };

      const res = await api.createProcessor(payload);
      setSuccessMsg(`Demand for ${res.data.required_crop} posted successfully!`);
      await loadProcessors();
      setSelectedProcessorId(res.data.id);
      setActiveSubTab('matching');
    } catch (err) {
      setError(err.message || 'Failed to post consumer demand');
    } finally {
      setPostSubmitting(false);
    }
  }

  // Generate Smart Contract for a matched farmer
  async function handleGenerateContract(farmerId, agreedPrice, crop, quantity) {
    if (isVisitor) {
      setError('Visitor Explorer Mode: Generating smart contracts requires an approved Bulk Consumer account.');
      return;
    }
    if (!isServiceActive) {
      setError('Your Procurement Intake is currently turned OFF. Turn service ON in the header before dispatching contracts.');
      return;
    }
    if (!selectedProcessorId || !farmerId) return;
    setContractGeneratingId(farmerId);
    setError(null);

    try {
      const payload = {
        processor_id: selectedProcessorId,
        farmer_id: farmerId,
        agreed_price: agreedPrice,
        crop: crop,
        quantity: quantity,
      };

      const res = await api.generateContract(payload);
      setSuccessMsg(`Contract generated successfully for ${res.data.farmer_name}!`);
      navigate(`/contract/${res.data.id}`);
    } catch (err) {
      setError(err.message || 'Failed to generate contract');
    } finally {
      setContractGeneratingId(null);
    }
  }

  // Open procurement offer modal
  function handleOpenProcureModal(item) {
    setProcureModalItem(item);
    setProcureQuantity(item.quantity_quintals || 50);
    setProcureNotes(`Procurement offer for ${item.crop_name} (${item.grade}) at ₹${item.price_per_quintal}/Qtl. Ready for immediate farm gate dispatch upon your acceptance.`);
  }

  // Submit Procurement Offer to Farmer
  async function handleConfirmProcurementRequest() {
    if (!procureModalItem) return;
    const item = procureModalItem;

    if (!selectedProcessorId && processors.length > 0) {
      setSelectedProcessorId(processors[0].id);
    }
    const procId = selectedProcessorId || (processors[0] ? processors[0].id : 'proc_wheat_01');
    const qtyQuintals = Number(procureQuantity) || item.quantity_quintals;
    const quantityTons = Math.max(1, Math.round(qtyQuintals / 10));
    const totalPrice = Math.round(qtyQuintals * item.price_per_quintal);

    setProcureSubmitting(true);
    setError(null);
    try {
      const res = await api.generateContract({
        processor_id: procId,
        farmer_id: item.farmer_id,
        agreed_price: totalPrice,
        crop: item.crop_name,
        quantity: quantityTons,
        delivery_date: 'Within 30 days of farmer acceptance'
      });

      setSentRequestIds((prev) => [...prev, item.id]);
      setSuccessMsg(
        `Procurement request sent to ${item.farmer_name}! The farmer has been notified to review and accept the offer in their dashboard.`
      );
      setProcureModalItem(null);
      await loadContracts();
    } catch (err) {
      setError(err.message || 'Failed to send procurement request');
    } finally {
      setProcureSubmitting(false);
    }
  }

  const selectedProcessor = processors.find((p) => p.id === selectedProcessorId) || processors[0];

  const filteredMatches = matches.filter((m) => m.compatibility_score >= minScoreFilter);

  // Helper Methods for Contracts, Deliveries & Demo Login
  async function loadContracts() {
    setLoadingContracts(true);
    try {
      const res = await api.getContracts();
      setContracts(res.data || []);
    } catch (err) {
      console.error('Failed to load contracts:', err);
    } finally {
      setLoadingContracts(false);
    }
  }

  async function loadDeliveries() {
    setLoadingDeliveries(true);
    try {
      const res = await api.getDeliveries();
      setDeliveries(res.data || []);
    } catch (err) {
      console.error('Failed to load deliveries:', err);
    } finally {
      setLoadingDeliveries(false);
    }
  }

  async function handleSignContract(contractId) {
    setSigningContractId(contractId);
    setError(null);
    try {
      await api.signContract(contractId);
      setSuccessMsg('Digital counter-signature verified and contract status updated to Signed!');
      await loadContracts();
    } catch (err) {
      setError(err.message || 'Failed to sign contract');
    } finally {
      setSigningContractId(null);
    }
  }

  async function handleAdvanceDelivery(deliveryId, nextStatus) {
    setUpdatingDeliveryId(deliveryId);
    setError(null);
    try {
      await api.trackDelivery({
        delivery_id: deliveryId,
        status: nextStatus,
        checkpoint: nextStatus === 'Delivered'
          ? 'Intake Weighbridge & Silo Unloading Complete'
          : 'Highway Freight Transit: In Transit to Consumer Silo',
        notes: nextStatus === 'Delivered'
          ? 'Mandi lab verified produce quality and certified weighbridge slip generated. Payment release authorized.'
          : 'Shipment departed farm gate in GPS-monitored vehicle.'
      });
      setSuccessMsg(`Delivery status transitioned to ${nextStatus}!`);
      await loadDeliveries();
      await loadContracts();
    } catch (err) {
      setError(err.message || 'Failed to update delivery');
    } finally {
      setUpdatingDeliveryId(null);
    }
  }

  async function handleDemoLogin(email, password) {
    setError(null);
    setSuccessMsg(null);
    try {
      await login(email, password);
      setSuccessMsg(`Signed in successfully as ${email}!`);
      await loadProcessors();
      await loadContracts();
      await loadDeliveries();
      await loadMarketplace();
    } catch (err) {
      setError(err.message || 'Demo login failed');
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setProfileSaving(true);
    setError(null);
    try {
      await updateUserProfile({
        name: profileForm.company_name,
        phone: profileForm.phone,
        address: profileForm.address,
        gst_number: profileForm.gst_number,
        fssai_license: profileForm.fssai_license,
        processing_capacity_tons: Number(profileForm.processing_capacity_tons)
      });
      setSuccessMsg('Corporate profile and milling specifications updated successfully!');
      refreshUser();
    } catch (err) {
      setError(err.message || 'Failed to update corporate profile');
    } finally {
      setProfileSaving(false);
    }
  }

  // -------------------------------------------------------------
  // UNAUTHENTICATED OR NON-CONSUMER GATE (WITH 1-CLICK DEMO LOGINS & PREVIEW)
  // -------------------------------------------------------------
  if ((!isAuthenticated || (!isTrustedProcessor && !isProcessor && !isAdmin)) && !previewMode) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl text-center border border-emerald-800 relative overflow-hidden">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Institutional Bulk Consumer Portal</h1>
          <p className="text-slate-300 text-sm mt-2 max-w-lg mx-auto leading-relaxed">
            Authorized institutional bulk consumers and commercial buyers manage procurement, search verified farmer commodity stores, track forward supply contracts, and match agronomic compatibility on Google Maps GIS.
          </p>

          {/* Instant 1-Click Demo Logins */}
          <div className="mt-6 pt-6 border-t border-emerald-800/60 max-w-md mx-auto">
            <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-3">
              ⚡ Instant 1-Click Demo Consumer Access:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleDemoLogin('procurement@agropure.com', 'processor123')}
                className="p-3 bg-white/10 hover:bg-white/20 border border-emerald-400/40 rounded-xl text-left transition cursor-pointer"
              >
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  AgroPure Foods Ltd
                </div>
                <div className="text-[10px] text-emerald-200 mt-0.5">Verified Wheat Consumer</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('duwarka@gmail.com', 'duwarka@gmail.com')}
                className="p-3 bg-white/10 hover:bg-white/20 border border-emerald-400/40 rounded-xl text-left transition cursor-pointer"
              >
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-teal-400" />
                  Duwarka Agro Mills
                </div>
                <div className="text-[10px] text-teal-200 mt-0.5">Corporate Milling Unit</div>
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-lg">Consumer Sign In</h3>
            <button
              type="button"
              onClick={() => setPreviewMode(true)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Explore Portal in Preview Mode &rarr;
            </button>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              const em = document.getElementById('proc-email-input').value;
              const pw = document.getElementById('proc-pass-input').value;
              try {
                await login(em, pw);
                await loadProcessors();
                await loadContracts();
                await loadDeliveries();
              } catch (err) {
                setError(err.message || 'Login failed');
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Corporate Consumer Email
              </label>
              <input
                type="email"
                required
                defaultValue="procurement@agropure.com"
                id="proc-email-input"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                defaultValue="processor123"
                id="proc-pass-input"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                Sign In to Consumer Portal &rarr;
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode(true)}
                className="py-3 px-5 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                Browse All Tabs (Guest Mode)
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VERIFIED TRUSTED PROCESSOR & PREVIEW PORTAL VIEW
  // -------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Header Banner with Verified Badge */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden border border-emerald-700/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold tracking-wide mb-3 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Verified Trusted Bulk Consumer 🛡️
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {selectedProcessor?.company_name || user?.name || 'AgroPure Consumer Portal'}
            </h1>
            <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed font-light">
              Search live farmer produce inventories, calculate multi-factor agronomic compatibility, inspect farms on Google Maps GIS, and generate legally binding forward supply contracts.
            </p>
          </div>

          {/* Active Demand Selector & Service Intake Toggle */}
          {processors.length > 0 && (
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 sm:min-w-[320px] shadow-lg space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs text-emerald-200 font-semibold flex items-center gap-1.5">
                  <Power className="w-3.5 h-3.5 text-emerald-400" />
                  Sourcing Intake:
                </span>
                <button
                  onClick={handleToggleService}
                  className={`px-3 py-1 rounded-lg font-extrabold text-[10px] uppercase shadow-xs flex items-center gap-1 transition ${
                    isServiceActive
                      ? 'bg-emerald-400 text-emerald-950 ring-2 ring-emerald-300/50'
                      : 'bg-rose-500 text-white'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${isServiceActive ? 'bg-emerald-950' : 'bg-white'} animate-pulse`} />
                  {isServiceActive ? 'ACTIVE (ON)' : 'PAUSED (OFF)'}
                </button>
              </div>

              <div className="text-xs text-emerald-300 font-semibold uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Active Demand Requirement:</span>
                <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {processors.length} Active
                </span>
              </div>
              <select
                value={selectedProcessorId}
                onChange={(e) => setSelectedProcessorId(e.target.value)}
                className="w-full bg-slate-950/80 border border-emerald-400/50 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:ring-2 focus:ring-emerald-300 focus:outline-hidden cursor-pointer"
              >
                {processors.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    {p.required_crop} ({p.quantity_needed_tons * 10} Qtl &bull; ₹{Math.round(p.target_price_per_ton / 10).toLocaleString('en-IN')}/Qtl)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-800 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-xs text-emerald-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Full 6-Tab Navigation Bar */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-6 overflow-x-auto pb-px">
        <button
          onClick={() => handleTabChange('marketplace')}
          className={`pb-3.5 px-2 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition shrink-0 cursor-pointer ${
            activeSubTab === 'marketplace'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Direct Farmer Procurement</span>
          <span className="px-2 py-0.5 text-[11px] bg-emerald-100 text-emerald-800 rounded-full font-bold">
            {marketItems.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('matching')}
          className={`pb-3.5 px-2 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition shrink-0 cursor-pointer ${
            activeSubTab === 'matching'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>AI Agronomic Matchmaker &amp; GIS</span>
          <span className="px-2 py-0.5 text-[11px] bg-slate-100 text-slate-700 rounded-full font-bold">
            {matches.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('contracts')}
          className={`pb-3.5 px-2 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition shrink-0 cursor-pointer ${
            activeSubTab === 'contracts'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Active Contracts &amp; Forward Orders</span>
          <span className="px-2 py-0.5 text-[11px] bg-blue-100 text-blue-800 rounded-full font-bold">
            {contracts.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('deliveries')}
          className={`pb-3.5 px-2 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition shrink-0 cursor-pointer ${
            activeSubTab === 'deliveries'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4 text-indigo-600" />
          <span>Inbound Logistics &amp; Tracking</span>
          <span className="px-2 py-0.5 text-[11px] bg-indigo-100 text-indigo-800 rounded-full font-bold">
            {deliveries.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('demands')}
          className={`pb-3.5 px-2 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition shrink-0 cursor-pointer ${
            activeSubTab === 'demands'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4 text-amber-600" />
          <span>Sourcing Demands</span>
          <span className="px-2 py-0.5 text-[11px] bg-amber-100 text-amber-800 rounded-full font-bold">
            {processors.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('profile')}
          className={`pb-3.5 px-2 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition shrink-0 cursor-pointer ${
            activeSubTab === 'profile'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Corporate Profile &amp; Capacity</span>
        </button>
      </div>

      {/* SUB-TAB 1: SEARCH FARMER STORES & INVENTORIES */}
      {activeSubTab === 'marketplace' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                  <Search className="w-5 h-5 text-emerald-600" />
                  Direct Procurement from Farmer Stores
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Browse produce stored by farmers with rates in ₹ per Quintal (100 kg)
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search crop or tag (e.g. makka, gehun)..."
                    value={searchCrop}
                    onChange={(e) => setSearchCrop(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadMarketplace()}
                    className="pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 w-52 sm:w-72 bg-white"
                  />
                  {searchCrop && (
                    <button
                      type="button"
                      onClick={() => setSearchCrop('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <input
                  type="number"
                  placeholder="Max ₹/Qtl rate..."
                  value={filterMaxPrice}
                  onChange={(e) => setFilterMaxPrice(e.target.value)}
                  className="px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 w-32"
                />

                <button
                  onClick={loadMarketplace}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5" />
                  Filter
                </button>
              </div>
            </div>

            {/* Live Search & Match Banner */}
            {searchCrop && (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-xs text-emerald-900 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Found <strong>{displayMarketItems.length}</strong> {displayMarketItems.length === 1 ? 'lot' : 'lots'} matching <strong>"{searchCrop}"</strong> (ranked directly to top)
                  </span>
                </div>
                <button
                  onClick={() => setSearchCrop('')}
                  className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer text-[11px]"
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>

          {/* Cards Grid */}
          {loadingMarket ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              Loading farmer store inventories...
            </div>
          ) : displayMarketItems.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <div className="font-bold text-slate-700">No commodities match this criteria</div>
              <p className="text-xs text-slate-400 mt-1">Try resetting the crop name or price filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayMarketItems.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs hover:border-emerald-500 hover:shadow-md transition space-y-4 flex flex-col justify-between ${
                    item._matchedReason ? 'border-emerald-400 ring-2 ring-emerald-400/20' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Match Badge */}
                    {item._matchedReason && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-extrabold shadow-2xs">
                        <Sparkles className="w-3 h-3 text-emerald-200" />
                        <span>Top Match for "{searchCrop}": {item._matchedReason}</span>
                      </div>
                    )}

                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {item.grade}
                        </span>
                        <h4 className="text-lg font-extrabold text-slate-900 mt-1">{item.crop_name}</h4>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400 uppercase font-bold">Farmer Rate</div>
                        <div className="text-lg font-extrabold text-emerald-700 font-mono">
                          ₹{item.price_per_quintal.toLocaleString('en-IN')} <span className="text-xs font-normal">/ Qtl</span>
                        </div>
                      </div>
                    </div>

                    {/* Vernacular Tags (#makka, #makki, etc.) */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition ${
                              searchCrop && tag.toLowerCase().includes(searchCrop.toLowerCase().trim())
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-extrabold'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600 border border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Farmer / Owner:</span>
                        <strong className="text-slate-800">{item.farmer_name}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Available Volume:</span>
                        <strong className="text-slate-900 font-mono">
                          {item.quantity_quintals.toLocaleString('en-IN')} Quintals
                        </strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Cultivated In Soil:</span>
                        <span className="font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80 text-[10px] inline-flex items-center gap-1">
                          🌱 {item.soil_type || 'Loamy'} Soil
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Storage Location:</span>
                        <span className="text-slate-700">{item.storage_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Moisture Content:</span>
                        <span>{item.moisture_percentage}%</span>
                      </div>
                    </div>

                    {item.farmer_location && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{item.farmer_location.address || 'Farmland Cluster'}</span>
                      </div>
                    )}

                    {/* Mandatory Soil & Quality Assay Report (PDF) */}
                    {item.report_document ? (
                      <div className="flex items-center justify-between p-2.5 bg-emerald-50/90 border border-emerald-200 rounded-xl text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-900 font-semibold truncate">
                          <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate">{item.report_file_name || 'Soil_Assay_Report.pdf'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedReportItem(item)}
                          className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-white px-2.5 py-1 rounded-lg border border-emerald-300 hover:bg-emerald-100 shrink-0 cursor-pointer shadow-xs flex items-center gap-1 transition"
                        >
                          <Eye className="w-3 h-3 text-emerald-600" /> View PDF
                        </button>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                        Assay report verification pending
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    {sentRequestIds.includes(item.id) ? (
                      <div className="w-full py-2.5 bg-amber-50 border border-amber-300 text-amber-900 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs">
                        <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                        <span>Request Sent (Pending Farmer Acceptance)</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenProcureModal(item)}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                      >
                        <FileCheck2 className="w-4 h-4" />
                        <span>Send Procurement Request to Farmer &rarr;</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: CROP DEMAND & AI AGRONOMIC MATCHMAKER */}
      {activeSubTab === 'matching' && (
        <div className="space-y-8">
          {/* HACKATHON STEP 3: AUTOMATE ONE STEP WITH AI - BEFORE VS AFTER SHOWCASE */}
          <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-emerald-500/30 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/20 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-500/30">
                  <Sparkles className="w-3.5 h-3.5" /> AI Automation Showcase &bull; Step 3
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                  Automated Step: Farm Sourcing, Agronomic Assaying &amp; Contract Drafting
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Replacing 3 weeks of manual mandi broker negotiation with a 1.2-second multi-factor agronomic AI engine.
                </p>
              </div>
            </div>

            {/* Before vs After Side-by-Side Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* BEFORE AI */}
              <div className="bg-rose-950/40 rounded-2xl p-5 border border-rose-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 font-extrabold text-xs uppercase border border-rose-500/30">
                    ❌ BEFORE AI: Manual Traditional Process
                  </span>
                  <span className="text-xs text-rose-400 font-mono font-bold">14 - 21 Days</span>
                </div>
                <ul className="space-y-2.5 text-xs text-rose-100/90">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold shrink-0">&bull;</span>
                    <span><strong>Physical Mandi Travel:</strong> Procurement officers travel across APMC mandis (50-100 km) looking for matching grain lots.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold shrink-0">&bull;</span>
                    <span><strong>Middleman Commission:</strong> Arhtiya cartels extract 5% to 8% brokerage while offering zero harvest traceability.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold shrink-0">&bull;</span>
                    <span><strong>Zero Soil Suitability Data:</strong> Millers purchase crops without knowing soil health, causing unexpected moisture &amp; grade failures.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold shrink-0">&bull;</span>
                    <span><strong>Paper Contract Drafting:</strong> Legal agreements take 7–10 days of lawyer review, causing post-harvest price repudiation.</span>
                  </li>
                </ul>
              </div>

              {/* AFTER AI */}
              <div className="bg-emerald-950/40 rounded-2xl p-5 border border-emerald-500/40 space-y-4 shadow-lg shadow-emerald-900/20">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/30 text-emerald-300 font-extrabold text-xs uppercase border border-emerald-500/40 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-emerald-400" /> AFTER AI: FarmSphere Matchmaker
                  </span>
                  <span className="text-xs text-emerald-400 font-mono font-bold">⚡ 1.2 Seconds</span>
                </div>
                <ul className="space-y-2.5 text-xs text-emerald-100/90">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">&check;</span>
                    <span><strong>Automated Multi-Factor Match:</strong> Algorithmic engine scores Haversine distance, soil type, past yield history, and season in milliseconds.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">&check;</span>
                    <span><strong>0% Middleman Gouging:</strong> Direct corporate-to-farmer trade desk with guaranteed transparent pricing in ₹ per Quintal.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">&check;</span>
                    <span><strong>Predictive Risk Narrative:</strong> AI engine flags out-of-radius logistics, soil mismatches, or acreage shortages before contract signing.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">&check;</span>
                    <span><strong>Instant Legal Contract:</strong> Bilateral agreement under Indian Contract Act 1872 generated in 1-click with digital signatures and milestone escrow.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Post Demand & Overview Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Post Crop Demand Form (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2 pb-3 border-b border-slate-100">
                <Building2 className="w-5 h-5 text-emerald-600" />
                Post Institutional Crop Demand
              </h3>

              <form onSubmit={handlePostDemand} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Consumer Enterprise Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Target Crop
                    </label>
                    <select
                      value={formData.required_crop}
                      onChange={(e) => setFormData({ ...formData, required_crop: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="Wheat">Wheat (Kanak)</option>
                      <option value="Potato">Potato (Aloo)</option>
                      <option value="Soybean">Soybean</option>
                      <option value="Rice">Basmati Rice</option>
                      <option value="Mustard">Mustard (Sarson)</option>
                      <option value="Corn">Corn / Maize</option>
                      <option value="Cotton">Cotton (Kapas)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Required Grade
                    </label>
                    <select
                      value={formData.required_grade}
                      onChange={(e) => setFormData({ ...formData, required_grade: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="Grade A">Grade A (Premium)</option>
                      <option value="Grade B">Grade B (Standard)</option>
                      <option value="Grade 3">Grade 3 (Standard Commercial)</option>
                      <option value="Organic">Certified Organic</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Volume (Quintals)
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.quantity_needed_tons * 10}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          quantity_needed_tons: Number(e.target.value) / 10,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] text-slate-400">
                      = {formData.quantity_needed_tons} Metric Tons
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Target Rate (₹ / Qtl)
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={Math.round(formData.target_price_per_ton / 10)}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          target_price_per_ton: Number(e.target.value) * 10,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Max Mandi Distance (km)
                    </label>
                    <input
                      type="number"
                      min="10"
                      required
                      value={formData.max_distance_km}
                      onChange={(e) =>
                        setFormData({ ...formData, max_distance_km: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Delivery Deadline
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Processing Silo Address
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={postSubmitting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  {postSubmitting ? 'Posting Demand...' : 'Post Requirement & Match'}
                </button>
              </form>
            </div>

            {/* Right Column: Google Maps Agricultural GIS (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-emerald-600" />
                      Google Maps Agricultural GIS
                    </h3>
                    <p className="text-xs text-slate-500">
                      Spatial plotting of candidate farms around buyer processing hub
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                    {matches.length} Farms Evaluated
                  </span>
                </div>

                {/* Map Component */}
                <div className="h-[420px] rounded-xl overflow-hidden border border-slate-200 shadow-inner">
                  <GoogleMap
                    processorLocation={selectedProcessor?.location}
                    processorName={selectedProcessor?.company_name}
                    requiredCrop={selectedProcessor?.required_crop}
                    matches={matches}
                    selectedFarmId={selectedFarmId}
                    onSelectFarm={(farm) => setSelectedFarmId(farm.farmer_id)}
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Map layers: Google Roadmap and Satellite / Hybrid</span>
                <span className="text-emerald-700 font-semibold">
                  Active Radius: {selectedProcessor?.max_distance_km || 100} km
                </span>
              </div>
            </div>
          </div>

          {/* AI Match Results Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-xl flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  AI Match Results: Ranked Candidate Farms
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Agronomic score ranking based on soil, past yield, distance, and acreage
                </p>
              </div>

              {/* View Filters */}
              <div className="flex items-center gap-3">
                <select
                  value={minScoreFilter}
                  onChange={(e) => setMinScoreFilter(Number(e.target.value))}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  <option value="0">All Scores</option>
                  <option value="85">Optimal Only (85%+)</option>
                  <option value="70">Moderate &amp; Above (70%+)</option>
                </select>
              </div>
            </div>

            {loadingMatches ? (
              <div className="text-center py-16 text-slate-400 text-sm">
                Evaluating candidate farm compatibility...
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                <div className="font-bold text-slate-700">No matching farms found</div>
                <p className="text-xs text-slate-400 mt-1">
                  Try increasing your maximum distance or adjusting your required crop.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMatches.map((match) => (
                  <div
                    key={match.farmer_id}
                    ref={(el) => (farmRefs.current[match.farmer_id] = el)}
                    className={`p-5 rounded-2xl border transition-all ${
                      selectedFarmId === match.farmer_id
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      {/* Left Details */}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center">
                            #{match.rank}
                          </span>
                          <h4 className="text-base font-extrabold text-slate-900">
                            {match.farmer_name}
                          </h4>
                          <CompatibilityBadge
                            score={match.compatibility_score}
                            category={match.match_category}
                          />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                              DISTANCE
                            </span>
                            <div className="font-bold text-slate-800 mt-0.5">
                              {match.distance_km.toFixed(1)} km
                            </div>
                          </div>

                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                              SOIL COMPATIBILITY
                            </span>
                            <div className="font-bold text-slate-800 mt-0.5">
                              {match.soil_type} ({match.score_breakdown?.soil_score}%)
                            </div>
                          </div>

                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                              YIELD RECORD
                            </span>
                            <div className="font-bold text-slate-800 mt-0.5">
                              {match.past_tonnage_for_crop * 10} Quintals
                            </div>
                          </div>

                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                              CAPACITY
                            </span>
                            <div className="font-bold text-slate-800 mt-0.5">
                              {match.total_acreage} Acres
                            </div>
                          </div>
                        </div>

                        {/* AI Rationale */}
                        {match.ai_recommendation && (
                          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-slate-700">
                            <span className="font-bold text-emerald-800">AI Rationale:</span>{' '}
                            {match.ai_recommendation.rationale}
                          </div>
                        )}
                      </div>

                      {/* Right Action */}
                      <div className="w-full lg:w-auto shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                        <div className="text-right mb-2 hidden lg:block">
                          <div className="text-[10px] uppercase font-bold text-slate-400">
                            Estimated Value
                          </div>
                          <div className="text-sm font-extrabold text-emerald-800 font-mono">
                            ₹{match.estimated_contract_value?.toLocaleString('en-IN')}
                          </div>
                        </div>

                        {match.is_service_active === false ? (
                          <div className="w-full lg:w-auto px-4 py-2.5 bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs">
                            <Power className="w-3.5 h-3.5 text-rose-600" />
                            Farmer Offline (Service OFF)
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              handleGenerateContract(
                                match.farmer_id,
                                match.estimated_contract_value,
                                selectedProcessor.required_crop,
                                selectedProcessor.quantity_needed_tons
                              )
                            }
                            disabled={contractGeneratingId === match.farmer_id}
                            className="w-full lg:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {contractGeneratingId === match.farmer_id ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Drafting Contract...
                              </>
                            ) : (
                              <>
                                <FileCheck2 className="w-4 h-4" />
                                Generate Smart Contract &rarr;
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ACTIVE CONTRACTS & FORWARD ORDERS */}
      {activeSubTab === 'contracts' && (
        <div className="space-y-6">
          {/* Contracts Overview Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">
                Total Buyback Contracts
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {contracts.length}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">
                Total Consideration
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-1 font-mono">
                ₹{contracts.reduce((acc, c) => acc + (Number(c.agreed_price) || 0), 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">
                Active / Executed
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-700 mt-1">
                {contracts.filter((c) => ['Signed', 'In Transit', 'Fulfilled'].includes(c.status)).length}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">
                Pending Counter-Sign
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">
                {contracts.filter((c) => ['Pending', 'Accepted'].includes(c.status)).length}
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-slate-900 text-base">
                Procurement Contracts &amp; Forward Agreements
              </h3>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {['all', 'Pending', 'Accepted', 'Signed', 'In Transit', 'Fulfilled', 'Cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setContractFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    contractFilter === status
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status === 'all' ? 'All Contracts' : status}
                </button>
              ))}
            </div>
          </div>

          {/* Contracts List */}
          {loadingContracts ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
              Loading institutional contracts...
            </div>
          ) : contracts.filter((c) => contractFilter === 'all' || c.status === contractFilter).length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200 space-y-3">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="font-bold text-slate-700 text-base">No contracts found in this status</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Execute forward agreements directly from verified farmer stores or run the AI Agronomic Matchmaker to generate new agreements.
              </p>
              <button
                onClick={() => handleTabChange('marketplace')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Browse Farmer Stores &rarr;
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {contracts
                .filter((c) => contractFilter === 'all' || c.status === contractFilter)
                .map((contract) => (
                  <div
                    key={contract.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-emerald-500/60 transition space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold px-2.5 py-1 bg-slate-900 text-white rounded-lg">
                          {contract.id}
                        </span>
                        <span className="text-xs text-slate-400">
                          Executed on: {contract.created_at ? new Date(contract.created_at).toLocaleDateString() : 'Active'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                            contract.status === 'Signed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : contract.status === 'Fulfilled'
                              ? 'bg-teal-50 text-teal-800 border-teal-300'
                              : contract.status === 'In Transit'
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                              : contract.status === 'Accepted'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : contract.status === 'Cancelled'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          {contract.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Farmer / Grower</span>
                        <div className="font-extrabold text-slate-800 text-sm mt-0.5">
                          {contract.farmer_name || 'Verified Farmer'}
                        </div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Contracted Commodity</span>
                        <div className="font-extrabold text-slate-800 text-sm mt-0.5">
                          {contract.crop}
                        </div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Committed Volume</span>
                        <div className="font-extrabold text-slate-900 text-sm mt-0.5 font-mono">
                          {contract.quantity * 10} Quintals ({contract.quantity} MT)
                        </div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Total Consideration</span>
                        <div className="font-extrabold text-emerald-800 text-sm mt-0.5 font-mono">
                          ₹{Number(contract.agreed_price).toLocaleString('en-IN')}
                          <span className="text-[10px] font-normal text-slate-500 block">
                            (₹{Math.round(Number(contract.agreed_price) / (contract.quantity * 10 || 1)).toLocaleString('en-IN')}/Qtl)
                          </span>
                        </div>
                      </div>
                    </div>

                    {contract.cancel_reason && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                        <strong>Cancellation Reason:</strong> {contract.cancel_reason}
                      </div>
                    )}

                    {/* 30% Advance Escrow Alert for Accepted Contracts */}
                    {contract.status === 'Accepted' && contract.advance_payment_status !== 'paid' && (
                      <div className="p-3.5 bg-gradient-to-r from-amber-50 to-emerald-50 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
                        <div className="flex items-start sm:items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold shadow-xs">
                            30%
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900">
                              Farmer Accepted Your Request &bull; 30% Advance Escrow Required
                            </p>
                            <p className="text-[11px] text-slate-600">
                              Deposit 30% advance (₹{Math.round((Number(contract.agreed_price) || 0) * 0.3).toLocaleString('en-IN')}) into secure escrow to dispatch produce.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAdvanceModalContract(contract)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pay 30% Advance Escrow &rarr;</span>
                        </button>
                      </div>
                    )}

                    {/* Escrow Paid Banner */}
                    {(contract.advance_payment_status === 'paid' || ['Signed', 'In Transit'].includes(contract.status)) && (
                      <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between gap-2.5 text-xs text-emerald-900">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>
                            <strong>30% Advance Escrow Deposited (₹{Number(contract.advance_paid_amount || Math.round((Number(contract.agreed_price) || 0) * 0.3)).toLocaleString('en-IN')}):</strong> Freight PB-10-AZ-9981 is dispatched and en route to silo.
                          </span>
                        </div>
                        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-200/80 text-emerald-900 shrink-0 uppercase tracking-wider">
                          In Transit
                        </span>
                      </div>
                    )}

                    {/* Escrow Settlement Bill Breakdown: Before Amount -> 30% Reduction -> After Amount */}
                    {(() => {
                      const grossTotal = Number(contract.agreed_price) || 0;
                      const advanceReduction = Number(contract.advance_paid_amount) || Math.round(grossTotal * 0.3);
                      const balanceAfterReduction = Math.max(0, grossTotal - advanceReduction);

                      return (
                        <div className="p-3.5 bg-gradient-to-br from-slate-50 to-slate-100/70 rounded-2xl border border-slate-200 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                              <FileText className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Escrow Settlement Bill &amp; Reduction Ledger</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setViewingBillContract(contract)}
                              className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Make / View Bill &rarr;</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                            {/* Before Reduction (Gross) */}
                            <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Gross Bill (Before Reduction)
                              </span>
                              <div className="font-extrabold text-slate-900 text-sm font-mono mt-0.5">
                                ₹{grossTotal.toLocaleString('en-IN')}
                              </div>
                              <span className="text-[10px] text-slate-500 block">100% Contract Value</span>
                            </div>

                            {/* Reduction Amount (30% Escrow Advance) */}
                            <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200 shadow-2xs">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                                  30% Advance (Reduction)
                                </span>
                                <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                                  contract.advance_payment_status === 'paid' ? 'bg-emerald-600 text-white' : 'bg-amber-200 text-amber-900'
                                }`}>
                                  {contract.advance_payment_status === 'paid' ? 'DEDUCTED' : 'DUE'}
                                </span>
                              </div>
                              <div className="font-extrabold text-amber-900 text-sm font-mono mt-0.5">
                                - ₹{advanceReduction.toLocaleString('en-IN')}
                              </div>
                              <span className="text-[10px] text-amber-700 block">
                                {contract.advance_payment_status === 'paid' ? 'Paid & Held in Escrow' : 'Awaiting 30% Deposit'}
                              </span>
                            </div>

                            {/* After Reduction (Net Balance Due) */}
                            <div className="p-2.5 bg-emerald-50/90 rounded-xl border border-emerald-300 shadow-2xs">
                              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                                Net Due (After Reduction)
                              </span>
                              <div className="font-extrabold text-emerald-900 text-sm font-mono mt-0.5">
                                ₹{balanceAfterReduction.toLocaleString('en-IN')}
                              </div>
                              <span className="text-[10px] text-emerald-700 font-medium block">
                                70% Balance on Weighbridge Acceptance
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                      <Link
                        to={`/contract/${contract.id}`}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open Digital Contract &amp; Logistics Tracker &rarr;
                      </Link>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* View Escrow Bill Button */}
                        <button
                          type="button"
                          onClick={() => setViewingBillContract(contract)}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          <span>View Escrow Bill</span>
                        </button>

                        {contract.status === 'Accepted' && contract.advance_payment_status !== 'paid' && (
                          <button
                            type="button"
                            onClick={() => setAdvanceModalContract(contract)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Pay 30% Advance Escrow</span>
                          </button>
                        )}

                        {contract.status === 'Pending' && (
                          <button
                            onClick={() => handleSignContract(contract.id)}
                            disabled={signingContractId === contract.id}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {signingContractId === contract.id ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                Verifying Signature...
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Digitally Counter-Sign Agreement
                              </>
                            )}
                          </button>
                        )}

                        {/* Single Dispatch Location Tracking Button */}
                        {(contract.advance_payment_status === 'paid' || ['Signed', 'In Transit', 'Fulfilled'].includes(contract.status)) && (
                          <button
                            type="button"
                            onClick={() => setDispatchModalData({ contract })}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Track Location of Dispatch</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: INBOUND LOGISTICS & DELIVERY TRACKING */}
      {activeSubTab === 'deliveries' && (
        <div className="space-y-6">
          {/* Deliveries Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">
                Total Inbound Shipments
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {deliveries.length}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">
                Freight In Transit
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-700 mt-1">
                {deliveries.filter((d) => d.status === 'In Transit').length}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">
                Weighbridge Completed
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-1">
                {deliveries.filter((d) => d.status === 'Delivered').length}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">
                Scheduled / Gate Dispatch
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">
                {deliveries.filter((d) => d.status === 'Scheduled').length}
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-slate-900 text-base">
                Inbound Freight Logistics &amp; Weighbridge QA
              </h3>
            </div>

            <div className="flex items-center gap-1.5">
              {['all', 'Scheduled', 'In Transit', 'Delivered'].map((status) => (
                <button
                  key={status}
                  onClick={() => setDeliveryFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    deliveryFilter === status
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status === 'all' ? 'All Deliveries' : status}
                </button>
              ))}
            </div>
          </div>

          {/* Deliveries List */}
          {loadingDeliveries ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
              Loading logistics shipments...
            </div>
          ) : deliveries.filter((d) => deliveryFilter === 'all' || d.status === deliveryFilter).length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200 space-y-3">
              <Truck className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="font-bold text-slate-700 text-base">No shipments match this status</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Shipments are created automatically when forward contracts are digitally counter-signed.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {deliveries
                .filter((d) => deliveryFilter === 'all' || d.status === deliveryFilter)
                .map((del) => (
                  <div
                    key={del.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-indigo-500/60 transition space-y-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold px-2.5 py-1 bg-indigo-900 text-white rounded-lg">
                            {del.id}
                          </span>
                          <span className="text-xs text-slate-500 font-semibold">
                            Contract Reference: <strong>{del.contract_id}</strong>
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Delivery Window: {del.delivery_date} &bull; Route: {del.farmer_name || 'Farm Gate'} &rarr; {del.processor_name || 'Consumer Silo'}
                        </div>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-extrabold border self-start sm:self-auto ${
                          del.status === 'Delivered'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : del.status === 'In Transit'
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        {del.status}
                      </span>
                    </div>

                    {/* Timeline Checkpoints */}
                    <div className="space-y-3 pl-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Telemetry &amp; Milestone Timeline:
                      </span>
                      <div className="space-y-2.5 border-l-2 border-indigo-200 ml-2 pl-4">
                        {(del.tracking_notes || []).map((note, idx) => (
                          <div key={idx} className="relative text-xs space-y-0.5">
                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white" />
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">{note.checkpoint}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {note.timestamp ? new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                            <p className="text-slate-600 leading-relaxed text-[11px]">{note.notes}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Intake Actions */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-3">
                        <Link
                          to={`/contract/${del.contract_id}`}
                          className="text-xs font-bold text-indigo-700 hover:text-indigo-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open Contract Tracker &rarr;
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDispatchModalData({ delivery: del, contract: { id: del.contract_id, crop: del.crop } })}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg border border-indigo-200 flex items-center gap-1 cursor-pointer transition"
                        >
                          <Navigation className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Live Sat-Nav Map</span>
                        </button>
                      </div>

                      {del.status === 'Scheduled' && (
                        <button
                          onClick={() => handleAdvanceDelivery(del.id, 'In Transit')}
                          disabled={updatingDeliveryId === del.id}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {updatingDeliveryId === del.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Truck className="w-3.5 h-3.5" />
                          )}
                          Record Highway Dispatch (In Transit)
                        </button>
                      )}

                      {del.status === 'In Transit' && (
                        <button
                          onClick={() => handleAdvanceDelivery(del.id, 'Delivered')}
                          disabled={updatingDeliveryId === del.id}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {updatingDeliveryId === del.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          Confirm Weighbridge QA &amp; Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 5: SOURCING DEMANDS */}
      {activeSubTab === 'demands' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-600" />
                Institutional Sourcing Requirements
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage all active crop procurement requirements and trigger real-time multi-factor AI agronomic matchmaking.
              </p>
            </div>

            <button
              onClick={() => handleTabChange('matching')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Post New Requirement
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processors.map((p) => {
              const isSelected = p.id === selectedProcessorId;
              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs transition space-y-4 flex flex-col justify-between ${
                    isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {p.required_grade || 'Grade A'}
                        </span>
                        <h4 className="text-lg font-extrabold text-slate-900 mt-1">{p.required_crop}</h4>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Target Rate</div>
                        <div className="text-base font-extrabold text-emerald-700 font-mono">
                          ₹{Math.round((p.target_price_per_ton || 0) / 10).toLocaleString('en-IN')} <span className="text-xs font-normal">/ Qtl</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600 border border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Consumer Unit:</span>
                        <strong className="text-slate-800 truncate max-w-[170px]">{p.company_name}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Quantity Needed:</span>
                        <strong className="text-slate-900 font-mono">
                          {(p.quantity_needed_tons || 0) * 10} Quintals ({p.quantity_needed_tons} MT)
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Sourcing Radius:</span>
                        <span>{p.max_distance_km || 100} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Delivery Deadline:</span>
                        <span>{p.deadline || '2026-11-30'}</span>
                      </div>
                    </div>

                    {p.location?.address && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{p.location.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setSelectedProcessorId(p.id);
                        handleTabChange('matching');
                      }}
                      className={`w-full py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-emerald-600 hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {isSelected ? 'Active Demand (Matchmaker Running)' : 'Select & Run AI Matchmaker'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 6: CORPORATE PROFILE & SOURCING CAPACITY */}
      {activeSubTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Facility Specifications Form (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-600" />
                  Corporate Food Processing Facility Specifications
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your milling enterprise details, regulatory licenses, and factory logistics address.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                Institutional License Verified
              </span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Enterprise / Milling Company Name
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.company_name}
                  onChange={(e) => setProfileForm({ ...profileForm, company_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    GSTIN Number
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.gst_number}
                    onChange={(e) => setProfileForm({ ...profileForm, gst_number: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    FSSAI Central License
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.fssai_license}
                    onChange={(e) => setProfileForm({ ...profileForm, fssai_license: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Annual Milling Capacity (Tons / Year)
                  </label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={profileForm.processing_capacity_tons}
                    onChange={(e) => setProfileForm({ ...profileForm, processing_capacity_tons: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Corporate Contact Phone
                  </label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Processing Hub / Silo Address
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={profileForm.latitude}
                    onChange={(e) => setProfileForm({ ...profileForm, latitude: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={profileForm.longitude}
                    onChange={(e) => setProfileForm({ ...profileForm, longitude: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  {profileSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Saving Facility Specs...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Save Facility Specifications
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Sourcing Intake Toggle & Compliance (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Power className="w-4 h-4 text-emerald-600" />
                Sourcing Intake Service Control
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                When ACTIVE, matched farmers can view your corporate demands and dispatch harvest consignments directly to your intake weighbridge.
              </p>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Status:</span>
                <button
                  onClick={handleToggleService}
                  className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs uppercase shadow-xs flex items-center gap-1.5 transition cursor-pointer ${
                    isServiceActive
                      ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  {isServiceActive ? 'ACTIVE (ON)' : 'PAUSED (OFF)'}
                </button>
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xs space-y-3 border border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase">
                <ShieldCheck className="w-4 h-4" />
                Compliance &amp; FSSAI QA Standard
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                All forward purchase agreements generated on FarmSphere enforce Indian Contract Act 1872 standard covenants, Mandi lab moisture tolerances, and certified weighbridge escrow settlement.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Procurement Offer Confirmation Modal */}
      {procureModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-bold">Send Procurement Request</h3>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Deliver procurement offer to farmer. Contract and logistics activate upon farmer acceptance.
                </p>
              </div>
              <button
                onClick={() => setProcureModalItem(null)}
                className="text-white/70 hover:text-white text-xl font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Item summary */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Commodity:</span>
                  <strong className="text-slate-900 text-sm">{procureModalItem.crop_name} ({procureModalItem.grade})</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Farmer / Owner:</span>
                  <strong className="text-slate-800">{procureModalItem.farmer_name}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Farmer Asking Rate:</span>
                  <span className="font-bold text-emerald-700 font-mono">₹{procureModalItem.price_per_quintal.toLocaleString('en-IN')} / Quintal</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Available in Silo:</span>
                  <span className="font-mono font-bold">{procureModalItem.quantity_quintals} Quintals</span>
                </div>
              </div>

              {/* Quantity selector */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Requested Procurement Volume (Quintals)
                </label>
                <input
                  type="number"
                  min="1"
                  max={procureModalItem.quantity_quintals}
                  value={procureQuantity}
                  onChange={(e) => setProcureQuantity(Math.min(procureModalItem.quantity_quintals, Math.max(1, Number(e.target.value))))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold font-mono focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Available lot: {procureModalItem.quantity_quintals} Quintals ({Math.round(procureModalItem.quantity_quintals / 10)} Metric Tons)
                </p>
              </div>

              {/* Total Consideration calculation */}
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">Total Purchase Consideration:</span>
                <span className="text-base font-extrabold text-emerald-800 font-mono">
                  ₹{(procureQuantity * procureModalItem.price_per_quintal).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Notes / Instructions for Farmer (Optional)
                </label>
                <textarea
                  rows="2"
                  value={procureNotes}
                  onChange={(e) => setProcureNotes(e.target.value)}
                  placeholder="Specify delivery timeline, transport arrangements, etc."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Process explanation banner */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Two-Step Agreement Flow:</strong> When you submit, this request goes to <strong>{procureModalItem.farmer_name}</strong>'s Forward Contracts space. Once the farmer accepts the request, the formal contract and logistics dispatch will go on.
                </span>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setProcureModalItem(null)}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={procureSubmitting}
                  onClick={handleConfirmProcurementRequest}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {procureSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Send Request to Farmer &rarr;</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Viewer Modal for Consumers */}
      {selectedReportItem && (
        <ReportViewerModal
          item={selectedReportItem}
          onClose={() => setSelectedReportItem(null)}
        />
      )}

      {/* 30% Advance Escrow Payment Modal */}
      {advanceModalContract && (
        <AdvancePaymentModal
          contract={advanceModalContract}
          onClose={() => setAdvanceModalContract(null)}
          onSuccess={(updatedContract, delivery) => {
            loadContracts();
            loadDeliveries();
          }}
          onTrackDispatch={(delivery) => {
            setDispatchModalData({ delivery, contract: advanceModalContract });
          }}
        />
      )}

      {/* Live Dispatch Location & GPS Telemetry Tracker Modal */}
      {dispatchModalData && (
        <DispatchTrackingModal
          delivery={dispatchModalData.delivery}
          contract={dispatchModalData.contract}
          onClose={() => setDispatchModalData(null)}
          onRefresh={() => {
            loadContracts();
            loadDeliveries();
          }}
        />
      )}

      {/* Official Escrow Settlement Bill & Tax Invoice Modal */}
      {viewingBillContract && (
        <EscrowBillModal
          contract={viewingBillContract}
          onClose={() => setViewingBillContract(null)}
          onTrackDispatch={(contract) => {
            setViewingBillContract(null);
            setDispatchModalData({ contract });
          }}
        />
      )}
    </div>
  );
}
