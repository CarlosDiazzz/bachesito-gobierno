import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, MapPin, ClipboardList, Users, Wallet, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const ALL_NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',      path: '/',             roles: ['ciudadano','reparador','supervisor','autoridad'] },
  { icon: MapPin,          label: 'Mapa de Baches', path: '/mapa',         roles: ['reparador','supervisor','autoridad'] },
  { icon: ClipboardList,   label: 'Reportes',        path: '/reportes',    roles: ['reparador','supervisor','autoridad'] },
  { icon: Users,           label: 'Reparadores',     path: '/reparadores', roles: ['supervisor','autoridad'] },
  { icon: Wallet,          label: 'Presupuestos',    path: '/presupuestos',roles: ['autoridad'] },
]

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U'
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const navItems = ALL_NAV.filter(item =>
    item.roles.some(r => user?.roles?.includes(r))
  )

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div style={{
      width: '240px',
      height: '100vh',
      background: 'var(--sidebar-bg)',
      position: 'fixed',
      left: 0,
      top: 0,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', width: '24px', height: '24px', flexShrink: 0 }}>
            <div style={{ background: 'var(--oax-magenta)',  borderRadius: '2px' }} />
            <div style={{ background: 'var(--oax-turquesa)', borderRadius: '2px' }} />
            <div style={{ background: 'var(--oax-purpura)',  borderRadius: '2px' }} />
            <div style={{ background: 'var(--oax-amarillo)', borderRadius: '2px' }} />
          </div>
          <div>
            <div style={{ color: 'white', fontSize: '18px', fontWeight: 700, lineHeight: 1.2 }}>BachesITO</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Gobierno de Oaxaca</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {navItems.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: isActive ? 500 : 400,
              color: isActive ? 'white' : 'var(--sidebar-text)',
              background: isActive ? 'rgba(0,152,212,0.20)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--sidebar-active)' : '3px solid transparent',
              paddingLeft: isActive ? '7px' : '10px',
              transition: 'background 0.15s',
              textDecoration: 'none',
            })}
            onMouseEnter={e => { if (!e.currentTarget.style.borderLeft.includes('var(--sidebar-active)')) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={e => { if (!e.currentTarget.style.borderLeft.includes('var(--sidebar-active)')) e.currentTarget.style.background = 'transparent' }}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--oax-purpura)', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: 600, flexShrink: 0,
        }}>
          {getInitials(user?.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: 'white', fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '118px' }}>
            {user?.name?.slice(0, 18) || 'Usuario'}
          </div>
          <span style={{
            display: 'inline-block', fontSize: '10px', fontWeight: 500,
            color: 'white', background: 'var(--oax-turquesa)',
            padding: '1px 6px', borderRadius: '999px', marginTop: '2px',
          }}>
            {user?.roles?.[0] || 'guest'}
          </span>
        </div>
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', padding: '4px', borderRadius: '4px',
            display: 'flex', alignItems: 'center', flexShrink: 0,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  )
}
