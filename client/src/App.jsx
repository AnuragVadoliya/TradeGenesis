import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import StrategyBuilderPage from './pages/StrategyBuilderPage';
import AIChatPage from './pages/AIChatPage';
import BacktestPage from './pages/BacktestPage';
import PaperTradingPage from './pages/PaperTradingPage';
import AppLayout from './components/layout/AppLayout';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 font-body text-sm">Loading TradeGenesis...</p>
        </div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1A1A1A',
              color: '#fff',
              border: '1px solid #2A2A2A',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#F97316', secondary: '#1A1A1A' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#1A1A1A' } },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          {/* Protected app routes */}
          <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
          <Route path="/strategy-builder" element={<ProtectedRoute><AppLayout><StrategyBuilderPage /></AppLayout></ProtectedRoute>} />
          <Route path="/ai-chat" element={<ProtectedRoute><AppLayout><AIChatPage /></AppLayout></ProtectedRoute>} />
          <Route path="/backtest" element={<ProtectedRoute><AppLayout><BacktestPage /></AppLayout></ProtectedRoute>} />
          <Route path="/paper-trading" element={<ProtectedRoute><AppLayout><PaperTradingPage /></AppLayout></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
