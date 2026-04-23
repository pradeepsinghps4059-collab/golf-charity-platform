import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ScoresPage from './pages/ScoresPage';
import DrawsPage from './pages/DrawsPage';
import CharityPage from './pages/CharityPage';
import SubscriptionPage from './pages/SubscriptionPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDraws from './pages/admin/AdminDraws';
import AdminCharities from './pages/admin/AdminCharities';
import AdminWinners from './pages/admin/AdminWinners';
import LoadingSpinner from './components/shared/LoadingSpinner';
import AnimatedBackground from './components/shared/AnimatedBackground';

const ProtectedRoute = ({ children, adminRequired = false }) => {
  const { user, initialized } = useAuth();
  if (!initialized) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminRequired && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, initialized } = useAuth();
  if (!initialized) return <LoadingSpinner fullScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* User Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/scores" element={<ProtectedRoute><ScoresPage /></ProtectedRoute>} />
      <Route path="/draws" element={<ProtectedRoute><DrawsPage /></ProtectedRoute>} />
      <Route path="/charity" element={<ProtectedRoute><CharityPage /></ProtectedRoute>} />
      <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute adminRequired><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute adminRequired><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/draws" element={<ProtectedRoute adminRequired><AdminDraws /></ProtectedRoute>} />
      <Route path="/admin/charities" element={<ProtectedRoute adminRequired><AdminCharities /></ProtectedRoute>} />
      <Route path="/admin/winners" element={<ProtectedRoute adminRequired><AdminWinners /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedBackground />
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(10, 14, 26, 0.92)',
              color: '#dde3ea',
              border: '1px solid rgba(147, 51, 234, 0.2)',
              borderRadius: '16px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 60px rgba(5, 5, 16, 0.5)',
            },
            success: { iconTheme: { primary: '#9333ea', secondary: '#f3e8ff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fef2f2' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
