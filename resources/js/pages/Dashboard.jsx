import { useNavigate } from 'react-router-dom'
import { MapPin, AlertTriangle, Clock, CheckCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import StatCard from '../components/StatCard'
import MapaReportes from '../components/MapaReportes'
import Badge from '../components/Badge'
import { mockReportes, mockStats, mockReparadores, mockPresupuestos, PRIORIDAD_COLOR, ESTADO_COLOR, ESTADO_LABEL } from '../data/mockData'

const PRIO_LABEL = { critica: 'Crítica', alta: 'Alta', media: 'Media', baja: 'Baja' }
const PRIO_BG    = { critica: '#FEE8EB', alta: '#FEF3E8', media: '#FEFAE8', baja: '#EDF7E8' }

function formatFecha(dateStr) {
  return new Date(dateStr).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function Dashboard() {
  const navigate = useNavigate()
  const criticos = mockReportes.filter(r => r.prioridad === 'critica' || r.prioridad === 'alta').slice(0, 4)
  const ultimos  = [...mockReportes].slice(-6).reverse()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <div style={{ marginLeft: '240px', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Dashboard" />
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Section 1 — Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
            <StatCard icon={MapPin}       label="Total Reportes"     value={mockStats.total}         color="var(--primary)"  sub="este mes" />
            <StatCard icon={AlertTriangle} label="Baches Críticos"   value={mockStats.criticos}      color="var(--danger)"   trend={{ value: 15, positive: false }} />
            <StatCard icon={Clock}        label="En Proceso"          value={mockStats.en_proceso}    color="var(--warning)" />
            <StatCard icon={CheckCircle}  label="Resueltos este mes"  value={mockStats.resueltos_mes} color="var(--success)"  trend={{ value: 8, positive: true }} />
          </div>

          {/* Section 2 — Mapa + críticos */}
          <div style={{ display: 'grid', gridTemplateColumns: '60fr 40fr', gap: '16px' }}>
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Mapa rápido</h3>
              <div style={{ height: '340px' }}>
                <MapaReportes reportes={mockReportes} />
              </div>
            </div>
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Baches críticos</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {criticos.map(r => (
                  <div
                    key={r.id}
                    onClick={() => navigate('/reportes')}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '6px', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORIDAD_COLOR[r.prioridad], flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{r.folio}</div>
                      <div style={{ fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.nombre_via}</div>
                    </div>
                    <Badge label={ESTADO_LABEL[r.estado]} color={ESTADO_COLOR[r.estado]} bgColor={`${ESTADO_COLOR[r.estado]}22`} />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: PRIORIDAD_COLOR[r.prioridad], background: PRIO_BG[r.prioridad], padding: '2px 6px', borderRadius: '4px' }}>{r.score_prioridad}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3 — Presupuesto + Reparadores */}
          <div style={{ display: 'grid', gridTemplateColumns: '55fr 45fr', gap: '16px' }}>
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Presupuesto 2026</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={mockPresupuestos} barCategoryGap="30%">
                  <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => `$${v.toLocaleString('es-MX')}`} />
                  <Bar dataKey="asignado" name="Asignado" fill="#0098D466" radius={[4,4,0,0]} />
                  <Bar dataKey="ejercido"  name="Ejercido"  fill="#0098D4"   radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Reparadores activos</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                    <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 500 }}>Nombre</th>
                    <th style={{ textAlign: 'center', padding: '4px 8px', fontWeight: 500 }}>Asignados</th>
                    <th style={{ textAlign: 'center', padding: '4px 8px', fontWeight: 500 }}>Resueltos</th>
                    <th style={{ textAlign: 'center', padding: '4px 8px', fontWeight: 500 }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {mockReparadores.map(r => (
                    <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 8px', fontWeight: 500 }}>{r.name}</td>
                      <td style={{ padding: '8px 8px', textAlign: 'center', color: 'var(--text-secondary)' }}>{r.asignados}</td>
                      <td style={{ padding: '8px 8px', textAlign: 'center', color: 'var(--text-secondary)' }}>{r.resueltos}</td>
                      <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: r.status === 'activo' ? 'var(--success)' : 'var(--text-muted)' }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4 — Últimos reportes */}
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Últimos reportes</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                  {['Folio','Vía','Colonia','Prioridad','Estado','Score','Fecha','Acciones'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ultimos.map(r => (
                  <tr
                    key={r.id}
                    style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>{r.folio}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{r.nombre_via}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{r.colonia}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <Badge label={PRIO_LABEL[r.prioridad]} color={PRIORIDAD_COLOR[r.prioridad]} bgColor={PRIO_BG[r.prioridad]} />
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <Badge label={ESTADO_LABEL[r.estado]} color={ESTADO_COLOR[r.estado]} bgColor={`${ESTADO_COLOR[r.estado]}22`} />
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 700 }}>{r.score_prioridad}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '12px' }}>{formatFecha(r.fecha_reporte)}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <button
                        onClick={() => navigate('/reportes')}
                        style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--primary)', color: 'var(--primary)', background: 'transparent', cursor: 'pointer' }}
                      >Ver</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  )
}
