import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const quickUsers = [
  { label: 'Admin',      email: 'admin@bachesito.gob.mx',      password: 'BachesITO2026!' },
  { label: 'Supervisor', email: 'supervisor@bachesito.gob.mx', password: 'Supervisor2026!' },
  { label: 'Reparador',  email: 'reparador@bachesito.gob.mx',  password: 'Reparador2026!' },
]

export default function Login() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const auth      = useAuth()

  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await auth.login(email, password)
      navigate(location.state?.from?.pathname || '/', { replace: true })
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .login-input:focus { border-color: var(--primary) !important; box-shadow: 0 0 0 3px rgba(0,152,212,0.15) !important; outline: none; }
        .quick-btn:hover   { background: var(--surface-2) !important; }
        .submit-btn:hover:not(:disabled) { background: var(--primary-dark) !important; }
      `}</style>

      <div style={{ maxWidth: '440px', margin: '0 auto', padding: '10vh 20px 40px' }}>
        {/* Back arrow */}
        <Link to="/bienvenido" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', textDecoration: 'none' }}>
          ← Volver
        </Link>

        {/* Card */}
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', padding: '40px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', width: '28px', height: '28px', flexShrink: 0 }}>
              <div style={{ background: 'var(--oax-magenta)',  borderRadius: '2px' }} />
              <div style={{ background: 'var(--oax-turquesa)', borderRadius: '2px' }} />
              <div style={{ background: 'var(--oax-purpura)',  borderRadius: '2px' }} />
              <div style={{ background: 'var(--oax-amarillo)', borderRadius: '2px' }} />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 700, lineHeight: 1.2 }}>BachesITO</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Gobierno de Oaxaca</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Correo electrónico
              </label>
              <input
                className="login-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@bachesito.gob.mx"
                required
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)', fontSize: '15px',
                  background: 'var(--surface)', color: 'var(--text-primary)',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Contraseña
                </label>
                <a href="#" style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none' }}>
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  className="login-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '12px 44px 12px 16px', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)', fontSize: '15px',
                    background: 'var(--surface)', color: 'var(--text-primary)',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                    padding: '2px', display: 'flex',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'var(--danger-light)', border: '1px solid rgba(244,76,99,0.3)',
                borderRadius: 'var(--radius-md)', padding: '10px 14px',
                color: 'var(--danger)', fontSize: '13px',
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              className="submit-btn"
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px', borderRadius: 'var(--radius-md)',
                background: loading ? 'var(--text-muted)' : 'var(--primary)',
                color: 'white', border: 'none', fontWeight: 600, fontSize: '15px',
                cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              {loading && (
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderTop: '2px solid white',
                  animation: 'spin 0.8s linear infinite',
                }} />
              )}
              {loading ? 'Verificando...' : 'Ingresar al panel'}
            </button>
          </form>

          {/* Quick access */}
          <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Acceso rápido (demo)</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {quickUsers.map(u => (
                <button
                  key={u.label}
                  type="button"
                  className="quick-btn"
                  onClick={() => { setEmail(u.email); setPassword(u.password) }}
                  style={{
                    flex: 1, padding: '6px 12px', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)', background: 'transparent',
                    fontSize: '12px', cursor: 'pointer', transition: 'background 0.15s',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '24px' }}>
            Solo personal autorizado del Municipio de Oaxaca de Juárez
          </p>
        </div>
      </div>
    </div>
  )
}
