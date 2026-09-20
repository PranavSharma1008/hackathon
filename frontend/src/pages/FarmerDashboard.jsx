import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Tractor,
  Layers,
  MapPin,
  Scale,
  History,
  FileText,
  Truck,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Droplets,
  Activity,
  Award,
  ChevronRight,
  ArrowUpRight,
  Store,
  IndianRupee,
  Package,
  Warehouse,
  Calendar,
  LogOut,
  RefreshCw,
  UserCheck,
  Power,
  XCircle,
  Pencil,
  Check,
  Sparkles,
  Search,
  X,
  UploadCloud,
  FileCheck,
  Eye,
  Download,
  Navigation
} from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getAiSuggestedLocalNames, matchProduceWithAi } from '../utils/aiCropSynonyms';
import ReportViewerModal from '../components/ReportViewerModal';
import DispatchTrackingModal from '../components/DispatchTrackingModal';
import EscrowBillModal from '../components/EscrowBillModal';
import { generateCertifiedAssayPdf } from '../utils/reportUtils';

export const STANDARD_CROPS = [
  'Yellow Corn / Maize',
  'Sharbati Wheat',
  'Basmati Rice (Pusa 1121)',
  'Potato (Kufri Chipsona)',
  'Mustard Seed (Sarson)',
  'Soybean (JS 335)',
  'Cotton (Medium Staple)',
  'Chickpea / Bengal Gram (Chana)',
  'Pearl Millet (Bajra)',
  'Pigeon Pea / Tur Dal',
  'Sugarcane'
];

export const SOIL_METRICS_DATABASE = {
  'Loamy': {
    ph_index: 6.8,
    ph_label: 'Optimal Neutral',
    organic_carbon: 1.24,
    carbon_label: 'Rich Humus',
    nitrogen_kg_ha: 290,
    nitrogen_label: 'High Yield',
    phosphorus_kg_ha: 22.4,
    phosphorus_label: 'Optimal Tuber Growth',
    suitable_crops: ['Sharbati Wheat', 'Yellow Corn / Maize', 'Mustard Seed'],
    badge_color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dot_color: 'bg-emerald-500'
  },
  'Sandy Loam': {
    ph_index: 6.2,
    ph_label: 'Slightly Acidic (Ideal Tubers)',
    organic_carbon: 0.95,
    carbon_label: 'Aerated & Well-Drained',
    nitrogen_kg_ha: 240,
    nitrogen_label: 'Steady Nutrition',
    phosphorus_kg_ha: 31.2,
    phosphorus_label: 'Peak Root/Tuber Growth',
    suitable_crops: ['Potato (Kufri Chipsona)', 'Groundnut', 'Carrots'],
    badge_color: 'bg-amber-100 text-amber-800 border-amber-300',
    dot_color: 'bg-amber-500'
  },
  'Alluvial': {
    ph_index: 7.1,
    ph_label: 'Optimal Alkaline Neutral',
    organic_carbon: 1.45,
    carbon_label: 'Deep Fertile Silt',
    nitrogen_kg_ha: 320,
    nitrogen_label: 'Ultra High Yield',
    phosphorus_kg_ha: 26.0,
    phosphorus_label: 'Rich Mineralization',
    suitable_crops: ['Basmati Rice', 'Sugarcane', 'Wheat'],
    badge_color: 'bg-blue-100 text-blue-800 border-blue-300',
    dot_color: 'bg-blue-500'
  },
  'Clay': {
    ph_index: 7.4,
    ph_label: 'Moisture Retentive',
    organic_carbon: 1.38,
    carbon_label: 'Dense Organic Base',
    nitrogen_kg_ha: 305,
    nitrogen_label: 'Nutrient Dense',
    phosphorus_kg_ha: 18.2,
    phosphorus_label: 'Standard Available',
    suitable_crops: ['Basmati Rice (Pusa 1121)', 'Paddy Rice', 'Pulses'],
    badge_color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    dot_color: 'bg-indigo-500'
  },
  'Black': {
    ph_index: 7.8,
    ph_label: 'High Lime Regur Base',
    organic_carbon: 1.15,
    carbon_label: 'Self-Ploughing Humus',
    nitrogen_kg_ha: 265,
    nitrogen_label: 'Sustained Organic Nitrogen',
    phosphorus_kg_ha: 20.4,
    phosphorus_label: 'Deep Root Aeration',
    suitable_crops: ['Cotton (Medium Staple)', 'Soybean (JS 335)', 'Chickpea'],
    badge_color: 'bg-purple-100 text-purple-800 border-purple-300',
    dot_color: 'bg-purple-500'
  },
  'Sandy': {
    ph_index: 6.5,
    ph_label: 'Coarse Permeable',
    organic_carbon: 0.72,
    carbon_label: 'Light Texture',
    nitrogen_kg_ha: 210,
    nitrogen_label: 'Quick Responsive',
    phosphorus_kg_ha: 16.5,
    phosphorus_label: 'Low Fixation',
    suitable_crops: ['Mustard Seed (Sarson)', 'Pearl Millet (Bajra)', 'Guar'],
    badge_color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    dot_color: 'bg-yellow-500'
  },
  'Red Soil': {
    ph_index: 6.0,
    ph_label: 'Iron Oxide Rich',
    organic_carbon: 0.88,
    carbon_label: 'Porous Structure',
    nitrogen_kg_ha: 230,
    nitrogen_label: 'Balanced Base',
    phosphorus_kg_ha: 19.8,
    phosphorus_label: 'Moderate Fixed',
    suitable_crops: ['Groundnut', 'Millets', 'Pigeon Pea / Tur Dal'],
    badge_color: 'bg-rose-100 text-rose-800 border-rose-300',
    dot_color: 'bg-rose-500'
  }
};

export default function FarmerDashboard() {
  const {
    user,
    login,
    register,
    logout,
    isAuthenticated,
    isFarmer,
    isAdmin,
    updateFarmerProfile,
    isServiceActive,
    toggleServiceStatus
  } = useAuth();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState(
    tabParam && ['store', 'contracts', 'deliveries'].includes(tabParam) ? tabParam : 'store'
  ); // 'store', 'contracts', 'deliveries'
  const [previewMode, setPreviewMode] = useState(false);

  // Sync tab with URL search parameter (?tab=...)
  useEffect(() => {
    if (tabParam && ['store', 'contracts', 'deliveries'].includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    } else if (tabParam === 'profile') {
      setActiveTab('store');
    }
  }, [tabParam]);

  function handleTabChange(tabKey) {
    setActiveTab(tabKey);
    navigate(`/farmer?tab=${tabKey}`, { replace: true });
  }
  const [farmer, setFarmer] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [storeItems, setStoreItems] = useState([]);
  const [storeStats, setStoreStats] = useState({ total_items: 0, available_quintals: 0, total_inventory_value_inr: 0 });

  const [loadingData, setLoadingData] = useState(false);
  const [loadingStore, setLoadingStore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [error, setError] = useState(null);

  // Unauthenticated Form States
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authSoilType, setAuthSoilType] = useState('Loamy');
  const [authAcreage, setAuthAcreage] = useState(35);
  const [authAddress, setAuthAddress] = useState('GT Road Farmlands, Khanna, Punjab');
  const [authPrimaryCrop, setAuthPrimaryCrop] = useState('Wheat');
  const [authStep, setAuthStep] = useState(1);
  const [authLoading, setAuthLoading] = useState(false);

  // New Store Item Form Modal / State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCustomCrop, setIsCustomCrop] = useState(false);
  const [isCustomSoil, setIsCustomSoil] = useState(false);
  const [selectedReportItem, setSelectedReportItem] = useState(null);
  const [dispatchModalData, setDispatchModalData] = useState(null);
  const [viewingBillContract, setViewingBillContract] = useState(null);
  const [newProduce, setNewProduce] = useState({
    crop_name: 'Yellow Corn / Maize',
    grade: 'Grade A',
    quantity_quintals: 200,
    price_per_quintal: 2450,
    storage_type: 'Farm Silo',
    harvest_date: new Date().toISOString().split('T')[0],
    moisture_percentage: 11.2,
    soil_type: 'Loamy',
    local_names: 'makka, makki, yellow makka, yellow makki, bhutta',
    report_document: '',
    report_file_name: '',
    notes: 'Premium harvest, stored in clean hermetic condition.'
  });

  // Edit Store Item Modal State (Single Edit Modal for all listing parameters)
  const [editingItem, setEditingItem] = useState(null);
  const [editCropName, setEditCropName] = useState('');
  const [isEditCustomCrop, setIsEditCustomCrop] = useState(false);
  const [editSoilType, setEditSoilType] = useState('Loamy');
  const [isEditCustomSoil, setIsEditCustomSoil] = useState(false);
  const [editLocalNames, setEditLocalNames] = useState('');
  const [editRate, setEditRate] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editGrade, setEditGrade] = useState('Grade A');
  const [editStorageType, setEditStorageType] = useState('Farm Silo');
  const [editMoisture, setEditMoisture] = useState(11.2);
  const [editHarvestDate, setEditHarvestDate] = useState('');
  const [editReportDocument, setEditReportDocument] = useState('');
  const [editReportFileName, setEditReportFileName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [farmerStoreSearch, setFarmerStoreSearch] = useState('');

  // Profile Form State for Editing Own Profile
  const [profileForm, setProfileForm] = useState({
    name: '',
    soil_type: 'Loamy',
    total_acreage: 45,
    address: '',
    phone: '',
    past_yield_history: []
  });

  useEffect(() => {
    if ((isAuthenticated && (isFarmer || isAdmin)) || previewMode) {
      loadMyFarmData();
    }
  }, [isAuthenticated, isFarmer, isAdmin, previewMode, user]);

  async function loadMyFarmData() {
    setLoadingData(true);
    setError(null);
    try {
      // 1. Fetch farmer profile tied to logged in user
      let myFarmer = null;
      const res = await api.getFarmers();
      const allFarmers = res.data || [];

      if (user?.farmer_id) {
        myFarmer = allFarmers.find((f) => f.id === user.farmer_id);
      }
      if (!myFarmer && user?.email) {
        myFarmer = allFarmers.find(
          (f) => f.email?.toLowerCase() === user.email.toLowerCase() ||
                 f.name?.toLowerCase() === user.name?.toLowerCase()
        );
      }
      if (!myFarmer && user?.farmer_profile) {
        myFarmer = user.farmer_profile;
      }
      // If admin, preview mode, or no specific farmer profile matched, pick first available farmer so dashboard loads seamlessly
      if (!myFarmer && allFarmers.length > 0) {
        myFarmer = allFarmers[0];
      }

      if (myFarmer) {
        setFarmer(myFarmer);
        // 2. Fetch contracts strictly for this farmer
        const contractsRes = await api.getContracts({ farmer_id: myFarmer.id });
        const farmerContracts = contractsRes.data || [];
        setContracts(farmerContracts);

        // 3. Fetch deliveries strictly for this farmer
        const deliveriesRes = await api.getDeliveries();
        const contractIds = new Set(farmerContracts.map((c) => c.id));
        const farmerDeliveries = (deliveriesRes.data || []).filter(
          (d) => contractIds.has(d.contract_id) || d.farmer_name === myFarmer.name
        );
        setDeliveries(farmerDeliveries);

        // 4. Fetch store items strictly for this farmer
        loadFarmerStore(myFarmer.id);
      }
    } catch (err) {
      console.error('Failed to load farm data:', err);
      setError('Could not retrieve farm profile. Please verify your connection.');
    } finally {
      setLoadingData(false);
    }
  }

  async function loadFarmerStore(farmerId) {
    if (!farmerId) return;
    setLoadingStore(true);
    try {
      const res = await fetch(`/api/farmers/${farmerId}/store`);
      if (res.ok) {
        const json = await res.json();
        setStoreItems(json.data || []);
        if (json.stats) {
          setStoreStats(json.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load farmer store:', err);
    } finally {
      setLoadingStore(false);
    }
  }

  function handleReportFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setNewProduce((prev) => ({
        ...prev,
        report_document: reader.result,
        report_file_name: file.name
      }));
    };
    reader.readAsDataURL(file);
  }

  function handleEditReportFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setEditReportDocument(reader.result);
      setEditReportFileName(file.name);
    };
    reader.readAsDataURL(file);
  }

  async function handleAddStoreItem(e) {
    if (e) e.preventDefault();
    const targetFarmerId = farmer?.id || user?.farmer_id || (user?.role === 'farmer' ? `farm_${user.id?.replace('user_', '')}` : null);
    if (!targetFarmerId) {
      setError('Farmer profile could not be resolved. Please reload page or re-login.');
      return;
    }

    if (!newProduce.report_document) {
      setError('⚠️ Mandatory: A Soil & Crop Quality Assay Report (PDF or document file) is required to list this commodity. Please upload a file or click "Auto-Generate Certified Lab Assay PDF".');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/farmers/${targetFarmerId}/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduce)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add produce to store');
      }

      setSuccessMsg(data.message || 'Produce added to store inventory successfully!');
      setShowAddModal(false);
      setFarmerStoreSearch(''); // Clear search so newly added product is never filtered out
      await loadFarmerStore(targetFarmerId);
      await loadMyFarmData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteStoreItem(itemId) {
    if (!window.confirm('Remove this commodity from your active store inventory?')) return;
    try {
      const res = await fetch(`/api/store/${itemId}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMsg('Item removed from store inventory.');
        if (farmer?.id) {
          loadFarmerStore(farmer.id);
        }
      }
    } catch (err) {
      console.error('Failed to delete store item:', err);
    }
  }

  function handleOpenAddModal() {
    setIsCustomCrop(false);
    setIsCustomSoil(false);
    const defaultCrop = STANDARD_CROPS[0];
    const defaultSoil = farmer?.soil_type || 'Loamy';
    const samplePdf = generateCertifiedAssayPdf({
      farmerName: farmer?.name || 'Registered Agronomist',
      cropName: defaultCrop,
      soilType: defaultSoil,
      grade: 'Grade A',
      quantityQuintals: 200,
      pricePerQuintal: 2450
    });

    setNewProduce({
      crop_name: defaultCrop,
      grade: 'Grade A',
      quantity_quintals: 200,
      price_per_quintal: 2450,
      storage_type: 'Farm Silo',
      harvest_date: new Date().toISOString().split('T')[0],
      moisture_percentage: 11.2,
      soil_type: defaultSoil,
      local_names: getAiSuggestedLocalNames(defaultCrop),
      report_document: samplePdf,
      report_file_name: 'APMC_Certified_Assay_Report.pdf',
      notes: 'Premium harvest, stored in clean hermetic condition.'
    });
    setShowAddModal(true);
  }

  function handleOpenEditModal(item) {
    setEditingItem(item);
    const crop = item.crop_name || '';
    setEditCropName(crop);
    setIsEditCustomCrop(!STANDARD_CROPS.includes(crop));
    const currentSoil = item.soil_type || farmer?.soil_type || 'Loamy';
    setEditSoilType(currentSoil);
    setIsEditCustomSoil(!['Loamy', 'Sandy Loam', 'Alluvial', 'Clay', 'Black', 'Sandy', 'Red Soil'].includes(currentSoil));
    setEditLocalNames(item.local_names || getAiSuggestedLocalNames(crop));
    setEditRate(item.price_per_quintal || '');
    setEditQuantity(item.quantity_quintals || '');
    setEditGrade(item.grade || 'Grade A');
    setEditStorageType(item.storage_type || 'Farm Silo');
    setEditMoisture(item.moisture_percentage ?? 11.2);
    setEditHarvestDate(item.harvest_date || '');
    setEditReportDocument(item.report_document || '');
    setEditReportFileName(item.report_file_name || '');
    setEditNotes(item.notes || '');
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!editingItem?.id) return;
    setSavingEdit(true);
    setError(null);

    try {
      const res = await fetch(`/api/store/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop_name: editCropName,
          local_names: editLocalNames,
          price_per_quintal: Number(editRate),
          quantity_quintals: Number(editQuantity),
          grade: editGrade,
          storage_type: editStorageType,
          moisture_percentage: Number(editMoisture),
          harvest_date: editHarvestDate,
          soil_type: editSoilType || 'Loamy',
          report_document: editReportDocument,
          report_file_name: editReportFileName,
          notes: editNotes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update store listing');
      }

      setSuccessMsg(`Listing for ${editCropName} updated successfully!`);
      setEditingItem(null);
      if (farmer?.id) {
        loadFarmerStore(farmer.id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleToggleService() {
    try {
      const nextStatus = await toggleServiceStatus();
      setSuccessMsg(`Farming services are now ${nextStatus ? 'ACTIVE (ON)' : 'PAUSED (OFF)'}`);
      loadMyFarmData();
    } catch (err) {
      setError(err.message || 'Failed to toggle service status');
    }
  }

  async function handleServeContract(contractId) {
    try {
      const res = await fetch(`/api/contracts/${contractId}/serve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ served_by: 'farmer' })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Contract request served and accepted!');
        loadMyFarmData();
      } else {
        setError(data.error || 'Failed to serve contract request');
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCancelContract(contractId) {
    const reason = window.prompt('Enter reason for declining / cancelling this contract:');
    if (!reason) return;
    try {
      const res = await fetch(`/api/contracts/${contractId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelled_by: 'farmer', reason })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Contract request cancelled.');
        loadMyFarmData();
      } else {
        setError(data.error || 'Failed to cancel contract request');
      }
    } catch (err) {
      setError(err.message);
    }
  }

  // Handle Authentication for unauthenticated users
  async function handleLogin(e) {
    e.preventDefault();
    setAuthLoading(true);
    setError(null);
    try {
      await login(authEmail, authPassword);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your email and password.');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setAuthLoading(true);
    setError(null);
    try {
      await register({
        name: authName,
        email: authEmail,
        password: authPassword,
        phone: authPhone,
        role: 'farmer',
        soil_type: authSoilType,
        total_acreage: Number(authAcreage),
        address: authAddress,
        latitude: 30.7073,
        longitude: 76.2167,
        past_yield_history: [
          { crop: authPrimaryCrop, tons: Math.round(Number(authAcreage) * 1.2), year: 2024, grade: 'Grade A' }
        ]
      });
    } catch (err) {
      setError(err.message || 'Registration failed.');
      if (err.message?.includes('already exists')) {
        setAuthStep(1);
      }
    } finally {
      setAuthLoading(false);
    }
  }

  // -------------------------------------------------------------
  // UNAUTHENTICATED OR NON-FARMER GATE (WITH 1-CLICK DEMO LOGINS & PREVIEW)
  // -------------------------------------------------------------
  if ((!isAuthenticated || (!isFarmer && !isAdmin)) && !previewMode) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 rounded-3xl p-8 text-white shadow-xl text-center border border-emerald-800">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
            <Tractor className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Farmer Operations Gateway</h1>
          <p className="text-slate-300 text-sm mt-2 max-w-md mx-auto leading-relaxed">
            Manage your produce store inventory, set ₹/Quintal selling prices, monitor soil metrics, and track forward buyback contracts.
          </p>

          {/* Instant 1-Click Demo Logins */}
          <div className="mt-6 pt-6 border-t border-emerald-800/60 max-w-md mx-auto">
            <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-3">
              ⚡ Instant 1-Click Demo Farmer Access:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={async () => {
                  setError(null);
                  setAuthLoading(true);
                  try {
                    await login('kartikey@gmail.com', 'kartikey@gmail.com');
                  } catch (err) {
                    setError(err.message);
                  } finally {
                    setAuthLoading(false);
                  }
                }}
                className="p-3 bg-white/10 hover:bg-white/20 border border-emerald-400/40 rounded-xl text-left transition cursor-pointer"
              >
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Tractor className="w-3.5 h-3.5 text-emerald-400" />
                  Kartikey Patel
                </div>
                <div className="text-[10px] text-emerald-200 mt-0.5">Verified Wheat Farmer</div>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setError(null);
                  setAuthLoading(true);
                  try {
                    await login('balwinder@punjabfarm.in', 'farmer123');
                  } catch (err) {
                    setError(err.message);
                  } finally {
                    setAuthLoading(false);
                  }
                }}
                className="p-3 bg-white/10 hover:bg-white/20 border border-emerald-400/40 rounded-xl text-left transition cursor-pointer"
              >
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Tractor className="w-3.5 h-3.5 text-teal-400" />
                  Balwinder Sandhu
                </div>
                <div className="text-[10px] text-teal-200 mt-0.5">Top Agronomic Match</div>
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
            <h3 className="font-bold text-slate-900 text-lg">Farmer Gateway</h3>
            <button
              type="button"
              onClick={() => setPreviewMode(true)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Explore Dashboard in Preview Mode &rarr;
            </button>
          </div>

          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => {
                setAuthMode('login');
                setError(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                authMode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              Farmer Sign In
            </button>
            <button
              onClick={() => {
                setAuthMode('register');
                setError(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                authMode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              Register New Farm
            </button>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Farmer Email
                </label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="e.g. kartikey@gmail.com"
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
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={authLoading}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {authLoading ? 'Verifying Account...' : 'Sign In to Farm Dashboard'}
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
          ) : authStep === 1 ? (
            <form onSubmit={(e) => { e.preventDefault(); setAuthStep(2); }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Farmer Name
                </label>
                <input
                  type="text"
                  required
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="e.g. Navjot Singh Dhaliwal"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="e.g. navjot.dhaliwal@kisan.in"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Checks database uniqueness. Duplicate accounts with same email are rejected.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Password (Min 6 chars)
                  </label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    placeholder="+91-98880-11223"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                Continue to Farmland Requirements &rarr;
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Soil Classification
                  </label>
                  <select
                    value={authSoilType}
                    onChange={(e) => setAuthSoilType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="Loamy">Loamy (Ideal for Wheat)</option>
                    <option value="Sandy Loam">Sandy Loam (Potato)</option>
                    <option value="Alluvial">Alluvial (High Fertility)</option>
                    <option value="Clay">Clay (Rice)</option>
                    <option value="Black">Black (Cotton/Soybean)</option>
                    <option value="Sandy">Sandy (Mustard/Coarse)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Total Acreage
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={authAcreage}
                    onChange={(e) => setAuthAcreage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Farm Address &amp; District
                </label>
                <input
                  type="text"
                  required
                  value={authAddress}
                  onChange={(e) => setAuthAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Primary Crop Cultivated
                </label>
                <select
                  value={authPrimaryCrop}
                  onChange={(e) => setAuthPrimaryCrop(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                >
                  <option value="Wheat">Wheat</option>
                  <option value="Potato">Potato</option>
                  <option value="Rice">Basmati Rice</option>
                  <option value="Soybean">Soybean</option>
                  <option value="Mustard">Mustard</option>
                  <option value="Corn">Corn / Maize</option>
                  <option value="Cotton">Cotton</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAuthStep(1)}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-emerald-600/20"
                >
                  {authLoading ? 'Storing in Database...' : 'Register Farm & Access Portal'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // AUTHENTICATED FARMER VIEW: STRICTLY ISOLATED TO THIS FARMER
  // -------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner - Strict Security Identity */}
      <div className="bg-gradient-to-r from-emerald-900 via-green-800 to-emerald-900 rounded-3xl p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden border border-emerald-700/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-500/40 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              Secured Private Farm Operations Portal
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {farmer ? farmer.name : user?.name}'s Farmland &amp; Store
            </h1>
            <p className="mt-2 text-emerald-100 text-sm sm:text-base max-w-2xl leading-relaxed font-light">
              Your agricultural commodities, soil specifications, and buyback agreements are securely isolated to your account.
            </p>
          </div>

          {/* User Profile Pill & Log Out & Service Toggle */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 sm:min-w-[280px] shadow-lg text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-emerald-300 font-bold uppercase tracking-wider">Account Active:</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white font-mono font-bold text-[10px]">
                {farmer?.id || 'Verified'}
              </span>
            </div>

            {/* Service Toggle Switch */}
            <div className="flex items-center justify-between bg-black/20 p-2 rounded-xl border border-white/10">
              <div className="text-[11px] font-semibold text-emerald-200 flex items-center gap-1.5">
                <Power className="w-3.5 h-3.5" />
                <span>Service Mode:</span>
              </div>
              <button
                onClick={handleToggleService}
                className={`px-3 py-1 rounded-lg font-extrabold text-[10px] uppercase transition-all shadow-xs flex items-center gap-1 ${
                  isServiceActive
                    ? 'bg-emerald-400 text-emerald-950 ring-2 ring-emerald-300/50'
                    : 'bg-rose-500 text-white'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isServiceActive ? 'bg-emerald-950' : 'bg-white'} animate-pulse`} />
                {isServiceActive ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="font-bold text-white text-sm">{user?.name}</div>
            <div className="text-emerald-200 font-mono text-[11px] truncate">{user?.email}</div>
            <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[11px]">
              <span className="text-emerald-300">
                {farmer?.soil_type} &bull; {farmer?.total_acreage} Acres
              </span>
              <button
                onClick={() => logout()}
                className="text-rose-300 hover:text-white font-semibold flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" /> Log Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Service OFF Alert Banner */}
      {!isServiceActive && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-amber-900 text-xs font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Power className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              <strong>Farming Service is currently turned OFF:</strong> You are not receiving new matching requests or trade orders. Turn service ON to accept contracts.
            </span>
          </div>
          <button
            onClick={handleToggleService}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shrink-0 shadow-xs"
          >
            Turn Service ON Now
          </button>
        </div>
      )}

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

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">My Store Inventory</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1 flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-600" />
            {storeStats.available_quintals.toLocaleString('en-IN')} Qtl
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Available for buyback
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Total Store Valuation</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 flex items-center gap-1">
            ₹{storeStats.total_inventory_value_inr.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            At farmer set prices
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">My Farmland Area</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-600" />
            {farmer?.total_acreage || 0} Acres
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1 truncate" title={farmer?.soil_types?.join(', ') || farmer?.soil_type || 'Loamy'}>
            Soil: {farmer?.soil_types?.join(', ') || farmer?.soil_type || 'Loamy'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">My Forward Contracts</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            {contracts.length}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            {contracts.filter((c) => c.status === 'Pending').length} pending signature
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-6 overflow-x-auto pb-px">
        <button
          onClick={() => handleTabChange('store')}
          className={`pb-3.5 px-2 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition shrink-0 cursor-pointer ${
            activeTab === 'store'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>My Produce Store &amp; Inventory</span>
          <span className="px-2 py-0.5 text-[11px] bg-emerald-100 text-emerald-800 rounded-full font-bold">
            {storeItems.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('contracts')}
          className={`pb-3.5 px-2 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition shrink-0 cursor-pointer ${
            activeTab === 'contracts'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Forward Contracts</span>
          <span className="px-2 py-0.5 text-[11px] bg-blue-100 text-blue-800 rounded-full font-bold">
            {contracts.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('deliveries')}
          className={`pb-3.5 px-2 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition shrink-0 cursor-pointer ${
            activeTab === 'deliveries'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4 text-indigo-600" />
          <span>Logistics &amp; Dispatch</span>
          <span className="px-2 py-0.5 text-[11px] bg-indigo-100 text-indigo-800 rounded-full font-bold">
            {deliveries.length}
          </span>
        </button>
      </div>

      {/* TAB 1: PRODUCE STORE */}
      {activeTab === 'store' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Store className="w-6 h-6 text-emerald-600" />
                Commodities in Store
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Add stored agricultural crops and set your direct selling prices in ₹ per Quintal (100 kg). Bulk consumers can procure directly.
              </p>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Commodity to My Store
            </button>
          </div>

          {/* Store search bar with AI vernacular tag matching */}
          {storeItems.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600" />
                <input
                  type="text"
                  placeholder="Search my store or tags (e.g. makka, makki)..."
                  value={farmerStoreSearch}
                  onChange={(e) => setFarmerStoreSearch(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white font-medium"
                />
                {farmerStoreSearch && (
                  <button
                    type="button"
                    onClick={() => setFarmerStoreSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>AI Vernacular Tag Matching Active</span>
              </div>
            </div>
          )}

          {loadingStore ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              Loading your store inventory...
            </div>
          ) : storeItems.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">Your store is currently empty</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
                List harvested wheat, rice, potato, or mustard with stock in Quintals and your target rate in ₹/Qtl.
              </p>
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition"
              >
                + Add First Commodity
              </button>
            </div>
          ) : storeItems.filter((item) => matchProduceWithAi(item, farmerStoreSearch).matches).length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-slate-500 text-sm">
              No commodities match "{farmerStoreSearch}". Try searching by crop name or regional tags (e.g. makka, makki, gehun, aloo).
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {storeItems.filter((item) => matchProduceWithAi(item, farmerStoreSearch).matches).map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-400 hover:shadow-md transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">{item.crop_name}</h3>
                        <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                          {item.storage_type}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {item.grade}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-slate-500 font-medium">Available Quantity:</span>
                        <span className="text-base font-bold text-slate-900">
                          {item.quantity_quintals.toLocaleString('en-IN')} Quintals
                        </span>
                      </div>

                      <div className="flex justify-between items-baseline border-t border-slate-200/60 pt-2">
                        <span className="text-xs text-slate-500 font-medium">My Asking Rate:</span>
                        <span className="text-lg font-extrabold text-emerald-700">
                          ₹{item.price_per_quintal.toLocaleString('en-IN')} <span className="text-xs font-normal">/ Qtl</span>
                        </span>
                      </div>

                      <div className="flex justify-between items-baseline border-t border-slate-200/60 pt-2">
                        <span className="text-xs text-slate-400">Total Lot Value:</span>
                        <span className="text-xs font-mono font-bold text-slate-700">
                          ₹{item.total_value_inr.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Local Vernacular Names / Regional Tags */}
                    {item.local_names && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.local_names.split(',').map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200/70"
                          >
                            #{tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                      <div>
                        <span className="text-slate-400">Moisture:</span>{' '}
                        <strong>{item.moisture_percentage}%</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Harvest Date:</span>{' '}
                        <span>{item.harvest_date || 'N/A'}</span>
                      </div>
                      <div className="col-span-2 flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="text-slate-500 font-medium">Cultivated In Soil:</span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 font-bold border border-amber-200/80 text-[10px] inline-flex items-center gap-1">
                          🌱 {item.soil_type || 'Loamy'} Soil
                        </span>
                      </div>
                    </div>

                    {/* Mandatory Quality & Soil Assay Report (PDF) */}
                    {item.report_document ? (
                      <div className="flex items-center justify-between p-2.5 bg-emerald-50/90 border border-emerald-200 rounded-xl text-xs">
                        <div className="flex items-center gap-2 text-emerald-900 font-semibold truncate">
                          <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate">{item.report_file_name || 'Assay_Report.pdf'}</span>
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
                      <div className="flex items-center justify-between p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
                        <span>⚠️ Assay certificate pending</span>
                      </div>
                    )}

                    {item.notes && (
                      <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded-lg border border-slate-100">
                        "{item.notes}"
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Listed in Store
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition flex items-center gap-1 shadow-xs"
                        title="Edit all listing details"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit Listing
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStoreItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                        title="Remove commodity from store"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FORWARD CONTRACTS */}
      {activeTab === 'contracts' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Forward Buyback Contracts
              </h3>
              <p className="text-xs text-slate-500">
                Institutional buyback contracts issued to your farm
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              {contracts.length} Agreements
            </span>
          </div>

          {contracts.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-600">No contracts on file for your farm</div>
              <p className="text-xs text-slate-400 mt-1">
                When a verified consumer matches with your stored produce, contract offers will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  className={`p-5 rounded-2xl border transition bg-white space-y-3 ${
                    contract.status === 'Pending'
                      ? 'border-amber-300 ring-2 ring-amber-300/30 bg-amber-50/20'
                      : 'border-slate-200 hover:border-emerald-400'
                  }`}
                >
                  {/* Status Banner */}
                  {contract.status === 'Pending' && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs font-semibold flex items-start sm:items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                      <span>
                        <strong>Action Required:</strong> {contract.processor_name || 'A bulk consumer'} has submitted a procurement request for your produce. Accept to activate the contract and begin fulfillment.
                      </span>
                    </div>
                  )}

                  {/* 30% Advance Escrow Status Notifications */}
                  {contract.status === 'Accepted' && contract.advance_payment_status !== 'paid' && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>Awaiting 30% Advance Escrow:</strong> You accepted the procurement offer! The buyer is required to deposit ₹{Math.round((Number(contract.agreed_price) || 0) * 0.3).toLocaleString('en-IN')} (30% advance escrow) to activate freight dispatch.
                      </span>
                    </div>
                  )}

                  {(contract.advance_payment_status === 'paid' || ['Signed', 'In Transit'].includes(contract.status)) && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          <strong>30% Advance Escrow Deposited (₹{Number(contract.advance_paid_amount || Math.round((Number(contract.agreed_price) || 0) * 0.3)).toLocaleString('en-IN')}):</strong> Logistics truck PB-10-AZ-9981 dispatched and en route.
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 shrink-0 uppercase tracking-wider">
                        In Transit
                      </span>
                    </div>
                  )}

                  {/* Settlement Bill & Reduction Ledger for Farmer */}
                  {(() => {
                    const grossTotal = Number(contract.agreed_price) || 0;
                    const advanceReduction = Number(contract.advance_paid_amount) || Math.round(grossTotal * 0.3);
                    const balanceAfterReduction = Math.max(0, grossTotal - advanceReduction);

                    return (
                      <div className="p-3.5 bg-gradient-to-br from-slate-50 to-slate-100/70 rounded-2xl border border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Escrow Settlement Bill &amp; Deduction Schedule</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setViewingBillContract(contract)}
                            className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                          >
                            <FileText className="w-3 h-3" />
                            <span>View / Print Bill &rarr;</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                          {/* Before Reduction */}
                          <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Gross Bill (Before Reduction)
                            </span>
                            <div className="font-extrabold text-slate-900 text-sm font-mono mt-0.5">
                              ₹{grossTotal.toLocaleString('en-IN')}
                            </div>
                            <span className="text-[10px] text-slate-500 block">Total Contract Consideration</span>
                          </div>

                          {/* 30% Reduction / Advance */}
                          <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                                30% Advance (Reduction)
                              </span>
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                                contract.advance_payment_status === 'paid' ? 'bg-emerald-600 text-white' : 'bg-amber-200 text-amber-900'
                              }`}>
                                {contract.advance_payment_status === 'paid' ? 'DEPOSITED' : 'PENDING'}
                              </span>
                            </div>
                            <div className="font-extrabold text-amber-900 text-sm font-mono mt-0.5">
                              - ₹{advanceReduction.toLocaleString('en-IN')}
                            </div>
                            <span className="text-[10px] text-amber-700 block">
                              {contract.advance_payment_status === 'paid' ? 'Secured in Trust Escrow' : 'Buyer Deposit Awaited'}
                            </span>
                          </div>

                          {/* After Reduction (Net Balance) */}
                          <div className="p-2.5 bg-emerald-50/90 rounded-xl border border-emerald-300 shadow-2xs">
                            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                              Final Due (After Reduction)
                            </span>
                            <div className="font-extrabold text-emerald-900 text-sm font-mono mt-0.5">
                              ₹{balanceAfterReduction.toLocaleString('en-IN')}
                            </div>
                            <span className="text-[10px] text-emerald-700 font-medium block">
                              70% Balance on Silo Acceptance
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-base">
                          {contract.quantity * 10} Quintals ({contract.quantity} MT) {contract.crop}
                        </span>
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                          contract.status === 'Accepted' || contract.status === 'Signed'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : contract.status === 'Fulfilled'
                            ? 'bg-teal-100 text-teal-800 border-teal-300'
                            : contract.status === 'Cancelled'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                        }`}>
                          {contract.status === 'Pending' ? '● Pending Your Acceptance' : contract.status === 'Accepted' ? '● Active / Accepted' : contract.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Buyer / Consumer: <strong className="text-slate-800">{contract.processor_name || 'Agro Consumer'}</strong>
                      </div>
                      <div className="text-xs font-mono font-semibold text-emerald-700">
                        Agreed Consideration: ₹{Number(contract.agreed_price).toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* View Escrow Bill Button */}
                      <button
                        type="button"
                        onClick={() => setViewingBillContract(contract)}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 border border-slate-200 transition cursor-pointer shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        <span>View Escrow Bill</span>
                      </button>

                      {contract.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleServeContract(contract.id)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Accept &amp; Activate Contract</span>
                          </button>
                          <button
                            onClick={() => handleCancelContract(contract.id)}
                            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Decline</span>
                          </button>
                        </>
                      )}

                      {/* Single Dispatch Tracking Button */}
                      {(contract.advance_payment_status === 'paid' || ['Signed', 'In Transit', 'Fulfilled'].includes(contract.status)) && (
                        <button
                          type="button"
                          onClick={() => setDispatchModalData({ contract })}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Track Dispatch</span>
                        </button>
                      )}

                      <Link
                        to={`/contract/${contract.id}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition border border-slate-200 cursor-pointer"
                      >
                        <span>{contract.status === 'Pending' ? 'Review Terms' : 'View Smart Tracker'}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DELIVERIES */}
      {activeTab === 'deliveries' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <Truck className="w-5 h-5 text-green-600" />
                Active Deliveries &amp; Weighbridge Tracking
              </h3>
              <p className="text-xs text-slate-500">Track highway transit and mill weighbridge verification</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
              {deliveries.length} Shipments
            </span>
          </div>

          {deliveries.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Truck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-600">No active deliveries scheduled</div>
              <p className="text-xs text-slate-400 mt-1">Deliveries appear after contracts are signed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deliveries.map((del) => (
                <div key={del.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-sm text-slate-900">
                      {del.crop ? `${del.quantity * 10} Quintals (${del.quantity} MT) ${del.crop}` : `Delivery #${del.id.substring(0, 10)}`}
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                      del.status === 'Delivered'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : del.status === 'In Transit'
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                      {del.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500">
                    Destination: <span className="font-medium text-slate-700">{del.processor_name || 'Consumer Silo'}</span> &bull; Target Date: <span className="font-medium text-slate-700">{del.delivery_date}</span>
                  </div>

                  {del.tracking_notes && del.tracking_notes.length > 0 && (
                    <div className="text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-600 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span><strong>Latest Milestone:</strong> {del.tracking_notes[del.tracking_notes.length - 1].checkpoint}</span>
                    </div>
                  )}

                  <div className="pt-1 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setDispatchModalData({ delivery: del, contract: { id: del.contract_id, crop: del.crop } })}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-200 flex items-center gap-1 cursor-pointer transition shadow-xs"
                    >
                      <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Live Dispatch Tracker &rarr;</span>
                    </button>
                    <Link
                      to={`/contract/${del.contract_id}`}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Contract Details</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Add Produce to Store */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="bg-gradient-to-r from-emerald-800 to-green-900 p-5 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Store className="w-5 h-5 text-emerald-300" />
                  Add Commodity to My Store
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Set your volume in Quintals and direct price in ₹ per Quintal
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-white/80 hover:text-white text-xl font-bold p-1 cursor-pointer transition"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={handleAddStoreItem}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                  e.preventDefault();
                  handleAddStoreItem();
                }
              }}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Commodity
                  </label>
                  {!isCustomCrop ? (
                    <div className="space-y-1.5">
                      <select
                        value={STANDARD_CROPS.includes(newProduce.crop_name) ? newProduce.crop_name : '__custom__'}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setIsCustomCrop(true);
                            setNewProduce({ ...newProduce, crop_name: '', local_names: '' });
                          } else {
                            const crop = e.target.value;
                            const suggested = getAiSuggestedLocalNames(crop);
                            setNewProduce({ ...newProduce, crop_name: crop, local_names: suggested });
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        {STANDARD_CROPS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                        <option value="__custom__">✍️ Custom Commodity (Type name)...</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCrop(true);
                          setNewProduce({ ...newProduce, crop_name: '', local_names: '' });
                        }}
                        className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        ✍️ Not in list? Click to type custom commodity
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Type commodity name (e.g. Barley, Sunflower)..."
                        value={newProduce.crop_name}
                        onChange={(e) => {
                          const crop = e.target.value;
                          const suggested = getAiSuggestedLocalNames(crop);
                          setNewProduce({ ...newProduce, crop_name: crop, local_names: suggested });
                        }}
                        className="w-full px-3 py-2 rounded-xl border-2 border-emerald-500 text-sm focus:ring-2 focus:ring-emerald-500 bg-emerald-50/20 focus:bg-white font-medium text-slate-800"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCrop(false);
                          const def = STANDARD_CROPS[0];
                          setNewProduce({ ...newProduce, crop_name: def, local_names: getAiSuggestedLocalNames(def) });
                        }}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        &larr; Back to standard commodities list
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Quality Grade
                  </label>
                  <select
                    value={newProduce.grade}
                    onChange={(e) => setNewProduce({ ...newProduce, grade: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Grade A">Grade A (Premium)</option>
                    <option value="Premium Mandi">Premium Mandi Grade</option>
                    <option value="Grade B">Grade B (Standard Processing)</option>
                    <option value="Grade 3">Grade 3 (Standard Commercial)</option>
                    <option value="Organic Certified">Organic Certified</option>
                  </select>
                </div>
              </div>

              {/* Local Vernacular Names / Regional Search Tags */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase text-slate-700">
                    Local Names / Vernacular Tags
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const suggested = getAiSuggestedLocalNames(newProduce.crop_name);
                      setNewProduce({ ...newProduce, local_names: suggested });
                    }}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 cursor-pointer transition"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600" /> ✨ AI Auto-Suggest Names
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. makka, makki, yellow makka, yellow makki, bhutta"
                  value={newProduce.local_names || ''}
                  onChange={(e) => setNewProduce({ ...newProduce, local_names: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                />
                <span className="text-[10px] text-slate-400">
                  Allows buyers searching vernacular terms (e.g. Makka, Makki, Bhutta) to match with this produce listing via AI.
                </span>
              </div>

              {/* Cultivated Soil Input Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase text-slate-700">
                    Cultivated Soil Type (In which this crop grew)
                  </label>
                  {!isCustomSoil ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomSoil(true);
                        setNewProduce({ ...newProduce, soil_type: '' });
                      }}
                      className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      ✍️ Type custom soil
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomSoil(false);
                        setNewProduce({ ...newProduce, soil_type: 'Loamy' });
                      }}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      &larr; Standard soils list
                    </button>
                  )}
                </div>

                {!isCustomSoil ? (
                  <select
                    value={['Loamy', 'Sandy Loam', 'Alluvial', 'Clay', 'Black', 'Sandy', 'Red Soil'].includes(newProduce.soil_type) ? newProduce.soil_type : '__custom__'}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomSoil(true);
                        setNewProduce({ ...newProduce, soil_type: '' });
                      } else {
                        setNewProduce({ ...newProduce, soil_type: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                    required
                  >
                    <option value="Loamy">Loamy Soil (Wheat, Corn, Cereals)</option>
                    <option value="Sandy Loam">Sandy Loam (Potato, Tubers, Root Crops)</option>
                    <option value="Alluvial">Alluvial Soil (River Silt, High Fertility)</option>
                    <option value="Clay">Clay Soil (Rice &amp; Paddy, Heavy Moisture)</option>
                    <option value="Black">Black Soil / Regur (Cotton &amp; Soybean)</option>
                    <option value="Sandy">Sandy Soil (Mustard, Millets &amp; Oilseeds)</option>
                    <option value="Red Soil">Red Soil (Groundnut, Pulses &amp; Legumes)</option>
                    <option value="__custom__">✍️ Custom Soil Classification...</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    autoFocus
                    placeholder="Type soil classification (e.g. Silt Loam, Sandy Clay)..."
                    value={newProduce.soil_type || ''}
                    onChange={(e) => setNewProduce({ ...newProduce, soil_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border-2 border-emerald-500 text-sm focus:ring-2 focus:ring-emerald-500 bg-emerald-50/20 focus:bg-white font-medium text-slate-800"
                    required
                  />
                )}
                <span className="text-[10px] text-slate-400">
                  Specified soil in which this crop grew, verified by bulk consumers for quality assaying.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Quantity (Quintals)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newProduce.quantity_quintals}
                    onChange={(e) => setNewProduce({ ...newProduce, quantity_quintals: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400">1 Quintal = 100 kg</span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Asking Rate (₹ / Qtl)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newProduce.price_per_quintal}
                    onChange={(e) => setNewProduce({ ...newProduce, price_per_quintal: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700"
                  />
                  <span className="text-[10px] text-slate-400">Rate per 100 kg</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Storage Facility
                  </label>
                  <select
                    value={newProduce.storage_type}
                    onChange={(e) => setNewProduce({ ...newProduce, storage_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Farm Silo">Farm Silo</option>
                    <option value="Cold Storage">Cold Storage</option>
                    <option value="Mandi Warehouse">Mandi Warehouse</option>
                    <option value="On-Farm Shed">On-Farm Shed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Moisture Content (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newProduce.moisture_percentage}
                    onChange={(e) => setNewProduce({ ...newProduce, moisture_percentage: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Harvest Date
                </label>
                <input
                  type="date"
                  value={newProduce.harvest_date}
                  onChange={(e) => setNewProduce({ ...newProduce, harvest_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Quality Notes
                </label>
                <textarea
                  rows="2"
                  value={newProduce.notes}
                  onChange={(e) => setNewProduce({ ...newProduce, notes: e.target.value })}
                  placeholder="e.g. Dry harvest, stored in hermetic bags."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Mandatory Soil & Crop Quality Assay Report (PDF / Document) */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border-2 border-dashed border-emerald-300 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-emerald-600" />
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-800">
                        Soil &amp; Crop Quality Assay Report (PDF / Document)
                      </label>
                      <span className="text-[10px] text-slate-500">
                        Mandatory official report of soil health, moisture, and crop purity
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-700 border border-red-200 uppercase tracking-wide">
                    Mandatory *
                  </span>
                </div>

                {newProduce.report_document ? (
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-emerald-900 truncate">
                          {newProduce.report_file_name || 'Assay_Report.pdf'}
                        </p>
                        <p className="text-[10px] text-emerald-700 font-medium">
                          ✓ Document attached &bull; Ready for verification
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedReportItem({
                          crop_name: newProduce.crop_name,
                          farmer_name: farmer?.name || 'Farmer',
                          soil_type: newProduce.soil_type,
                          grade: newProduce.grade,
                          report_file_name: newProduce.report_file_name,
                          report_document: newProduce.report_document
                        })}
                        className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-white hover:bg-emerald-100 rounded-lg border border-emerald-300 transition cursor-pointer shadow-xs"
                      >
                        Preview PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewProduce({ ...newProduce, report_document: '', report_file_name: '' })}
                        className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                        title="Remove attached file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 cursor-pointer transition text-xs font-semibold text-slate-700 shadow-xs">
                        <UploadCloud className="w-4 h-4 text-emerald-600" />
                        <span>Upload File (PDF / DOC / Image)</span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,application/pdf"
                          onChange={handleReportFileUpload}
                          className="hidden"
                          required
                        />
                      </label>

                      <span className="text-xs text-slate-400 text-center font-bold">OR</span>

                      <button
                        type="button"
                        onClick={() => {
                          const generated = generateCertifiedAssayPdf({
                            farmerName: farmer?.name || 'Registered Farmer',
                            cropName: newProduce.crop_name,
                            soilType: newProduce.soil_type || 'Loamy',
                            grade: newProduce.grade || 'Grade A',
                            quantityQuintals: newProduce.quantity_quintals || 100,
                            pricePerQuintal: newProduce.price_per_quintal || 2400
                          });
                          setNewProduce({
                            ...newProduce,
                            report_document: generated,
                            report_file_name: `${(newProduce.crop_name || 'Crop').replace(/[^a-zA-Z0-9]/g, '_')}_APMC_Lab_Assay.pdf`
                          });
                        }}
                        className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>⚡ Generate Lab Assay PDF</span>
                      </button>
                    </div>

                    {/* Quick Downloadable Sample PDF Files */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-500 font-medium">📥 Download sample PDFs from project:</span>
                      <a
                        href="/sample_wheat_quality_report.pdf"
                        download="sample_wheat_quality_report.pdf"
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-0.5"
                      >
                        🌾 Wheat Report.pdf
                      </a>
                      <span className="text-slate-300">&bull;</span>
                      <a
                        href="/sample_basmati_rice_inspection_report.pdf"
                        download="sample_basmati_rice_inspection_report.pdf"
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-0.5"
                      >
                        🍚 Rice Report.pdf
                      </a>
                      <span className="text-slate-300">&bull;</span>
                      <a
                        href="/sample_maize_assay_certificate.pdf"
                        download="sample_maize_assay_certificate.pdf"
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-0.5"
                      >
                        🌽 Maize Report.pdf
                      </a>
                    </div>

                    <p className="text-[10px] text-red-600 font-medium text-center">
                      * You must attach a PDF or document report to list this commodity.
                    </p>
                  </div>
                )}
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center text-xs">
                <span className="text-emerald-800 font-semibold">Total Lot Market Value:</span>
                <span className="text-sm font-extrabold text-emerald-900 font-mono">
                  ₹{(Number(newProduce.quantity_quintals || 0) * Number(newProduce.price_per_quintal || 0)).toLocaleString('en-IN')}
                </span>
              </div>

              </div>

              {/* Sticky Footer Action Bar Pinned at Bottom */}
              <div className="shrink-0 p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Store...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>List Commodity in Store &rarr;</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Store Listing (Single Edit Button for all fields) */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden my-auto max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-emerald-800 to-green-900 p-5 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-emerald-300" />
                  Edit Store Listing
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Update commodity specs, vernacular tags, rates, and storage
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-white/80 hover:text-white text-xl font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Commodity
                  </label>
                  {!isEditCustomCrop ? (
                    <div className="space-y-1.5">
                      <select
                        value={STANDARD_CROPS.includes(editCropName) ? editCropName : '__custom__'}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setIsEditCustomCrop(true);
                          } else {
                            const crop = e.target.value;
                            setEditCropName(crop);
                            setEditLocalNames(getAiSuggestedLocalNames(crop));
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        {STANDARD_CROPS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                        <option value="__custom__">✍️ Custom Commodity (Type name)...</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setIsEditCustomCrop(true)}
                        className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        ✍️ Not in list? Click to type custom commodity
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Type commodity name..."
                        value={editCropName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditCropName(val);
                          setEditLocalNames(getAiSuggestedLocalNames(val));
                        }}
                        className="w-full px-3 py-2 rounded-xl border-2 border-emerald-500 text-sm focus:ring-2 focus:ring-emerald-500 bg-emerald-50/20 focus:bg-white font-medium text-slate-800"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditCustomCrop(false);
                          if (!STANDARD_CROPS.includes(editCropName)) {
                            const def = STANDARD_CROPS[0];
                            setEditCropName(def);
                            setEditLocalNames(getAiSuggestedLocalNames(def));
                          }
                        }}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        &larr; Back to standard commodities list
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Quality Grade
                  </label>
                  <select
                    value={editGrade}
                    onChange={(e) => setEditGrade(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Grade A">Grade A (Premium)</option>
                    <option value="Premium Mandi">Premium Mandi Grade</option>
                    <option value="Grade B">Grade B (Standard Processing)</option>
                    <option value="Grade 3">Grade 3 (Standard Commercial)</option>
                    <option value="Organic Certified">Organic Certified</option>
                  </select>
                </div>
              </div>

              {/* Local Vernacular Names / Regional Search Tags */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase text-slate-700">
                    Local Names / Vernacular Tags
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const suggested = getAiSuggestedLocalNames(editCropName);
                      setEditLocalNames(suggested);
                    }}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 cursor-pointer transition"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600" /> ✨ AI Auto-Suggest Names
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. makka, makki, yellow makka, yellow makki, bhutta"
                  value={editLocalNames}
                  onChange={(e) => setEditLocalNames(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                />
                <span className="text-[10px] text-slate-400">
                  Allows buyers searching regional vernacular terms (Makka, Makki, Bhutta) to match with your produce.
                </span>
              </div>

              {/* Cultivated Soil Input Field in Edit Modal */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase text-slate-700">
                    Cultivated Soil Type (In which this crop grew)
                  </label>
                  {!isEditCustomSoil ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditCustomSoil(true);
                        setEditSoilType('');
                      }}
                      className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      ✍️ Type custom soil
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditCustomSoil(false);
                        setEditSoilType('Loamy');
                      }}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      &larr; Back to standard soils list
                    </button>
                  )}
                </div>

                {!isEditCustomSoil ? (
                  <select
                    value={['Loamy', 'Sandy Loam', 'Alluvial', 'Clay', 'Black', 'Sandy', 'Red Soil'].includes(editSoilType) ? editSoilType : '__custom__'}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsEditCustomSoil(true);
                        setEditSoilType('');
                      } else {
                        setEditSoilType(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                    required
                  >
                    <option value="Loamy">Loamy Soil (Wheat, Corn, Cereals)</option>
                    <option value="Sandy Loam">Sandy Loam (Potato, Tubers, Root Crops)</option>
                    <option value="Alluvial">Alluvial Soil (River Silt, High Fertility)</option>
                    <option value="Clay">Clay Soil (Rice &amp; Paddy, Heavy Moisture)</option>
                    <option value="Black">Black Soil / Regur (Cotton &amp; Soybean)</option>
                    <option value="Sandy">Sandy Soil (Mustard, Millets &amp; Oilseeds)</option>
                    <option value="Red Soil">Red Soil (Groundnut, Pulses &amp; Legumes)</option>
                    <option value="__custom__">✍️ Custom Soil Classification...</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    autoFocus
                    placeholder="Type soil classification (e.g. Silt Loam, Sandy Clay)..."
                    value={editSoilType || ''}
                    onChange={(e) => setEditSoilType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-emerald-500 text-sm focus:ring-2 focus:ring-emerald-500 bg-emerald-50/20 focus:bg-white font-medium text-slate-800"
                    required
                  />
                )}
                <span className="text-[10px] text-slate-400">
                  Specified soil in which this batch was cultivated.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Asking Rate (₹ / Quintal)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      min="1"
                      required
                      value={editRate}
                      onChange={(e) => setEditRate(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-base focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">Rate per 100 kg (1 Quintal)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Available Quantity (Qtl)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                  <span className="text-[10px] text-slate-400">1 Quintal = 100 kg</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Storage Facility
                  </label>
                  <select
                    value={editStorageType}
                    onChange={(e) => setEditStorageType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Farm Silo">Farm Silo</option>
                    <option value="Cold Storage">Cold Storage</option>
                    <option value="Mandi Warehouse">Mandi Warehouse</option>
                    <option value="On-Farm Shed">On-Farm Shed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Moisture Content (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editMoisture}
                    onChange={(e) => setEditMoisture(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Quality Notes
                </label>
                <textarea
                  rows="2"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="e.g. Dry harvest, stored in hermetic bags."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Soil & Crop Quality Assay Report (PDF / Document) in Edit Modal */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    Quality &amp; Soil Assay Report (PDF)
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    Mandatory APMC Document
                  </span>
                </div>

                {editReportDocument ? (
                  <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-medium text-slate-800 truncate">
                        {editReportFileName || 'Assay_Report.pdf'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedReportItem({
                          crop_name: editCropName,
                          farmer_name: farmer?.name || 'Farmer',
                          soil_type: editSoilType,
                          grade: editGrade,
                          report_file_name: editReportFileName,
                          report_document: editReportDocument
                        })}
                        className="px-2 py-0.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-300 transition cursor-pointer"
                      >
                        Preview
                      </button>
                      <label className="px-2 py-0.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition cursor-pointer">
                        Replace
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,application/pdf"
                          onChange={handleEditReportFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer text-xs font-semibold text-slate-700">
                      <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Upload New Report (PDF)</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,application/pdf"
                        onChange={handleEditReportFileUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const generated = generateCertifiedAssayPdf({
                          farmerName: farmer?.name || 'Farmer',
                          cropName: editCropName,
                          soilType: editSoilType || 'Loamy',
                          grade: editGrade,
                          quantityQuintals: Number(editQuantity) || 100,
                          pricePerQuintal: Number(editRate) || 2000
                        });
                        setEditReportDocument(generated);
                        setEditReportFileName(`${(editCropName || 'Crop').replace(/[^a-zA-Z0-9]/g, '_')}_Assay.pdf`);
                      }}
                      className="px-2.5 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-300 text-xs font-bold hover:bg-emerald-200 transition cursor-pointer"
                    >
                      ⚡ Auto-Generate
                    </button>
                  </div>
                )}
              </div>

              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-800 font-semibold">Updated Total Lot Value:</span>
                  <span className="text-base font-extrabold text-emerald-900 font-mono">
                    ₹{(Math.round((Number(editQuantity) || 0) * (Number(editRate) || 0))).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {savingEdit ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating Listing...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" /> Save Listing Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Viewer Modal */}
      {selectedReportItem && (
        <ReportViewerModal
          item={selectedReportItem}
          onClose={() => setSelectedReportItem(null)}
        />
      )}

      {/* Live Dispatch Location & GPS Telemetry Tracker Modal */}
      {dispatchModalData && (
        <DispatchTrackingModal
          delivery={dispatchModalData.delivery}
          contract={dispatchModalData.contract}
          onClose={() => setDispatchModalData(null)}
          onRefresh={() => {
            loadMyFarmData();
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

