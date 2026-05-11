export default function StatCard({ icon: Icon, label, value, sub, color, trend }) {
  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-sm)',
      padding: '20px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '16px',
    }}>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: '8px',
        background: color.replace(')', ', 0.15)').replace('var(', 'color-mix(in srgb, ').replace(', 0.15)', ' 15%, transparent)'),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        backgroundColor: `${color}26`,
      }}>
        {Icon && <Icon size={20} style={{ color }} />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{sub}</div>}
        {trend && (
          <div style={{
            fontSize: '12px',
            color: trend.positive ? 'var(--success)' : 'var(--danger)',
            marginTop: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
          }}>
            {trend.positive ? '↑' : '↓'} {trend.value}%
          </div>
        )}
      </div>
    </div>
  )
}
