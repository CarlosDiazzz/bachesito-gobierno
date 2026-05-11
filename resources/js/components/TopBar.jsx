import { Bell, ChevronDown } from 'lucide-react'

export default function TopBar({ title }) {
  return (
    <div style={{
      height: '60px',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ position: 'relative' }}>
          <Bell size={20} style={{ color: 'var(--text-secondary)', cursor: 'pointer' }} />
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: 'var(--danger)',
            color: 'white',
            fontSize: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
          }}>3</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: 600,
          }}>AD</div>
          <span style={{ fontSize: '14px', fontWeight: 500 }}>Admin</span>
          <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>
    </div>
  )
}
