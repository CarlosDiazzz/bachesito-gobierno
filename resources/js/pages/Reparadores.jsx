import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import Badge from '../components/Badge'
import { mockReportes, mockReparadores, ESTADO_COLOR, ESTADO_LABEL } from '../data/mockData'

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function Reparadores() {
  const asignaciones = mockReportes.filter(r => r.estado === 'asignado' || r.estado === 'en_proceso')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <div style={{ marginLeft: '240px', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Reparadores" />
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {mockReparadores.map(r => {
              const total = r.asignados + r.resueltos
              const pct = total > 0 ? (r.resueltos / total) * 100 : 0
              return (
                <div key={r.id} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, flexShrink: 0 }}>
                      {getInitials(r.name)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '15px' }}>{r.name}</div>
                      <Badge
                        label={r.status === 'activo' ? 'Activo' : 'Inactivo'}
                        color={r.status === 'activo' ? 'var(--success)' : 'var(--text-muted)'}
                        bgColor={r.status === 'activo' ? 'var(--success-light)' : 'var(--surface-2)'}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '14px', fontSize: '13px' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '18px' }}>{r.asignados}</span>
                      <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>asignados</span>
                    </div>
                    <div style={{ color: 'var(--border-strong)' }}>|</div>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '18px' }}>{r.resueltos}</span>
                      <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>resueltos</span>
                    </div>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      <span>Tasa de resolución</span><span>{Math.round(pct)}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--surface-2)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--success)', borderRadius: '3px', transition: 'width 0.3s' }} />
                    </div>
                  </div>
                  <button style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid var(--primary)', color: 'var(--primary)', background: 'transparent', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                    Ver detalle
                  </button>
                </div>
              )
            })}
          </div>

          {/* Asignaciones recientes */}
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Asignaciones recientes</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead style={{ background: 'var(--surface-2)' }}>
                <tr style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                  {['Folio', 'Vía', 'Reparador', 'Estado', 'Fecha asignación'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {asignaciones.map((r, i) => {
                  const rep = mockReparadores[i % mockReparadores.length]
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>{r.folio}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 500 }}>{r.nombre_via}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>
                            {getInitials(rep.name)}
                          </div>
                          {rep.name}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <Badge label={ESTADO_LABEL[r.estado]} color={ESTADO_COLOR[r.estado]} bgColor={`${ESTADO_COLOR[r.estado]}22`} />
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '12px' }}>
                        {new Date(r.fecha_reporte).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  )
                })}
                {asignaciones.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Sin asignaciones activas</td></tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  )
}
