import React, { useState } from 'react'
import { ChevronDown, User, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function TopBar({ title }) {
  const [showMenu, setShowMenu] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'AD'

  return (
    <header style={{ 
      position: 'sticky', 
      top: 0, 
      zIndex: 5000,
      width: '100%',
      background: '#ffffff',
      borderBottom: '4px solid var(--accent)',
      boxShadow: 'var(--shadow-md)'
    }}>
      {/* Top Greca Band - Frame effect */}
      <div className="bg-greca" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '12px', opacity: 0.8 }} />
      
      {/* Bottom Greca Band (Rotated) - Frame effect */}
      <div className="bg-greca" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '12px', opacity: 0.8, transform: 'rotate(180deg)' }} />

      <div style={{
        position: 'relative',
        zIndex: 10,
        height: '110px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <img 
            src="/images/logo.png" 
            alt="Logo Institucional" 
            style={{ width: '100px', height: '100px', objectFit: 'contain' }} 
          />
          <div style={{ height: '40px', width: '1px', background: 'var(--border)' }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--accent)', letterSpacing: '3px', textTransform: 'uppercase' }}>
              ATENCIÓN CIUDADANA
            </div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', marginTop: '2px', textTransform: 'uppercase' }}>
              OAXACA DE JUÁREZ
            </div>
          </div>
          <div style={{ height: '40px', width: '1px', background: 'var(--border)', marginLeft: '24px' }} />
          <h1 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--primary)', letterSpacing: '1px', textTransform: 'uppercase' }}>
            {title || 'PANEL DE CONTROL INSTITUCIONAL'}
          </h1>
        </div>

        {/* Right: User Menu */}
        <div style={{ position: 'relative' }}>
          <div 
            onClick={() => setShowMenu(!showMenu)}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'var(--primary)', fontSize: '14px', border: '2px solid var(--accent)' }}>
              {initials}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>{user?.name || 'Admin'}</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>{user?.roles?.[0] || 'Súper Usuario'}</div>
            </div>
            <ChevronDown size={18} style={{ color: 'var(--text-muted)', transform: showMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>

          {showMenu && (
            <div style={{
              position: 'absolute',
              top: '120%',
              right: 0,
              width: '220px',
              background: 'white',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border)',
              padding: '8px',
              zIndex: 6000,
              animation: 'slideDown 0.2s ease-out'
            }}>
              <style>{`
                @keyframes slideDown {
                  from { opacity: 0; transform: translateY(-10px); }
                  to { opacity: 1; transform: translateY(0); }
                }
                .menu-item:hover { background: var(--bg); color: var(--primary) !important; }
              `}</style>
              
              <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', marginBottom: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Opciones de Cuenta</div>
              </div>

              {[
              { icon: User, label: 'Mi Perfil', onClick: () => { navigate('/profile'); setShowMenu(false); } },
                { icon: Settings, label: 'Configuración', onClick: () => { navigate('/settings'); setShowMenu(false); } },
              ].map((item, i) => (
                <div 
                  key={i}
                  className="menu-item"
                  onClick={item.onClick}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  <item.icon size={16} />
                  {item.label}
                </div>
              ))}

              <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0' }} />

              <div 
                className="menu-item"
                onClick={handleLogout}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--danger)', cursor: 'pointer', transition: 'all 0.15s' }}
              >
                <LogOut size={16} />
                Cerrar Sesión
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
