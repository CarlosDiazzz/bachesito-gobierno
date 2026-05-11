import { useNavigate } from 'react-router-dom'
import { MapPin, BarChart2, CheckCircle, LayoutDashboard } from 'lucide-react'

const features = [
  { color: 'var(--oax-turquesa)', Icon: MapPin,     text: 'Geolocalización en tiempo real' },
  { color: 'var(--oax-amarillo)', Icon: BarChart2,   text: 'Priorización inteligente con IA' },
  { color: 'var(--oax-verde)',    Icon: CheckCircle, text: 'Ciclo completo ciudadano-gobierno' },
]

export default function Welcome() {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @media (max-width: 768px) {
          .welcome-split { flex-direction: column !important; }
          .welcome-left  { min-height: 340px !important; }
          .welcome-right { padding: 32px 20px !important; }
          .welcome-cards { flex-direction: column !important; }
        }
        .gov-card:hover  { background: var(--primary-light) !important; border-color: var(--primary) !important; transform: translateY(-2px); }
        .cit-card:hover  { background: var(--surface-2) !important; transform: translateY(-2px); }
        .main-btn:hover  { background: var(--primary-dark) !important; }
        .quick-btn:hover { background: var(--surface-2) !important; }
      `}</style>

      {/* LEFT — Branding */}
      <div className="welcome-left" style={{
        flex: 1,
        background: 'linear-gradient(135deg, var(--oax-guinda) 0%, var(--oax-purpura) 50%, var(--oax-azul) 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 40px',
      }}>
        <div style={{ maxWidth: '380px', color: 'white' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', width: '52px', height: '52px', flexShrink: 0 }}>
              <div style={{ background: 'var(--oax-magenta)',  borderRadius: '4px' }} />
              <div style={{ background: 'var(--oax-turquesa)', borderRadius: '4px' }} />
              <div style={{ background: 'var(--oax-amarillo)', borderRadius: '4px' }} />
              <div style={{ background: 'var(--oax-purpura)',  borderRadius: '4px' }} />
            </div>
            <div>
              <div style={{ fontSize: '48px', fontWeight: 800, letterSpacing: '-1px', lineHeight: 1 }}>BachesITO</div>
              <div style={{ fontSize: '16px', opacity: 0.7, marginTop: '4px' }}>Sistema de Gestión Vial</div>
            </div>
          </div>

          <div style={{ width: '60px', height: '2px', background: 'rgba(255,255,255,0.3)', margin: '20px 0' }} />
          <div style={{ fontSize: '14px', opacity: 0.6, marginBottom: '4px' }}>Gobierno del Estado de Oaxaca</div>
          <div style={{ fontSize: '13px', opacity: 0.4 }}>2022 — 2028</div>

          {/* Features */}
          <div style={{ marginTop: '48px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {features.map(({ color, Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={16} color="white" />
                </div>
                <span style={{ fontSize: '14px', opacity: 0.9 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — Access cards */}
      <div className="welcome-right" style={{
        width: '480px', flexShrink: 0,
        background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 32px',
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Acceso al sistema
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
            Selecciona tu tipo de acceso
          </p>

          {/* Cards */}
          <div className="welcome-cards" style={{ display: 'flex', gap: '16px', marginBottom: '28px' }}>
            <div
              className="gov-card"
              onClick={() => navigate('/login')}
              style={{
                flex: 1, border: '2px solid var(--primary)', borderRadius: 'var(--radius-lg)',
                padding: '24px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
              }}
            >
              <LayoutDashboard size={32} style={{ color: 'var(--primary)', marginBottom: '10px' }} />
              <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '6px' }}>Personal Municipal</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Supervisores, reparadores y autoridades</div>
            </div>
            <div
              className="cit-card"
              onClick={() => window.open('#', '_blank')}
              style={{
                flex: 1, border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
                padding: '24px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
              }}
            >
              <MapPin size={32} style={{ color: 'var(--oax-turquesa)', marginBottom: '10px' }} />
              <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '6px' }}>Ciudadano</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Reporta un bache en tu colonia</div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>o continúa directamente</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          <button
            className="main-btn"
            onClick={() => navigate('/login')}
            style={{
              width: '100%', padding: '14px', borderRadius: 'var(--radius-md)',
              background: 'var(--primary)', color: 'white', border: 'none',
              fontWeight: 600, fontSize: '15px', cursor: 'pointer', transition: 'background 0.2s',
            }}
          >
            Ingresar al panel →
          </button>

          <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '32px' }}>
            BachesITO v1.0 · HackaTec 2026 · Instituto Tecnológico de Oaxaca
          </p>
        </div>
      </div>
    </div>
  )
}
