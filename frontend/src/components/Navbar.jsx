import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Sprout,
  Wheat,
  DollarSign,
  FileText,
  Crown,
  User,
  LogOut,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  LogIn,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, login, register, logout, isAuthenticated, isAdmin, isTrustedProcessor, isTrustedConsumer, isFarmer, isVisitor } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Modal Auth State
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [registerRole, setRegisterRole] = useState('farmer'); // 'farmer' | 'consumer'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  function resetForm() {
    setAuthError(null);
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setRegisterRole('farmer');
  }

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

  async function handleLoginSubmit(e) {
    if (e) e.preventDefault();
    if (!email || !password) {
      setAuthError('Please enter both your email address and password.');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      const loggedUser = await login(email, password);
      setShowAuthModal(false);
      resetForm();
      routeUserByRole(loggedUser);
    } catch (err) {
      setAuthError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleRegisterSubmit(e) {
    if (e) e.preventDefault();
    if (!name || !email || !password) {
      setAuthError('Please fill in your name, email, and password.');
      return;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      const newUser = await register({
        name,
        email,
        password,
        phone: phone || '+91-98765-43210',
        role: registerRole
      });
      setShowAuthModal(false);
      resetForm();
      routeUserByRole(newUser);
    } catch (err) {
      setAuthError(err.message || 'Registration failed. Email may already be registered.');
    } finally {
      setAuthLoading(false);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-green-700 flex items-center justify-center text-white shadow-sm shadow-emerald-600/30 group-hover:scale-105 transition">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight block leading-none">
                  Farm<span className="text-emerald-600">Sphere</span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase block mt-0.5">
                  Contract Farming Matchmaker
                </span>
              </div>
            </Link>

              {/* Desktop Navigation Links */}
              <nav className="hidden md:flex items-center gap-1">
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive('/') && location.pathname === '/'
                      ? 'bg-emerald-50 text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
                  }`}
                >
                  Home
                </Link>

                {/* Farmer Dashboard Link: Visible ONLY if not in consumer/processor route and not a consumer/processor account */}
                {(!location.pathname.startsWith('/processor') && !location.pathname.startsWith('/consumer') && (!isTrustedConsumer || isAdmin)) && (
                  <Link
                    to="/farmer"
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive('/farmer')
                        ? 'bg-emerald-50 text-emerald-800 shadow-xs border border-emerald-200'
                        : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
                    }`}
                  >
                    <Wheat className="w-4 h-4 text-emerald-600" />
                    Farmer Dashboard
                  </Link>
                )}

                {/* Consumer Portal Link: Visible ONLY if not in farmer route and not a farmer account */}
                {(!location.pathname.startsWith('/farmer') && (!isFarmer || isAdmin)) && (
                  <Link
                    to="/consumer"
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive('/consumer') || isActive('/processor')
                        ? 'bg-emerald-50 text-emerald-800 shadow-xs border border-emerald-200'
                        : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
                    }`}
                  >
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Consumer Portal
                  </Link>
                )}

                {isAuthenticated && isAdmin && (
                  <Link
                    to="/admin"
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive('/admin')
                        ? 'bg-purple-100 text-purple-900 border border-purple-300 shadow-xs'
                        : 'text-purple-700 hover:bg-purple-50'
                    }`}
                  >
                    <Crown className="w-4 h-4 text-purple-600" />
                    Admin Master Control
                  </Link>
                )}


                <Link
                  to="/contract/cont_seed_wheat_01"
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive('/contract')
                      ? 'bg-emerald-50 text-emerald-800 shadow-xs border border-emerald-200'
                      : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Contracts &amp; Tracking
                </Link>
              </nav>

              {/* Right Actions: Authenticated User Pill / Sign In */}
              <div className="flex items-center gap-3">
                {isAuthenticated ? (
                  <div className="flex items-center gap-2">
                    <Link
                      to="/profile"
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs text-slate-700 transition ${
                        isActive('/profile')
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-900 shadow-xs'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                      title="Account &amp; Service Settings"
                    >
                      <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                        {isAdmin ? <Crown className="w-3.5 h-3.5" /> : isTrustedConsumer ? <DollarSign className="w-3.5 h-3.5" /> : <Wheat className="w-3.5 h-3.5" />}
                      </span>
                      <div className="text-left hidden sm:block">
                        <div className="font-bold text-slate-900 leading-none">
                          {user.name}
                        </div>
                        <div className="text-[10px] text-slate-500 capitalize">
                          {isAdmin ? 'Super Admin' : isTrustedConsumer ? 'Consumer' : 'Farmer'}
                        </div>
                      </div>
                    </Link>

                    <button
                      onClick={() => {
                        logout();
                        navigate('/');
                      }}
                      title="Log Out Securely"
                      className="p-2 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-500 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      resetForm();
                      setShowAuthModal(true);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Sign In / Register
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Navigation Bar */}
          <div className="md:hidden flex items-center justify-around border-t border-slate-100 bg-slate-50 px-2 py-1.5 text-xs font-medium">
            {(!location.pathname.startsWith('/processor') && !location.pathname.startsWith('/consumer') && (!isTrustedConsumer || isAdmin)) && (
              <Link
                to="/farmer"
                className={`px-3 py-1 rounded ${isActive('/farmer') ? 'text-emerald-700 font-bold bg-emerald-100/60' : 'text-slate-600'}`}
              >
                Farmer
              </Link>
            )}
            {(!location.pathname.startsWith('/farmer') && (!isFarmer || isAdmin)) && (
              <Link
                to="/consumer"
                className={`px-3 py-1 rounded ${isActive('/consumer') || isActive('/processor') ? 'text-emerald-700 font-bold bg-emerald-100/60' : 'text-slate-600'}`}
              >
                Consumer
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className={`px-3 py-1 rounded ${isActive('/admin') ? 'text-purple-800 font-bold bg-purple-100' : 'text-purple-700'}`}
              >
                Admin
              </Link>
            )}
          </div>
      </header>

      {/* High Security Unified Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-bold">Secure Account Access</h3>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {authMode === 'login'
                    ? 'Enter your email. The platform automatically detects your role.'
                    : 'Create your secure account. Full access with instant role assignment.'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  resetForm();
                }}
                className="text-white/70 hover:text-white text-xl font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Tab Switcher: Login vs Register */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    resetForm();
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sign In (Auto-Detect Role)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    resetForm();
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                    authMode === 'register'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Create New Account
                </button>
              </div>

              {/* Error Alert */}
              {authError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* ----------------- SIGN IN FORM (NO ROLE PICKER REQUIRED) ----------------- */}
              {authMode === 'login' && (
                <div className="space-y-4">
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your registered email address"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {authLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Verifying Credentials &amp; Role...</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4" />
                          <span>Sign In Securely</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* ----------------- REGISTRATION FORM ----------------- */}
              {authMode === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                      Select Account Role
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
                        <div className="text-[10px] text-slate-500 leading-tight">Supply harvest &amp; sign farming contracts</div>
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
                        <div className="text-[10px] text-slate-500 leading-tight">Bulk procurement, mills &amp; market orders</div>
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Mobile Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91-98765-43210"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Password (Minimum 6 characters)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {authLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Creating {registerRole === 'farmer' ? 'Farmer' : 'Consumer'} Account...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Create {registerRole === 'farmer' ? 'Farmer' : 'Consumer'} Account &amp; Enter Portal</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
