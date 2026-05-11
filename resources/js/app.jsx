import 'leaflet/dist/leaflet.css'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Mapa from './pages/Mapa'
import Reportes from './pages/Reportes'
import Reparadores from './pages/Reparadores'
import Presupuestos from './pages/Presupuestos'
import '../css/app.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/mapa" element={<Mapa />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/reparadores" element={<Reparadores />} />
        <Route path="/presupuestos" element={<Presupuestos />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

const root = document.getElementById('app')
if (root) createRoot(root).render(<App />)
