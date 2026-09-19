import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import ProcessorDashboard from './pages/ProcessorDashboard';
import FarmerDashboard from './pages/FarmerDashboard';
import ContractTrackingView from './pages/ContractTrackingView';
import AdminPortal from './pages/AdminPortal';
import ProfilePage from './pages/ProfilePage';
import VisitorPortal from './pages/VisitorPortal';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 selection:bg-emerald-200 selection:text-emerald-900">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/consumer" element={<ProcessorDashboard />} />
              <Route path="/processor" element={<ProcessorDashboard />} />
              <Route path="/farmer" element={<FarmerDashboard />} />
              <Route path="/visitor" element={<VisitorPortal />} />
              <Route path="/explore" element={<VisitorPortal />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<ProfilePage />} />
              <Route path="/admin" element={<AdminPortal />} />
              <Route path="/contract/:id" element={<ContractTrackingView />} />
              <Route path="/contract" element={<ContractTrackingView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}
