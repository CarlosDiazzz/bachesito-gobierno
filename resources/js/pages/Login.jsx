import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { login } = useAuth()
  const navigate = useNavigate()

  const quickUsers = [
    { label: 'Admin', email: 'admin@bachesito.gob.mx', password: 'BachesITO2026!' },
    { label: 'Supervisor', email: 'supervisor@bachesito.gob.mx', password: 'Supervisor2026!' },
    { label: 'Reparador', email: 'reparador@bachesito.gob.mx', password: 'Reparador2026!' },
    { label: 'Ciudadano', email: 'ciudadano@bachesito.gob.mx', password: 'Ciudadano2026!' },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await login(email, password)
      if (user) {
        navigate('/')
      } else {
        setError('Credenciales institucionales incorrectas.')
      }
    } catch (err) {
      setError(err.message || 'Error de conexión con el servidor oficial.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .login-input:focus { border-color: var(--primary) !important; box-shadow: 0 0 0 4px var(--primary-light) !important; outline: none; }
        .quick-btn:hover   { background: var(--surface-2) !important; border-color: var(--accent) !important; color: var(--primary) !important; }
        .submit-btn:hover:not(:disabled) { background: var(--primary-dark) !important; transform: translateY(-1px); box-shadow: var(--shadow-md); }
      `}</style>

      {/* Top Greca decoration */}
      <div className="greca-band" style={{ position: 'fixed', top: 0, opacity: 0.05, height: '120px' }} />

      <div style={{ width: '100%', maxWidth: '440px', padding: '20px', position: 'relative', zIndex: 2 }}>
        {/* Logo Section - Large & Centered */}
        <div style={{ textAlign: 'center', marginBottom: '40px', paddingTop: '40px' }}>
          <img 
            src="/images/logo.png" 
            alt="Logo Institucional" 
            style={{ width: '220px', height: '220px', objectFit: 'contain', marginBottom: '16px' }} 
          />
          <div style={{ fontSize: '12px', fontWeight: 900, color: 'var(--accent)', letterSpacing: '4px', textTransform: 'uppercase' }}>
            Atención Ciudadana
          </div>
          <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '2px', marginTop: '4px', textTransform: 'uppercase' }}>
            Oaxaca de Juárez
          </p>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', padding: '40px', border: '1px solid var(--border)' }}>
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Acceso Institucional</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Ingresa tus credenciales oficiales</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Correo Institucional
              </label>
              <input
                className="login-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@bachesito.gob.mx"
                required
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)', fontSize: '15px',
                  background: 'var(--bg)', color: 'var(--text-primary)',
                  transition: 'all 0.2s',
                }}
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Contraseña
                </label>
                <a href="#" style={{ fontSize: '11px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 700 }}>
                  ¿Problemas de acceso?
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
                    width: '100%', padding: '14px 44px 14px 16px', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)', fontSize: '15px',
                    background: 'var(--bg)', color: 'var(--text-primary)',
                    transition: 'all 0.2s',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: 'var(--primary-light)', border: '1px solid var(--primary)',
                borderRadius: 'var(--radius-md)', padding: '12px',
                color: 'var(--primary)', fontSize: '12px', fontWeight: 600
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <button
              className="submit-btn"
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '16px', borderRadius: 'var(--radius-md)',
                background: loading ? 'var(--text-muted)' : 'var(--primary)',
                color: 'white', border: 'none', fontWeight: 800, fontSize: '15px',
                cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                textTransform: 'uppercase', letterSpacing: '1px'
              }}
            >
              {loading && (
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  animation: 'spin 0.8s linear infinite',
                }} />
              )}
              {loading ? 'Verificando...' : 'Entrar al Sistema'}
            </button>
          </form>

          {/* Quick access */}
          <div style={{ marginTop: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Entorno de Pruebas</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {quickUsers.map(u => (
                <button
                  key={u.label}
                  type="button"
                  className="quick-btn"
                  onClick={() => { setEmail(u.email); setPassword(u.password) }}
                  style={{
                    padding: '8px', borderRadius: '4px',
                    border: '1px solid var(--border)', background: 'transparent',
                    fontSize: '10px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.15s',
                    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px'
                  }}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link to="/bienvenido" style={{ color: 'var(--accent)', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
            ← Volver a Inicio
          </Link>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '16px', fontWeight: 600 }}>
            H. AYUNTAMIENTO DE OAXACA DE JUÁREZ · 2026
          </p>
        </div>
      </div>
      
      {/* Bottom Greca */}
      <div className="greca-band-gold" style={{ position: 'fixed', bottom: 0, height: '8px', width: '100%' }} />
    </div>
  )
}
