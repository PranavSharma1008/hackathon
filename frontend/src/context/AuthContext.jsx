import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('cm_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [providerApp, setProviderApp] = useState(null);
  const [loadingApp, setLoadingApp] = useState(false);

  // Sync user profile with latest backend DB records on mount
  useEffect(() => {
    if (user?.email) {
      refreshUser();
    }
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('cm_user', JSON.stringify(user));
      if (user.role === 'processor') {
        checkProviderApplication(user.email);
      }
    } else {
      localStorage.removeItem('cm_user');
      setProviderApp(null);
    }
  }, [user]);

  async function checkProviderApplication(email) {
    if (!email) return;
    setLoadingApp(true);
    try {
      const res = await fetch(`/api/providers/my-application?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const json = await res.json();
        setProviderApp(json.application);
      }
    } catch (err) {
      console.error('Failed to check provider application:', err);
    } finally {
      setLoadingApp(false);
    }
  }

  async function login(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Invalid credentials');
    }

    setUser(data.user);
    if (data.user.provider_app) {
      setProviderApp(data.user.provider_app);
    }
    return data.user;
  }

  async function register(registrationData) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationData)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Registration failed');
    }

    setUser(data.user);
    if (data.user.processor_application) {
      setProviderApp(data.user.processor_application);
    }
    return data.user;
  }

  function logout() {
    setUser(null);
    setProviderApp(null);
    localStorage.removeItem('cm_user');
  }

  async function refreshUser() {
    if (!user?.email) return;
    try {
      const res = await fetch(`/api/auth/me?email=${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          if (data.user.provider_app) {
            setProviderApp(data.user.provider_app);
          }
        }
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  }

  async function toggleServiceStatus() {
    if (!user) return false;
    try {
      const res = await fetch('/api/auth/service-toggle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser((prev) => ({
          ...prev,
          service_status: data.service_status
        }));
        return data.service_status;
      }
    } catch (err) {
      console.error('Failed to toggle service:', err);
      throw err;
    }
  }

  async function updateUserProfile(updates) {
    if (!user) return;
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: user.id,
        email: user.email,
        ...updates
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update profile');
    }

    setUser(data.user);
    return data.user;
  }

  async function updateFarmerProfile(updates) {
    return updateUserProfile(updates);
  }

  async function submitProviderApplication(formData) {
    const res = await fetch('/api/providers/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        user_id: user?.id,
        user_email: user?.email
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to submit application');
    }

    setProviderApp(data.application);
    return data.application;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        refreshUser,
        updateUserProfile,
        updateFarmerProfile,
        toggleServiceStatus,
        providerApp,
        loadingApp,
        submitProviderApplication,
        isAdmin: user?.role === 'admin' || user?.email === 'codekalesh@gmail.com',
        isProcessor: user?.role === 'processor' || user?.role === 'consumer',
        isTrustedProcessor: Boolean(user?.is_trusted_processor || user?.role === 'processor' || user?.role === 'consumer'),
        isConsumer: user?.role === 'processor' || user?.role === 'consumer',
        isTrustedConsumer: Boolean(user?.is_trusted_processor || user?.role === 'processor' || user?.role === 'consumer'),
        isFarmer: user?.role === 'farmer',
        isVisitor: !user?.role || user?.role === 'visitor',
        isServiceActive: user?.service_status !== false && user?.service_status !== 0
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
