import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  Wheat,
  DollarSign,
  User,
  Crown,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  MapPin,
  FileText,
  Truck,
  CheckCircle,
  CheckCircle2,
  Store,
  Scale,
  Lock,
  Power,
  Layers,
  ChevronRight,
  Activity,
  AlertCircle,
  RefreshCw,
  LogIn,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LIVE_BENCHMARKS = [
  { crop: 'Sharbati Wheat (Grade A)', price: 2550, unit: '₹/Qtl', change: '+₹35', mandi: 'Khanna, Punjab' },
  { crop: 'Basmati Paddy 1121', price: 3950, unit: '₹/Qtl', change: '+₹60', mandi: 'Karnal, Haryana' },
  { crop: 'Soybean (Yellow Seed)', price: 4420, unit: '₹/Qtl', change: '-₹20', mandi: 'Indore, MP' },
  { crop: 'Kufri Chipsona Potato', price: 1650, unit: '₹/Qtl', change: '+₹15', mandi: 'Agra, UP' },
  { crop: 'Mustard 42% Oil', price: 5650, unit: '₹/Qtl', change: '+₹80', mandi: 'Alwar, Rajasthan' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, login, register, isAuthenticated, isAdmin, isTrustedProcessor, isFarmer } = useAuth();

  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState('login');
  const [registerRole, setRegisterRole] = useState('farmer'); // 'farmer' | 'consumer'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Route user automatically based on their detected account role
  function routeUserByRole(userObj) {
    if (!userObj) return;
    if (userObj.role === 'admin') {
      navigate('/admin');
    } else if (userObj.role === 'processor' || userObj.role === 'consumer') {
      navigate('/consumer');
    } else {
      navigate('/farmer');
    }
  }

  async function handleDirectLogin(e) {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const loggedIn = await login(email, password);
      routeUserByRole(loggedIn);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDirectRegister(e) {
    if (e) e.preventDefault();
    if (!name || !email || !password) {
      setError('Please enter name, email, and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const newUser = await register({
        name,
        email,
        password,
        phone: phone || '+91-98765-43210',
        role: registerRole
      });
      routeUserByRole(newUser);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  function fillDemoCredentials(demoEmail, demoPass) {
    setAuthMode('login');
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  }

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 sm:pt-16 pb-20 bg-gradient-to-b from-emerald-50/80 via-white to-slate-50 border-b border-emerald-100/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-300/80 text-emerald-800 text-xs font-bold tracking-wide uppercase shadow-xs mb-6 animate-in fade-in">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>AI Agritech Platform • Direct Mandi Disintermediation</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] max-w-4xl mx-auto">
            Contract Farming <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700">Direct &amp; Verified</span> with AI
          </h1>

          <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Unified Indian agricultural ecosystem. Enter your email to automatically launch your verified portal—whether you are a Cultivator Farmer, Bulk Consumer, Platform Admin, or Guest Explorer.
          </p>

          {/* Unified Smart Authentication & Gateway */}
          <div className="mt-10 max-w-xl mx-auto">
            {isAuthenticated ? (
              /* Already Authenticated View */
              <div className="p-7 rounded-3xl bg-white border border-emerald-200 shadow-xl text-left space-y-5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                      {user.role === 'admin' ? <Crown className="w-3.5 h-3.5" /> : (user.role === 'processor' || user.role === 'consumer') ? <DollarSign className="w-3.5 h-3.5" /> : user.role === 'farmer' ? <Wheat className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                      {user.role === 'admin' ? 'Platform Super Admin' : (user.role === 'processor' || user.role === 'consumer') ? 'Bulk Consumer' : user.role === 'farmer' ? 'Verified Cultivator' : 'Market Explorer'}
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                      Welcome, {user.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-emerald-600/20">
                    {user.role === 'admin' ? <Crown className="w-7 h-7" /> : (user.role === 'processor' || user.role === 'consumer') ? <DollarSign className="w-7 h-7" /> : user.role === 'farmer' ? <Wheat className="w-7 h-7" /> : <User className="w-7 h-7" />}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => routeUserByRole(user)}
                    className="flex-1 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <span>Open My {user.role === 'admin' ? 'Admin Master Control' : (user.role === 'processor' || user.role === 'consumer') ? 'Consumer Dashboard' : 'Farmer Dashboard'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <Link
                    to="/profile"
                    className="py-3.5 px-5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm transition text-center"
                  >
                    Account Settings
                  </Link>
                </div>
              </div>
            ) : (
              /* Smart Single-Login Card with Automatic Role Detection */
              <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-xl text-left space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Auto-Detect Account Gateway</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">
                      {authMode === 'login' ? 'Sign in with your Email Address' : 'Create a New Account'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {authMode === 'login' 
                        ? 'No role selection required. The platform automatically identifies your account permissions from the database.'
                        : 'Register your secure credentials to join the Indian agricultural matchmaking platform.'}
                    </p>
                  </div>
                </div>

                {/* Mode Selector Tabs */}
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setError(null);
                    }}
                    className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                      authMode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setError(null);
                    }}
                    className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                      authMode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* SIGN IN FORM */}
                {authMode === 'login' ? (
                  <form onSubmit={handleDirectLogin} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. devanshu@gmail.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Verifying &amp; Detecting Role...</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4" />
                          <span>Sign In &amp; Launch Portal</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* REGISTER FORM */
                  <form onSubmit={handleDirectRegister} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                        I am registering as:
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setRegisterRole('farmer')}
                          className={`p-3 rounded-2xl border-2 text-left transition flex flex-col gap-1 cursor-pointer ${
                            registerRole === 'farmer'
                              ? 'border-emerald-600 bg-emerald-50/90 text-emerald-950 shadow-xs ring-2 ring-emerald-500/20'
                              : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <Wheat className={`w-5 h-5 ${registerRole === 'farmer' ? 'text-emerald-600' : 'text-slate-400'}`} />
                            <span className={`w-2.5 h-2.5 rounded-full ${registerRole === 'farmer' ? 'bg-emerald-600 ring-4 ring-emerald-200' : 'bg-slate-300'}`} />
                          </div>
                          <div className="font-bold text-xs mt-1">Farmer / Provider</div>
                          <div className="text-[10px] text-slate-500 leading-tight">Supply crops &amp; sign farming contracts</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRegisterRole('consumer')}
                          className={`p-3 rounded-2xl border-2 text-left transition flex flex-col gap-1 cursor-pointer ${
                            registerRole === 'consumer'
                              ? 'border-emerald-600 bg-emerald-50/90 text-emerald-950 shadow-xs ring-2 ring-emerald-500/20'
                              : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <DollarSign className={`w-5 h-5 ${registerRole === 'consumer' ? 'text-emerald-600' : 'text-slate-400'}`} />
                            <span className={`w-2.5 h-2.5 rounded-full ${registerRole === 'consumer' ? 'bg-emerald-600 ring-4 ring-emerald-200' : 'bg-slate-300'}`} />
                          </div>
                          <div className="font-bold text-xs mt-1">Consumer / Buyer</div>
                          <div className="text-[10px] text-slate-500 leading-tight">Procure produce &amp; post demands</div>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={registerRole === 'farmer' ? 'e.g. Jaswant Singh' : 'e.g. AgroPure Procurement Ltd'}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={registerRole === 'farmer' ? 'e.g. jaswant@agrofarm.in' : 'e.g. procurement@agropure.com'}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                        Create Password (min 6 chars)
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Creating {registerRole === 'farmer' ? 'Farmer' : 'Consumer'} Account...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Complete Registration &amp; Enter {registerRole === 'farmer' ? 'Farmer' : 'Consumer'} Portal</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Instant 1-Click Demo Accounts Chips */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick One-Click Demo Logins:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials('codekalesh@gmail.com', 'codekalesh@gmail.com')}
                      className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 text-[11px] font-bold border border-purple-200 transition cursor-pointer"
                    >
                      👑 Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials('kartikey@gmail.com', 'kartikey@gmail.com')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 transition cursor-pointer"
                    >
                      🌾 Farmer (kartikey)
                    </button>
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials('duwarka@gmail.com', 'duwarka@gmail.com')}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 text-[11px] font-bold border border-blue-200 transition cursor-pointer"
                    >
                      🏭 Consumer (duwarka)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Live Mandi Benchmark Rates Ticker */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Activity className="w-4 h-4 text-emerald-600" />
              Live Indian Mandi Benchmark Rates (Agmarknet)
            </div>
            <span className="text-xs text-slate-400">Rates quoted in ₹ per Quintal (100 kg)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {LIVE_BENCHMARKS.map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-colors">
                <div className="text-xs font-semibold text-slate-700 truncate">{item.crop}</div>
                <div className="text-[11px] text-slate-400 truncate">{item.mandi}</div>
                <div className="flex items-baseline justify-between mt-3 pt-2 border-t border-slate-200/60">
                  <span className="text-base font-extrabold text-slate-900">
                    ₹{item.price.toLocaleString('en-IN')}<span className="text-xs font-normal text-slate-500">/Qtl</span>
                  </span>
                  <span className={`text-xs font-bold ${item.change.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {item.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4 Pillars Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-slate-900">Platform Capabilities</h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            From precision matching to secure settlement, built for transparent agribusiness across India.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">AI Matching Engine</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Calculates multi-factor compatibility scores (0-100%) based on soil classification, seasonal growth windows, past crop yields, and delivery radius.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Smart Legal Contracts</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automatically generates legally certified forward contract agreements adhering to Indian APMC guidelines with digital signature workflows.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Milestone Logistics</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Real-time delivery lifecycle tracking from farm loading and weighbridge inspection to silo unloading and automated contract fulfillment.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <Power className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Service Availability Control</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Both farmers and consumers can toggle their service availability ON/OFF anytime, ensuring full operational control over incoming requests.
            </p>
          </div>
        </div>
      </section>

      {/* HACKATHON STEP 3: AUTOMATE ONE STEP WITH AI - BEFORE VS AFTER SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-8 sm:p-10 text-white border border-emerald-500/30 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/20 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5" /> AI Automation Showcase &bull; Step 3
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Automated Step: Farm Sourcing, Assaying &amp; Bilateral Contracts
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Replacing weeks of manual mandi middleman negotiation with our 1.2-second multi-factor agronomic algorithm.
              </p>
            </div>
          </div>

          {/* Before vs After Side-by-Side Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* BEFORE AI */}
            <div className="bg-rose-950/40 rounded-2xl p-6 border border-rose-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 font-extrabold text-xs uppercase border border-rose-500/30">
                  ❌ BEFORE AI: Manual Process
                </span>
                <span className="text-xs text-rose-400 font-mono font-bold">14 - 21 Days</span>
              </div>
              <ul className="space-y-3 text-xs text-rose-100/90">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold shrink-0">&bull;</span>
                  <span><strong>Physical Mandi Travel:</strong> Sourcing agents travel across APMC mandis (50-100 km) looking for matching lots.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold shrink-0">&bull;</span>
                  <span><strong>Middleman Commission:</strong> Arhtiya cartels extract 5% to 8% brokerage while offering zero harvest traceability.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold shrink-0">&bull;</span>
                  <span><strong>Zero Soil &amp; Quality Data:</strong> Millers purchase crops without knowing soil health, causing unexpected grade failures.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold shrink-0">&bull;</span>
                  <span><strong>Paper Contract Drafting:</strong> Legal agreements take 7–10 days of lawyer review, causing post-harvest price repudiation.</span>
                </li>
              </ul>
            </div>

            {/* AFTER AI */}
            <div className="bg-emerald-950/40 rounded-2xl p-6 border border-emerald-500/40 space-y-4 shadow-lg shadow-emerald-900/20">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-300 font-extrabold text-xs uppercase border border-emerald-500/40 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> AFTER AI: FarmSphere Matchmaker
                </span>
                <span className="text-xs text-emerald-400 font-mono font-bold">⚡ 1.2 Seconds</span>
              </div>
              <ul className="space-y-3 text-xs text-emerald-100/90">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold shrink-0">&check;</span>
                  <span><strong>Automated Multi-Factor Match:</strong> Algorithmic engine scores Haversine distance, soil type, past yield history, and season in milliseconds.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold shrink-0">&check;</span>
                  <span><strong>0% Middleman Gouging:</strong> Direct corporate-to-farmer trade desk with guaranteed transparent pricing in ₹ per Quintal.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold shrink-0">&check;</span>
                  <span><strong>Predictive Risk Narrative:</strong> AI engine flags out-of-radius logistics, soil mismatches, or acreage shortages before contract signing.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold shrink-0">&check;</span>
                  <span><strong>Instant Legal Contract:</strong> Bilateral agreement under Indian Contract Act 1872 generated in 1-click with digital signatures and milestone escrow.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Quick Portal Access */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Platform Administration
            </div>
            <h3 className="text-2xl font-bold">Super Admin Master Control</h3>
            <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
              Platform administrator (<span className="font-mono text-emerald-400">codekalesh@gmail.com</span>) has complete 360-degree information across all farmers, consumers, smart contracts, delivery dispatches, produce stores, and user roles.
            </p>
          </div>
          <Link
            to="/admin"
            className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 shrink-0"
          >
            <span>Open Admin Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
