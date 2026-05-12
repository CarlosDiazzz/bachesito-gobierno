import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import '../css/app.css'

import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import Welcome        from './pages/Welcome'
import Login          from './pages/Login'
import SinPermiso     from './pages/SinPermiso'
import Dashboard      from './pages/Dashboard'
import Mapa           from './pages/Mapa'
import Reportes       from './pages/Reportes'
import ReporteDetalle from './pages/ReporteDetalle'
import NuevoReporte   from './pages/NuevoReporte'
import Reparadores        from './pages/Reparadores'
import ReparadorDetalle   from './pages/ReparadorDetalle'
import Presupuestos   from './pages/Presupuestos'
import Settings       from './pages/Settings'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/bienvenido" element={<Welcome />} />
          <Route path="/login"      element={<Login />} />
          <Route path="/sin-permiso" element={<SinPermiso />} />

          {/* Protected */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/mapa" element={<ProtectedRoute><Mapa /></ProtectedRoute>} />
          <Route path="/reportes" element={<ProtectedRoute><Reportes /></ProtectedRoute>} />
          <Route path="/reportes/nuevo" element={<ProtectedRoute><NuevoReporte /></ProtectedRoute>} />
          <Route path="/reportes/:id" element={<ProtectedRoute><ReporteDetalle /></ProtectedRoute>} />
          <Route path="/reparadores" element={<ProtectedRoute><Reparadores /></ProtectedRoute>} />
          <Route path="/reparadores/:id" element={<ProtectedRoute><ReparadorDetalle /></ProtectedRoute>} />
          <Route path="/presupuestos" element={<ProtectedRoute requiredRole="autoridad"><Presupuestos /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/bienvenido" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

const root = document.getElementById('app')
if (root) {
  const existingRoot = root.__reactRoot ?? createRoot(root)
  root.__reactRoot = existingRoot
  existingRoot.render(<App />)
}
