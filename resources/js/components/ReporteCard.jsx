import Badge from './Badge'
import { PRIORIDAD_COLOR, ESTADO_COLOR, ESTADO_LABEL } from '../data/mockData'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours} hora${hours !== 1 ? 's' : ''}`
  const days = Math.floor(hours / 24)
  return `hace ${days} día${days !== 1 ? 's' : ''}`
}

const PRIO_LABEL = { critica: 'Crítica', alta: 'Alta', media: 'Media', baja: 'Baja' }
const PRIO_BG = { critica: '#FEE8EB', alta: '#FEF3E8', media: '#FEFAE8', baja: '#EDF7E8' }

export default function ReporteCard({ reporte, onSelect }) {
  const prioColor = PRIORIDAD_COLOR[reporte.prioridad]
  return (
    <div
      onClick={() => onSelect && onSelect(reporte)}
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-md)',
        borderLeft: `4px solid ${prioColor}`,
        padding: '12px',
        cursor: 'pointer',
        display: 'flex',
        gap: '10px',
        boxShadow: 'var(--shadow-sm)',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
    >
      <img
        src={reporte.foto}
        alt=""
        style={{ width: 60, height: 60, borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>{reporte.folio}</div>
        <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{reporte.nombre_via}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{reporte.colonia}, {reporte.municipio}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
          <Badge
            label={ESTADO_LABEL[reporte.estado] || reporte.estado}
            color={ESTADO_COLOR[reporte.estado]}
            bgColor={`${ESTADO_COLOR[reporte.estado]}22`}
          />
          <Badge
            label={PRIO_LABEL[reporte.prioridad] || reporte.prioridad}
            color={prioColor}
            bgColor={PRIO_BG[reporte.prioridad]}
          />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>Score <strong>{reporte.score_prioridad}</strong></span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{timeAgo(reporte.fecha_reporte)}</div>
      </div>
    </div>
  )
}
