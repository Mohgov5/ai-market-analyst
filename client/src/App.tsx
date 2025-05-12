// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './Context/ThemeContext';
import { AuthProvider } from './Context/AuthContext';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import CryptocurrencyList from './pages/CryptocurrencyList';
import FiatCurrencyList from './pages/FiatCurrencyList';
import CurrencyDetail from './pages/CurrencyDetail';
import News from './pages/News';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Watchlist from './pages/Watchlist'; // À implémenter
import Learn from './pages/Learn'; // À implémenter
import Settings from './pages/Settings'; // À implémenter
import ProtectedRoute from './components/auth/ProtectedRoute';
import Wallet from './pages/Wallet';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="crypto" element={<CryptocurrencyList />} />
              <Route path="crypto/:id" element={<CurrencyDetail />} />
              <Route path="fiat" element={<FiatCurrencyList />} />
              <Route path="fiat/:id" element={<CurrencyDetail />} />
              <Route path="watchlist" element={<Watchlist />} />
              <Route path="learn" element={<Learn />} />
              <Route path="news" element={<News />} />
              <Route path="analytics" element={<Dashboard />} /> {/* Remplacer par une vraie page Analytics quand disponible */}
              <Route path="wallet" element={<Wallet />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;