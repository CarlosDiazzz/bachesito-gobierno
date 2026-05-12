import { useState } from 'react'
import { Shield, Eye, EyeOff, Accessibility, Bell, Lock, Save, ArrowLeft } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import { useNavigate } from 'react-router-dom'

export default function Settings() {
  const navigate = useNavigate()
  const [showPass, setShowPass] = useState(false)
  
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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <div style={{ marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar title="Configuración del Sistema" />
        
        <div style={{ padding: '32px', maxWidth: '800px' }}>
          <button 
            onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '24px', fontWeight: 600, fontSize: '14px' }}
          >
            <ArrowLeft size={18} /> Volver
          </button>

          <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--primary)', marginBottom: '32px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Preferencias Institucionales
          </h2>

          {/* Seguridad Section */}
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Lock size={18} color="var(--primary)" /> Seguridad y Acceso
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Contraseña Actual</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} style={inputStyle} defaultValue="********" />
                  <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Nueva Contraseña</label>
                <input type="password" style={inputStyle} placeholder="Mínimo 12 caracteres" />
              </div>
            </div>
            
            <button style={{ marginTop: '20px', padding: '10px 20px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={16} /> Actualizar Credenciales
            </button>
          </div>

          {/* Accesibilidad Section */}
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Accessibility size={18} color="var(--accent)" /> Accesibilidad y Visualización
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>Modo de Alto Contraste</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mejora la legibilidad de textos y bordes</div>
                </div>
                <input type="checkbox" style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>Texto Grande</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Aumenta el tamaño de fuente en todo el panel</div>
                </div>
                <input type="checkbox" style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }} />
              </div>
            </div>
          </div>

          {/* Notificaciones Section */}
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bell size={18} color="var(--primary)" /> Notificaciones Críticas
            </h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{ flex: 1, padding: '12px', border: '1px solid var(--border)', background: 'white', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Email Institucional: <b>Activado</b>
              </button>
              <button style={{ flex: 1, padding: '12px', border: '1px solid var(--border)', background: 'white', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Alertas Push: <b>Desactivado</b>
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Municipio de Oaxaca de Juárez · Sistema de Gestión Vial · 2026
          </div>
        </div>
      </div>
    </div>
  )
}
