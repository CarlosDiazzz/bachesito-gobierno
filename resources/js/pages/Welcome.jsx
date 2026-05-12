import { useNavigate } from 'react-router-dom'
import { MapPin, BarChart2, CheckCircle, Shield } from 'lucide-react'
import Footer from '../components/Footer'

const features = [
  { color: 'var(--primary)', Icon: Shield,      text: 'Respaldo Institucional Directo' },
  { color: 'var(--accent)',  Icon: BarChart2,   text: 'Análisis de Prioridad Técnica' },
  { color: 'var(--success)', Icon: CheckCircle, text: 'Seguimiento en Tiempo Real' },
]

export default function Welcome() {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'Inter, sans-serif', background: 'var(--bg)' }}>
      <style>{`
        @media (max-width: 1024px) {
          .welcome-split { flex-direction: column !important; }
          .welcome-left  { width: 100% !important; min-height: 400px !important; padding: 40px 20px !important; }
          .welcome-right { width: 100% !important; padding: 40px 20px !important; }
          .logo-container { width: 280px !important; height: 280px !important; padding: 30px !important; }
        }
        @media (max-width: 480px) {
          .logo-container { width: 200px !important; height: 200px !important; padding: 20px !important; }
          .welcome-title { fontSize: '24px' !important; }
        }
        .gov-card:hover  { background: var(--primary-light) !important; border-color: var(--primary) !important; transform: translateY(-4px); }
        .cit-card:hover  { background: var(--surface) !important; border-color: var(--accent) !important; transform: translateY(-4px); }
        .main-btn:hover  { background: var(--primary-dark) !important; box-shadow: var(--shadow-lg); }
        .feature-item:hover { transform: translateX(8px); }
      `}</style>

      {/* Main Content Split */}
      <div className="welcome-split" style={{ display: 'flex', flex: 1 }}>
        
        {/* LEFT — Branding & Greca */}
        <div className="welcome-left" style={{
          flex: 1.2,
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url("/images/imagen_calle.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '60px',
          overflow: 'hidden',
          borderRight: '1px solid var(--border)'
        }}>
          {/* Authentic Zapotec Greca Overlays */}
          <div className="bg-greca" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '24px', opacity: 0.3 }} />
          <div className="bg-greca" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '24px', opacity: 0.3, transform: 'rotate(180deg)' }} />
          
          <div style={{ maxWidth: '600px', color: 'var(--text-primary)', position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', marginBottom: '40px', textAlign: 'center' }}>
              <div className="logo-container" style={{ 
                width: '440px', height: '440px', borderRadius: '50%', background: 'var(--surface)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                boxShadow: 'var(--shadow-lg)', border: '10px solid var(--accent)',
                padding: '50px'
              }}>
                <img 
                  src="/images/logo.png" 
                  alt="Logo Institucional" 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                />
              </div>
              <div style={{ marginTop: '24px' }}>
                <div style={{ fontSize: '18px', fontWeight: 900, color: 'white', letterSpacing: '8px', textTransform: 'uppercase', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  Atención Ciudadana
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '4px', marginTop: '8px', textTransform: 'uppercase', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                  Municipio de Oaxaca de Juárez
                </div>
              </div>
            </div>

            <div style={{ height: '4px', width: '80px', background: 'var(--accent)', margin: '32px auto' }} />
            
            <h2 style={{ fontSize: '28px', fontWeight: 700, lineHeight: 1.2, marginBottom: '24px', textAlign: 'center', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
              Transformando la infraestructura vial con <span style={{ color: 'var(--accent)' }}>identidad y tecnología.</span>
            </h2>

            {/* Features */}
            <div style={{ marginTop: '48px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {features.map(({ color, Icon, text }) => (
                <div key={text} className="feature-item" style={{ display: 'flex', alignItems: 'center', gap: '18px', transition: 'transform 0.3s' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '8px',
                    background: 'var(--bg)',
                    border: `1px solid ${color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={20} color={color} />
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Access cards */}
        <div className="welcome-right" style={{
          width: '520px', flexShrink: 0,
          background: 'var(--bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '60px 40px',
          borderLeft: '1px solid var(--border)'
        }}>
          <div style={{ width: '100%', maxWidth: '420px' }}>
            <div style={{ marginBottom: '40px' }}>
              <div style={{ display: 'inline-block', padding: '4px 12px', background: 'var(--accent)', color: 'white', fontSize: '10px', fontWeight: 900, borderRadius: '4px', marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Acceso Institucional
              </div>
              <h1 style={{ fontSize: '36px', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-1px', lineHeight: 1 }}>
                Bienvenido al Panel
              </h1>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Selecciona tu perfil de acceso para continuar.
              </p>
            </div>

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              <div
                className="gov-card"
                onClick={() => navigate('/login')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '20px',
                  background: 'var(--surface)', border: '1px solid var(--border)', 
                  borderRadius: 'var(--radius-lg)', padding: '24px', 
                  cursor: 'pointer', transition: 'all 0.3s',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <Shield size={28} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--primary)', textTransform: 'uppercase' }}>Personal Municipal</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Gestión, Supervisión y Reparación</div>
                </div>
              </div>

              <div
                className="cit-card"
                onClick={() => window.open('#', '_blank')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '20px',
                  background: 'var(--surface)', border: '1px solid var(--border)', 
                  borderRadius: 'var(--radius-lg)', padding: '24px', 
                  cursor: 'pointer', transition: 'all 0.3s',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                  <MapPin size={28} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--accent)', textTransform: 'uppercase' }}>Ciudadanía</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Reportes Ciudadanos y Consulta</div>
                </div>
              </div>
            </div>

            <button
              className="main-btn"
              onClick={() => navigate('/login')}
              style={{
                width: '100%', padding: '18px', borderRadius: 'var(--radius-md)',
                background: 'var(--primary)', color: 'white', border: 'none',
                fontWeight: 800, fontSize: '16px', cursor: 'pointer', 
                transition: 'all 0.3s', textTransform: 'uppercase', letterSpacing: '1px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'
              }}
            >
              Iniciar Sesión <Shield size={18} />
            </button>

            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
                Municipio de Oaxaca de Juárez · 2026
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Footer */}
      <Footer />
    </div>
  )
}
