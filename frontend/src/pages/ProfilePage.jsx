import React, { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  Mail,
  Phone,
  Lock,
  Power,
  MapPin,
  Building2,
  Tractor,
  Layers,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  ExternalLink,
  Sparkles,
  Wheat,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const {
    user,
    isAuthenticated,
    isAdmin,
    isFarmer,
    isVisitor,
    isTrustedProcessor,
    isServiceActive,
    toggleServiceStatus,
    updateUserProfile
  } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Farmer specifics
  const [soilType, setSoilType] = useState('Loamy');
  const [totalAcreage, setTotalAcreage] = useState(30);
  const [address, setAddress] = useState('');

  // Processor specifics
  const [companyName, setCompanyName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [fssaiLicense, setFssaiLicense] = useState('');
  const [capacityTons, setCapacityTons] = useState(500);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [serviceToggling, setServiceToggling] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      if (user.farmer_profile) {
        setSoilType(user.farmer_profile.soil_type || 'Loamy');
        setTotalAcreage(user.farmer_profile.total_acreage || 30);
        setAddress(user.farmer_profile.location?.address || '');
      }
      if (user.processor_application) {
        setCompanyName(user.processor_application.company_name || '');
        setGstNumber(user.processor_application.gst_number || '');
        setFssaiLicense(user.processor_application.fssai_license || '');
        setCapacityTons(user.processor_application.processing_capacity_tons || 500);
      }
    }
  }, [user]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Authentication Required</h2>
          <p className="text-slate-600 mb-6">
            Please log in or register to access your account profile and service settings.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md transition-all"
          >
            Go to Home & Sign In
          </Link>
        </div>
      </div>
    );
  }

  async function handleToggleService() {
    setServiceToggling(true);
    setErrorMsg(null);
    try {
      const nextStatus = await toggleServiceStatus();
      setSuccessMsg(`Services successfully ${nextStatus ? 'TURNED ON (Active)' : 'TURNED OFF (Paused)'}`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to toggle service status.');
    } finally {
      setServiceToggling(false);
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password && password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        phone,
      };
      if (password) payload.password = password;

      if (isFarmer) {
        payload.soil_type = soilType;
        payload.total_acreage = Number(totalAcreage);
        payload.address = address;
      }

      if (user.role === 'processor') {
        payload.company_name = companyName;
        payload.gst_number = gstNumber;
        payload.fssai_license = fssaiLicense;
        payload.processing_capacity_tons = Number(capacityTons);
      }

      await updateUserProfile(payload);
      setPassword('');
      setConfirmPassword('');
      setSuccessMsg('Account details and profile settings securely saved!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Could not update profile information.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-800 to-green-700 rounded-3xl p-8 text-white shadow-xl shadow-emerald-950/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-100 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Account Settings
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">{user.name}</h1>
            <p className="text-emerald-100/90 text-sm flex items-center gap-2">
              <Mail className="w-4 h-4 opacity-80" /> {user.email}
              <span className="opacity-40">•</span>
              <span className="capitalize px-2 py-0.5 rounded bg-emerald-900/40 text-xs font-medium">
                {user.role} Portal
              </span>
            </p>
          </div>

          {/* Quick Service ON / OFF Toggle */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 flex flex-col items-end gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-100">
              <Power className="w-3.5 h-3.5" />
              Service Intake Status
            </div>
            <button
              onClick={handleToggleService}
              disabled={serviceToggling}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all ${
                isServiceActive
                  ? 'bg-emerald-400 hover:bg-emerald-300 text-emerald-950 shadow-emerald-400/20 ring-2 ring-emerald-300/50'
                  : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
              }`}
            >
              <div className={`w-3 h-3 rounded-full animate-pulse ${isServiceActive ? 'bg-emerald-950' : 'bg-white'}`} />
              {isServiceActive ? 'SERVICE ON (Active)' : 'SERVICE OFF (Paused)'}
            </button>
            <span className="text-[11px] text-emerald-100/70">
              {isServiceActive
                ? 'Accepting incoming contract requests & inquiries'
                : 'Account offline: no new trade requests will arrive'}
            </span>
          </div>
        </div>

        {/* Status Alerts */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold">{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="text-sm font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* Account Role Direct Launch Banner */}
        {isVisitor && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                Select Your Active Portal
              </div>
              <p className="text-emerald-800 text-sm">
                Choose your dedicated workspace to start trading, manage commodities, and track supply contracts:
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/farmer"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Wheat className="w-4 h-4" />
                Farmer Dashboard
              </Link>
              <Link
                to="/consumer"
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <DollarSign className="w-4 h-4" />
                Consumer Portal
              </Link>
            </div>
          </div>
        )}

        {/* Profile Edit Form */}
        <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-8">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              Personal & Contact Information
            </h2>
            <p className="text-slate-500 text-xs mt-1">Manage your identity and authentication credentials.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Email Address (Registered)
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-sm font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Assigned Platform Role
              </label>
              <div className="flex items-center gap-2 py-3 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold capitalize text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                {user.role} {isAdmin && '(Super Admin)'}
              </div>
            </div>
          </div>

          {/* Password Reset Section */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-emerald-600" />
              Update Account Password (Optional)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to keep unchanged"
                  minLength={6}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Role-Specific Field Sections */}
          {isFarmer && (
            <div className="pt-6 border-t border-slate-100 space-y-6">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
                <Tractor className="w-5 h-5 text-emerald-600" />
                Farmland & Agronomic Properties
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Soil Classification
                  </label>
                  <select
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Loamy">Loamy (Ideal all-round)</option>
                    <option value="Sandy Loam">Sandy Loam (Tubers/Spices)</option>
                    <option value="Clay Loam">Clay Loam (Wheat/Paddy)</option>
                    <option value="Black Soil">Black Cotton Soil (Regur)</option>
                    <option value="Alluvial">Alluvial (Indo-Gangetic)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Total Cultivable Acreage
                  </label>
                  <input
                    type="number"
                    value={totalAcreage}
                    onChange={(e) => setTotalAcreage(e.target.value)}
                    min={1}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Farmland Address / Village
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Village, Tehsil, District, State"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {(user.role === 'processor' || user.role === 'consumer') && (
            <div className="pt-6 border-t border-slate-100 space-y-6">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
                <Building2 className="w-5 h-5 text-emerald-600" />
                Bulk Consumer Enterprise Details
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Corporate Entity / Mill Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    GSTIN Number
                  </label>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    FSSAI License
                  </label>
                  <input
                    type="text"
                    value={fssaiLicense}
                    onChange={(e) => setFssaiLicense(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Storage &amp; Processing Capacity (Metric Tons)
                  </label>
                  <input
                    type="number"
                    value={capacityTons}
                    onChange={(e) => setCapacityTons(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
