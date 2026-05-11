import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import '../css/app.css'

import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import Welcome from './pages/Welcome'
import Login from './pages/Login'
import SinPermiso from './pages/SinPermiso'
import Dashboard from './pages/Dashboard'
import Mapa from './pages/Mapa'
import Reportes from './pages/Reportes'
import Reparadores from './pages/Reparadores'
import Presupuestos from './pages/Presupuestos'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/bienvenido" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/sin-permiso" element={<SinPermiso />} />

          {/* Protected — any authenticated user */}
          <Route path="/" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/mapa" element={
            <ProtectedRoute><Mapa /></ProtectedRoute>
          } />
          <Route path="/reportes" element={
            <ProtectedRoute><Reportes /></ProtectedRoute>
          } />
          <Route path="/reparadores" element={
            <ProtectedRoute><Reparadores /></ProtectedRoute>
          } />

          {/* Protected — autoridad only */}
          <Route path="/presupuestos" element={
            <ProtectedRoute requiredRole="autoridad"><Presupuestos /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/bienvenido" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

const root = document.getElementById('app')
if (root) createRoot(root).render(<App />)
