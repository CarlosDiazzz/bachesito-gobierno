import { useState } from 'react'
import { Accessibility, Bell, Save, ArrowLeft } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import { useNavigate } from 'react-router-dom'

export default function Settings() {
  const navigate = useNavigate()
  const [highContrast, setHighContrast] = useState(false)
  const [largeText, setLargeText] = useState(false)
  const [themeMode, setThemeMode] = useState('light')
  const [applied, setApplied] = useState(false)

  const sectionStyle = {
    background: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    marginBottom: '24px'
  }

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 800,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '8px'
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    background: 'var(--bg)',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s'
  }

  return (
    <div className="main-layout">
      <Sidebar />
      <div className="content-wrapper">
        <TopBar title="Configuración" />
        
        <div className="container-fluid">
          <button 
            onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '8px', fontWeight: 600, fontSize: '14px', padding: 0 }}
          >
            <ArrowLeft size={18} /> Volver
          </button>

          <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--primary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Preferencias
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth <= 1024 ? '1fr' : '1fr 1fr', gap: '24px', alignItems: 'start' }}>
            
            {/* Accesibilidad Section */}
            <div style={{ ...sectionStyle, marginBottom: 0 }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Accessibility size={18} color="var(--accent)" /> Accesibilidad
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg)', borderRadius: '8px', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>Modo de Alto Contraste</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Mejora la legibilidad</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={highContrast}
                    onChange={() => setHighContrast(!highContrast)}
                    style={{ width: '20px', height: '20px', accentColor: 'var(--primary)', flexShrink: 0 }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg)', borderRadius: '8px', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>Texto Grande</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Aumenta el tamaño de fuente</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={largeText}
                    onChange={() => setLargeText(!largeText)}
                    style={{ width: '20px', height: '20px', accentColor: 'var(--primary)', flexShrink: 0 }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg)', borderRadius: '8px', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>Tema</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Claro u Oscuro</div>
                  </div>
                  <select
                    value={themeMode}
                    onChange={(e) => setThemeMode(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'white', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                  >
                    <option value="light">Claro</option>
                    <option value="dark">Oscuro</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notificaciones Section */}
            <div style={{ ...sectionStyle, marginBottom: 0 }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Bell size={18} color="var(--primary)" /> Notificaciones
              </h3>
              <div style={{ display: 'flex', flexDirection: window.innerWidth <= 480 ? 'column' : 'row', gap: '12px' }}>
                <button style={{ flex: 1, padding: '12px', border: '1px solid var(--border)', background: 'white', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
                  Email: <b>Activado</b>
                </button>
                <button style={{ flex: 1, padding: '12px', border: '1px solid var(--border)', background: 'white', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
                  Push: <b>Desactivado</b>
                </button>
              </div>
              
              <button
                onClick={() => setApplied(true)}
                style={{
                  marginTop: '24px',
                  width: '100%',
                  padding: '14px',
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                <Save size={16} style={{ marginRight: '8px' }} /> Aplicar cambios
              </button>

              {applied && (
                <div style={{ marginTop: '16px', padding: '14px 16px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--success)', fontWeight: 700, fontSize: '13px', textAlign: 'center' }}>
                  Configuración aplicada correctamente.
                </div>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '24px' }}>
            Municipio de Oaxaca de Juárez · Sistema de Gestión Vial · 2026
          </div>
        </div>
      </div>
    </div>
  )
}
