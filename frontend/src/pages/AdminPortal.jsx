import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  ShieldAlert,
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Wheat,
  FileText,
  Lock,
  ArrowRight,
  TrendingUp,
  MapPin,
  RefreshCw,
  Award,
  Truck,
  Store,
  Scale,
  ShoppingCart,
  Layers,
  Power,
  Search,
  AlertCircle,
  Calendar,
  Phone,
  Mail,
  UserCheck,
  Check,
  X,
  Crown
} from 'lucide-react';

export default function AdminPortal() {
  const { user, login, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'farmers' | 'processors' | 'contracts' | 'deliveries' | 'stores' | 'orders' | 'applications'
  
  // Master Platform Data
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [farmersList, setFarmersList] = useState([]);
  const [processorsList, setProcessorsList] = useState([]);
  const [contractsList, setContractsList] = useState([]);
  const [deliveriesList, setDeliveriesList] = useState([]);
  const [storesList, setStoresList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [applications, setApplications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [message, setMessage] = useState(null);

  // Search & Filter state for Users tab
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');

  // Contract Modal Preview
  const [selectedContract, setSelectedContract] = useState(null);

  // Admin login credentials state if not logged in
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  async function loadAdminData() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/overview');
      if (res.ok) {
        const json = await res.json();
        const d = json.data || {};
        setStats(d.stats || {});
        setUsersList(d.users || []);
        setFarmersList(d.farmers || []);
        setProcessorsList(d.processors || []);
        setContractsList(d.contracts || []);
        setDeliveriesList(d.deliveries || []);
        setStoresList(d.stores || []);
        setOrdersList(d.orders || []);
        setApplications(d.applications || []);
      }
    } catch (err) {
      console.error('Failed to load admin overview data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminLogin(e) {
    if (e) e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);
    try {
      await login(adminEmail, adminPassword);
    } catch (err) {
      setLoginError(err.message || 'Invalid admin credentials');
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleApprove(appId) {
    setProcessingId(appId);
    try {
      const res = await fetch(`/api/admin/applications/${appId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_notes: 'Verified by codekalesh@gmail.com. Verified APMC commercial consumer.'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        loadAdminData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Approval failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(appId) {
    setProcessingId(appId);
    try {
      const res = await fetch(`/api/admin/applications/${appId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_notes: 'Application does not meet current APMC minimum milling capacity requirements.'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        loadAdminData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Rejection failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setProcessingId(null);
    }
  }

  async function handleToggleTrust(userId) {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-trust`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        loadAdminData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  async function handleToggleService(userId) {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-service`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        loadAdminData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  async function handleUpdateRole(userId, newRole) {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        loadAdminData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Role update failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  async function handleRejectRequest(userId) {
    try {
      const res = await fetch(`/api/admin/users/${userId}/reject-request`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        loadAdminData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to decline request' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  // Not Logged In View
  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-2xl p-8 space-y-6 text-center">
          <div className="w-16 h-16 bg-purple-100 text-purple-700 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 uppercase tracking-wider mb-2">
              Super Admin Control
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Platform Master Console
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Sign in with designated platform administrator credentials to inspect and govern all platform data.
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Admin Email
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="Enter admin email address"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Admin Password
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded-xl transition shadow-lg shadow-purple-700/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Authenticating Master Access...
                </>
              ) : (
                <>
                  Enter Admin Master Portal
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Filtered Users List
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone?.includes(userSearch);
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const pendingApps = applications.filter((a) => a.status === 'pending');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold border border-purple-500/30 mb-3">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              Super Admin Master Console • Full 360° Data Governance
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Platform Master Control &amp; All Data
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl">
              Complete centralized overview of all farmers, bulk consumers, smart legal agreements, delivery tracking dispatches, produce silos, and user access roles.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-xs">
              <div className="w-9 h-9 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-base">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-white">codekalesh@gmail.com</div>
                <div className="text-purple-300 font-mono text-[10px]">Master Super Admin</div>
              </div>
            </div>

            <button
              type="button"
              onClick={loadAdminData}
              title="Refresh All Platform Data"
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Live Admin Metrics Top Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-8 pt-8 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Farmers &amp; Acreage</div>
            <div className="text-xl font-extrabold text-emerald-400 mt-1">
              {stats?.farmers_count || 0} <span className="text-xs font-normal text-slate-300">({stats?.total_acreage || 0} Ac)</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Bulk Consumers</div>
            <div className="text-xl font-extrabold text-blue-400 mt-1">{stats?.processors_count || 0} Units</div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Smart Contracts</div>
            <div className="text-xl font-extrabold text-purple-400 mt-1">
              {stats?.contracts_count || 0} <span className="text-xs font-normal text-slate-300">(₹{(Number(stats?.total_contract_value || 0) / 100000).toFixed(1)}L)</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Silo Commodities</div>
            <div className="text-xl font-extrabold text-amber-400 mt-1">
              {stats?.store_items_count || 0} <span className="text-xs font-normal text-slate-300">({stats?.total_store_volume_quintals || 0} Qtl)</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Tracked Logistics</div>
            <div className="text-xl font-extrabold text-cyan-400 mt-1">{stats?.deliveries_count || 0} Dispatches</div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Pending Approvals</div>
            <div className="text-xl font-extrabold text-rose-400 mt-1">{pendingApps.length} Action Needed</div>
          </div>
        </div>
      </div>

      {/* Action Alerts */}
      {message && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-3 text-sm font-medium">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            {message.text}
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-xs font-semibold hover:underline ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 9 Comprehensive Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1 text-xs sm:text-sm font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`py-3 px-3.5 flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'overview'
              ? 'border-purple-600 text-purple-900 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Platform Overview
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`py-3 px-3.5 flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'users'
              ? 'border-purple-600 text-purple-900 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          All Users ({usersList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('farmers')}
          className={`py-3 px-3.5 flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'farmers'
              ? 'border-purple-600 text-purple-900 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wheat className="w-4 h-4" />
          Farmers &amp; Farms ({farmersList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('processors')}
          className={`py-3 px-3.5 flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'processors'
              ? 'border-purple-600 text-purple-900 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Consumers &amp; Buyers ({processorsList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('contracts')}
          className={`py-3 px-3.5 flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'contracts'
              ? 'border-purple-600 text-purple-900 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          All Contracts ({contractsList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('deliveries')}
          className={`py-3 px-3.5 flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'deliveries'
              ? 'border-purple-600 text-purple-900 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          GPS Deliveries ({deliveriesList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('stores')}
          className={`py-3 px-3.5 flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'stores'
              ? 'border-purple-600 text-purple-900 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Store className="w-4 h-4" />
          Farmer Silos ({storesList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`py-3 px-3.5 flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'orders'
              ? 'border-purple-600 text-purple-900 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          Store Requests ({ordersList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('applications')}
          className={`py-3 px-3.5 flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'applications'
              ? 'border-purple-600 text-purple-900 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Applications
          {pendingApps.length > 0 && (
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-rose-500 text-white font-bold">
              {pendingApps.length}
            </span>
          )}
        </button>
      </div>

      {/* ======================= TAB 1: OVERVIEW ======================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Aggregated Capital & Land Valuations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Land Managed</span>
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Wheat className="w-5 h-5" />
                </span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                {stats?.total_acreage || 0} <span className="text-sm font-normal text-slate-500">Acres</span>
              </div>
              <p className="text-xs text-slate-500">
                Across {farmersList.length} registered farms in Punjab, Haryana, and Rajasthan.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Silo Produce Valuation</span>
                <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <Store className="w-5 h-5" />
                </span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                ₹{(Number(stats?.total_silo_value || 0)).toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-500">
                {stats?.total_store_volume_quintals || 0} Quintals harvested commodities ready for procurement.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Contract Value</span>
                <span className="p-2 rounded-xl bg-purple-100 text-purple-800">
                  <Scale className="w-5 h-5" />
                </span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                ₹{(Number(stats?.total_contract_value || 0)).toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-500">
                Committed legal forward agreements between verified mills and cultivators.
              </p>
            </div>
          </div>

          {/* Quick Action Split: Pending Applications & Recent Contracts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Applications Box */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-slate-900">Pending Provider Applications</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('applications')}
                  className="text-xs font-bold text-purple-700 hover:underline"
                >
                  View All ({applications.length})
                </button>
              </div>

              {pendingApps.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  All consumer applications have been reviewed.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingApps.slice(0, 3).map((app) => (
                    <div key={app.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm text-slate-900">{app.company_name}</div>
                        <div className="text-xs text-slate-500">{app.user_email} • GST: {app.gst_number || 'N/A'}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprove(app.id)}
                          disabled={processingId === app.id}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Contracts Box */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-slate-900">Recent Smart Agreements</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('contracts')}
                  className="text-xs font-bold text-purple-700 hover:underline"
                >
                  View All ({contractsList.length})
                </button>
              </div>

              {contractsList.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No contracts issued yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {contractsList.slice(0, 3).map((c) => (
                    <div key={c.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm text-slate-900">{c.crop} • {c.quantity} Qtl</div>
                        <div className="text-xs text-slate-500">
                          {c.processor_name || c.processor_id} ↔ {c.farmer_name || c.farmer_id}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'Signed' || c.status === 'Accepted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'Fulfilled'
                            ? 'bg-blue-100 text-blue-800'
                            : c.status === 'Cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {c.status}
                        </span>
                        <div className="text-xs font-extrabold text-slate-900 mt-1">₹{Number(c.agreed_price).toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 2: ALL USERS ======================= */}
      {activeTab === 'users' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">All Registered Accounts</h3>
              <p className="text-xs text-slate-500">Search, filter, update permissions, and promote visitors to commercial roles.</p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by name, email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium"
              >
                <option value="all">All Roles</option>
                <option value="farmer">Farmers</option>
                <option value="processor">Consumers</option>
                <option value="visitor">Visitors</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Account Details</th>
                  <th className="px-4 py-3">Assigned Role</th>
                  <th className="px-4 py-3">Incoming Request</th>
                  <th className="px-4 py-3">Trusted Status</th>
                  <th className="px-4 py-3">Service Active</th>
                  <th className="px-4 py-3 text-right">Admin Role Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                      <div className="text-[11px] text-slate-400">{u.phone || 'No phone'}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-900 border border-purple-200'
                          : (u.role === 'processor' || u.role === 'consumer')
                          ? 'bg-blue-100 text-blue-900 border border-blue-200'
                          : u.role === 'farmer'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          : 'bg-amber-100 text-amber-900 border border-amber-200'
                      }`}>
                        {u.role === 'processor' ? 'consumer' : u.role}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      {u.requested_role === 'processor' ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold">
                          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                          Requested: Consumer
                        </div>
                      ) : u.requested_role === 'farmer' ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                          Requested: Farmer
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">No Pending Request</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => handleToggleTrust(u.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition ${
                          u.is_trusted_processor
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {u.is_trusted_processor ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-slate-400" />}
                        {u.is_trusted_processor ? 'Verified' : 'Standard'}
                      </button>
                    </td>

                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => handleToggleService(u.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition ${
                          u.service_status
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        {u.service_status ? 'ON' : 'OFF'}
                      </button>
                    </td>

                    <td className="px-4 py-3.5 text-right space-x-1.5">
                      {u.role === 'admin' ? (
                        <span className="text-[10px] text-purple-700 font-bold">Protected Admin</span>
                      ) : u.requested_role === 'processor' ? (
                        <div className="inline-flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateRole(u.id, 'processor')}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition cursor-pointer"
                          >
                            Grant Consumer Access
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectRequest(u.id)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-medium transition cursor-pointer"
                          >
                            Decline
                          </button>
                        </div>
                      ) : u.requested_role === 'farmer' ? (
                        <div className="inline-flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateRole(u.id, 'farmer')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition cursor-pointer"
                          >
                            Grant Farmer Access
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectRequest(u.id)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-medium transition cursor-pointer"
                          >
                            Decline
                          </button>
                        </div>
                      ) : u.role === 'visitor' ? (
                        <span className="text-[11px] text-slate-400 font-medium">No Pending Request</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleUpdateRole(u.id, 'visitor')}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition cursor-pointer"
                        >
                          Demote to Visitor
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================= TAB 3: ALL FARMERS ======================= */}
      {activeTab === 'farmers' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900">All Registered Farms &amp; Cultivators ({farmersList.length})</h3>
              <p className="text-xs text-slate-500">Inspect soil profiles, GPS coordinates, registered land acreage, and crop yield records.</p>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Total Land: <strong className="text-slate-900">{stats?.total_acreage || 0} Acres</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {farmersList.map((f) => {
              const farmerStores = storesList.filter((s) => s.farmer_id === f.id);
              return (
                <div key={f.id} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-base text-slate-900">{f.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{f.id}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      f.is_service_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {f.is_service_active ? '🟢 Service Active' : '🔴 Paused'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Registered Land Area:</span>
                      <strong className="text-slate-900">{f.total_acreage} Acres</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Soil Classification:</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold">{f.soil_type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Contact Phone:</span>
                      <span className="font-mono text-slate-700">{f.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Email Address:</span>
                      <span className="font-mono text-slate-700 truncate max-w-[160px]">{f.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-start justify-between pt-1">
                      <span className="text-slate-400 font-medium shrink-0">Farm Location:</span>
                      <span className="text-right text-slate-700 truncate max-w-[180px]">{f.location?.address || 'Punjab Farm Corridor'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Coordinates:</span>
                      <span className="font-mono">[{f.location?.latitude?.toFixed(3)}, {f.location?.longitude?.toFixed(3)}]</span>
                    </div>
                  </div>

                  {/* Silo Items & Past Yield */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      Store Produce: <strong className="text-slate-900">{farmerStores.length} batches</strong>
                    </span>
                    <span className="text-[11px] text-purple-700 font-semibold">
                      Yield history recorded
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================= TAB 4: ALL PROCESSORS ======================= */}
      {activeTab === 'processors' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900">All Bulk Consumers &amp; Commercial Buyers ({processorsList.length})</h3>
              <p className="text-xs text-slate-500">Commercial demand requirements, target procurement rates, and sourcing radius.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {processorsList.map((p) => (
              <div key={p.id} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-base text-slate-900">{p.company_name}</div>
                    <div className="text-xs text-slate-400 font-mono">{p.id}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    p.is_trusted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {p.is_trusted ? '🛡️ Verified' : 'Standard'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Crop Demanded:</span>
                    <strong className="text-slate-900">{p.required_crop} ({p.required_grade || 'Grade A'})</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Quantity Demanded:</span>
                    <strong className="text-slate-900">{Number(p.quantity_needed_tons) * 10} Qtl ({p.quantity_needed_tons} MT)</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Target Price:</span>
                    <strong className="text-emerald-700">₹{Math.round((p.target_price_per_ton || 24000) / 10).toLocaleString('en-IN')}/Qtl</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Procurement Radius:</span>
                    <span className="font-mono text-slate-700">Within {p.max_distance_km} km</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Deadline Date:</span>
                    <span className="font-mono text-slate-700">{p.deadline || '2026-12-31'}</span>
                  </div>
                  <div className="flex items-start justify-between pt-1">
                    <span className="text-slate-400 font-medium shrink-0">Mill Facility:</span>
                    <span className="text-right text-slate-700 truncate max-w-[180px]">{p.location?.address || 'Industrial Agro Complex'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    p.is_service_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {p.is_service_active ? 'Intake Active (ON)' : 'Intake Paused (OFF)'}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    [{p.location?.latitude?.toFixed(3)}, {p.location?.longitude?.toFixed(3)}]
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================= TAB 5: ALL CONTRACTS ======================= */}
      {activeTab === 'contracts' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900">All Forward Contracts &amp; Smart Agreements ({contractsList.length})</h3>
              <p className="text-xs text-slate-500">Legal forward agreements, signed counter-parties, pricing terms, and execution records.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Contract Ref</th>
                  <th className="px-4 py-3">Parties (Consumer ↔ Farmer)</th>
                  <th className="px-4 py-3">Crop &amp; Quantity</th>
                  <th className="px-4 py-3">Agreed Price</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Audit Details</th>
                  <th className="px-4 py-3 text-right">Legal Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contractsList.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3.5 font-mono text-purple-700 font-bold text-[11px]">
                      {c.id}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{c.processor_name || c.processor_id}</div>
                      <div className="text-[11px] text-slate-500">↔ {c.farmer_name || c.farmer_id}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-800">{c.crop}</div>
                      <div className="text-[11px] text-slate-500">{c.quantity} Quintals</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-extrabold text-emerald-700 text-sm">
                        ₹{Number(c.agreed_price).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400">Total Consideration</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        c.status === 'Signed' || c.status === 'Accepted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.status === 'Fulfilled'
                          ? 'bg-blue-100 text-blue-800'
                          : c.status === 'Cancelled'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-[11px]">
                      {c.served_by && <div className="text-emerald-700 font-medium">Served by {c.served_by}</div>}
                      {c.cancelled_by && (
                        <div className="text-rose-700 font-medium">
                          Cancelled by {c.cancelled_by}: <span className="italic">{c.cancel_reason}</span>
                        </div>
                      )}
                      <div className="text-slate-400 text-[10px] mt-0.5">{new Date(c.created_at).toLocaleDateString()}</div>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedContract(c)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer"
                      >
                        View Full Text
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================= TAB 6: ALL DELIVERIES ======================= */}
      {activeTab === 'deliveries' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900">All Logistical Deliveries &amp; GPS Dispatches ({deliveriesList.length})</h3>
              <p className="text-xs text-slate-500">Live checkpoint milestones from farm departure to weighbridge certification and mill delivery.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Delivery Ref</th>
                  <th className="px-4 py-3">Contract Ref</th>
                  <th className="px-4 py-3">Route (From ↔ To)</th>
                  <th className="px-4 py-3">Cargo Spec</th>
                  <th className="px-4 py-3">Delivery Status</th>
                  <th className="px-4 py-3">Target Date</th>
                  <th className="px-4 py-3 text-right">Milestones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveriesList.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3.5 font-mono text-cyan-700 font-bold text-[11px]">{d.id}</td>
                    <td className="px-4 py-3.5 font-mono text-purple-700 text-[11px]">{d.contract_id}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{d.farmer_name || 'Cultivator Farm'}</div>
                      <div className="text-[11px] text-slate-500">→ {d.processor_name || 'Consumer Silo'}</div>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-800">
                      {d.crop} • {d.quantity} Qtl
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        d.status === 'Delivered'
                          ? 'bg-blue-100 text-blue-800'
                          : d.status === 'In Transit'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-700">{d.delivery_date || 'N/A'}</td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="px-2 py-1 bg-slate-100 rounded-md font-bold text-[10px] text-slate-600">
                        {d.tracking_notes?.length || 0} Checkpoints
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================= TAB 7: ALL FARMER SILOS ======================= */}
      {activeTab === 'stores' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900">All Farmer Produce Stores &amp; Silos ({storesList.length})</h3>
              <p className="text-xs text-slate-500">All commodities currently stored on farms across India with ₹ per Quintal pricing.</p>
            </div>
            <div className="text-xs text-slate-500">
              Total Silo Value: <strong className="text-emerald-700 text-sm">₹{Number(stats?.total_silo_value || 0).toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Item Ref</th>
                  <th className="px-4 py-3">Cultivator Farmer</th>
                  <th className="px-4 py-3">Crop &amp; Grade</th>
                  <th className="px-4 py-3">Stored Volume</th>
                  <th className="px-4 py-3">Rate (₹/Qtl)</th>
                  <th className="px-4 py-3">Total Value</th>
                  <th className="px-4 py-3">Storage &amp; Moisture</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {storesList.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3.5 font-mono text-slate-500 text-[11px]">{s.id}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{s.farmer_name || s.farmer_id}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{s.farmer_phone || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-800">{s.crop_name}</div>
                      <div className="text-[10px] text-emerald-700 font-medium">{s.grade}</div>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">{s.quantity_quintals} Qtl</td>
                    <td className="px-4 py-3.5 font-extrabold text-emerald-700 text-sm">
                      ₹{Number(s.price_per_quintal).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      ₹{Number(s.total_value_inr).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3.5 text-[11px]">
                      <div>{s.storage_type}</div>
                      <div className="text-slate-400 text-[10px]">{s.moisture_percentage}% moisture</div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        s.status === 'available'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================= TAB 8: ALL STORE REQUESTS ======================= */}
      {activeTab === 'orders' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900">All Store Trade &amp; Purchase Requests ({ordersList.length})</h3>
              <p className="text-xs text-slate-500">Inquiries sent by buyers for farmer inventory with serve/cancel audit history.</p>
            </div>
          </div>

          {ordersList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No store trade requests logged yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Request Ref</th>
                    <th className="px-4 py-3">Buyer Entity</th>
                    <th className="px-4 py-3">Farmer</th>
                    <th className="px-4 py-3">Crop &amp; Quantity</th>
                    <th className="px-4 py-3">Offered Rate</th>
                    <th className="px-4 py-3">Total Amount</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ordersList.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3.5 font-mono text-slate-500">{o.id}</td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{o.buyer_name}</div>
                        <div className="text-[11px] text-slate-400">{o.buyer_email}</div>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-800">{o.farmer_name || o.farmer_id}</td>
                      <td className="px-4 py-3.5">{o.crop_name} • {o.quantity_quintals} Qtl</td>
                      <td className="px-4 py-3.5 font-bold text-emerald-700">₹{o.offered_price_per_quintal}/Qtl</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">₹{o.total_amount_inr?.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3.5 text-right">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          o.status === 'Served'
                            ? 'bg-emerald-100 text-emerald-800'
                            : o.status === 'Cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 9: APPLICATIONS ======================= */}
      {activeTab === 'applications' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Consumer Trusted Applications ({applications.length})</h3>
            <p className="text-xs text-slate-500">Verify company business credentials (GSTIN &amp; FSSAI) to approve commercial consumer access.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {applications.map((app) => (
              <div key={app.id} className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-base text-slate-900">{app.company_name}</div>
                    <div className="text-xs text-slate-500 font-mono">{app.user_email} • {app.user_phone}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                    app.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : app.status === 'rejected'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {app.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-400">GSTIN Number:</span>
                    <span className="font-mono font-bold text-slate-900">{app.gst_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">FSSAI License:</span>
                    <span className="font-mono font-bold text-slate-900">{app.fssai_license || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Annual Capacity:</span>
                    <span className="font-bold text-slate-900">{app.processing_capacity_tons} MT/Yr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Crops:</span>
                    <span className="font-bold text-slate-900">{app.target_crops}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Facility Address:</span>
                    <span className="text-slate-700 text-right truncate max-w-[180px]">{app.address}</span>
                  </div>
                </div>

                {app.admin_notes && (
                  <div className="p-3 bg-purple-50 rounded-xl text-purple-900 text-xs border border-purple-200">
                    <span className="font-bold">Admin Audit Note:</span> {app.admin_notes}
                  </div>
                )}

                {app.status === 'pending' && (
                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleApprove(app.id)}
                      disabled={processingId === app.id}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      {processingId === app.id ? 'Processing...' : 'Approve & Register Consumer'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(app.id)}
                      disabled={processingId === app.id}
                      className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contract Preview Modal */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h4 className="font-bold text-base">Legal Contract Agreement</h4>
                <div className="text-xs text-purple-300 font-mono">{selectedContract.id}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedContract(null)}
                className="text-white/70 hover:text-white text-xl font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto font-mono text-xs bg-slate-50 whitespace-pre-wrap text-slate-800 leading-relaxed">
              {selectedContract.contract_text}
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedContract(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 cursor-pointer"
              >
                Close Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
