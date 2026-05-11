import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'

export default function SinPermiso() {
  const navigate = useNavigate()
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--bg)', gap: '16px', fontFamily: 'Inter, sans-serif',
    }}>
      <Lock size={64} style={{ color: 'var(--danger)' }} />
      <h1 style={{ fontSize: '28px', fontWeight: 700 }}>Sin permiso</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>No tienes acceso a esta sección.</p>
      <button
        onClick={() => navigate('/')}
        style={{
          marginTop: '8px', padding: '10px 24px', borderRadius: 'var(--radius-md)',
          background: 'var(--primary)', color: 'white', border: 'none',
          fontWeight: 600, fontSize: '14px', cursor: 'pointer',
        }}
      >
        Volver al inicio
      </button>
    </div>
  )
}
