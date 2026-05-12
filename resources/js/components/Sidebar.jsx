import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, MapPin, ClipboardList, Users, Wallet, LogOut, Brain } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'

const ALL_NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',      path: '/',               roles: ['ciudadano','reparador','supervisor','autoridad'] },
  { icon: MapPin,          label: 'Mapa de Baches', path: '/mapa',           roles: ['reparador','supervisor','autoridad'] },
  { icon: ClipboardList,   label: 'Reportes',       path: '/reportes',       roles: ['reparador','supervisor','autoridad'] },
  { icon: Brain,           label: 'Priorización IA', path: '/priorizacion',  roles: ['supervisor','autoridad'] },
  { icon: Users,           label: 'Reparadores',    path: '/reparadores',    roles: ['supervisor','autoridad'] },
  { icon: Wallet,          label: 'Presupuestos',   path: '/presupuestos',   roles: ['autoridad'] },
]

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U'
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { sidebarOpen, closeSidebar } = useUI()
  const navigate = useNavigate()

  const navItems = ALL_NAV.filter(item =>
    item.roles.some(r => user?.roles?.includes(r))
  )

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          onClick={closeSidebar}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 2050,
            display: window.innerWidth > 1024 ? 'none' : 'block',
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      <div style={{
        width: '260px',
        height: '100vh',
        background: 'var(--sidebar-bg)',
        position: 'fixed',
        left: 0,
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 2100,
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease',
      }}>
      {/* Navigation - Start immediately at the top */}
      <nav style={{ flex: 1, padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {navItems.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '14px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: isActive ? 900 : 500,
              color: isActive ? 'white' : 'rgba(255,255,255,0.6)',
              background: isActive ? '#4d0d24' : 'transparent', /* Darker Guinda for active item */
              borderLeft: isActive ? '4px solid var(--accent)' : '4px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.2s',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            })}
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '4px',
            background: 'var(--primary)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 900, flexShrink: 0,
            border: '1px solid var(--accent)',
          }}>
            {getInitials(user?.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: 'white', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name?.toUpperCase() || 'USUARIO'}
            </div>
            <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--accent)', marginTop: '2px' }}>
              {user?.roles?.[0]?.toUpperCase() || 'INVITADO'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#ffffff', padding: '6px', borderRadius: '4px',
              display: 'flex', alignItems: 'center', transition: 'color 0.2s',
              opacity: 0.6
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
      </div>
    </>
  )
}
