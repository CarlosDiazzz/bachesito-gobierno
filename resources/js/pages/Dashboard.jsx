import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, AlertTriangle, Clock, CheckCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import StatCard from '../components/StatCard'
import MapaReportes from '../components/MapaReportes'
import Badge from '../components/Badge'
import { api } from '../lib/api'
import { PRIORIDAD_COLOR, ESTADO_COLOR, ESTADO_LABEL } from '../data/mockData'

const PRIO_LABEL = { critica: 'Crítica', alta: 'Alta', media: 'Media', baja: 'Baja' }
const PRIO_BG    = { critica: '#FEE8EB', alta: '#FEF3E8', media: '#FEFAE8', baja: '#EDF7E8' }

function formatFecha(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const STATS_DEFAULT = { total: 0, pendientes: 0, en_proceso: 0, resueltos_mes: 0, criticos: 0, presupuesto_ejercido: 0, presupuesto_total: 0 }

export default function Dashboard() {
  const navigate = useNavigate()

  const [stats,      setStats]      = useState(STATS_DEFAULT)
  const [criticos,   setCriticos]   = useState([])
  const [recientes,  setRecientes]  = useState([])
  const [mapaData,   setMapaData]   = useState([])
  const [presupuestos, setPresupuestos] = useState([])
  const [reparadores,  setReparadores]  = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/dashboard/stats'),
      api.get('/api/dashboard/criticos'),
      api.get('/api/dashboard/recientes'),
      api.get('/api/reportes/mapa'),
      api.get('/api/presupuestos'),
      api.get('/api/reparadores'),
    ]).then(([statsData, criticosData, recientesData, mapaRes, presData, repData]) => {
      setStats(statsData)
      setCriticos(criticosData)
      setRecientes(recientesData)
      setMapaData(mapaRes)
      setPresupuestos(presData.por_mes ?? [])
      setReparadores(repData)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
        <Sidebar />
        <div style={{ marginLeft: '240px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid var(--border)', borderTop: '4px solid var(--primary)', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <div style={{ marginLeft: '240px', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Dashboard" />
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
            <StatCard icon={MapPin}        label="Total Reportes"    value={stats.total}         color="var(--primary)"  sub="registrados" />
            <StatCard icon={AlertTriangle} label="Baches Críticos"   value={stats.criticos}      color="var(--danger)"   trend={{ value: 0, positive: false }} />
            <StatCard icon={Clock}         label="En Proceso"        value={stats.en_proceso}    color="var(--warning)" />
            <StatCard icon={CheckCircle}   label="Resueltos este mes" value={stats.resueltos_mes} color="var(--success)" />
          </div>

          {/* Mapa + críticos */}
          <div style={{ display: 'grid', gridTemplateColumns: '60fr 40fr', gap: '16px' }}>
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Mapa rápido</h3>
              <div style={{ height: '340px' }}>
                <MapaReportes reportes={mapaData} />
              </div>
            </div>
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Baches críticos</h3>
              {criticos.length === 0
                ? <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '32px 0' }}>Sin baches críticos activos</p>
                : criticos.map(r => (
                  <div key={r.id} onClick={() => navigate('/reportes')}
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
                ))
              }
            </div>
          </div>

          {/* Presupuesto + reparadores */}
          <div style={{ display: 'grid', gridTemplateColumns: '55fr 45fr', gap: '16px' }}>
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Presupuesto {new Date().getFullYear()}</h3>
              {presupuestos.length === 0
                ? <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '32px 0' }}>Sin datos de presupuesto</p>
                : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={presupuestos} barCategoryGap="30%">
                      <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={v => `$${v.toLocaleString('es-MX')}`} />
                      <Bar dataKey="asignado" name="Asignado" fill="#0098D466" radius={[4,4,0,0]} />
                      <Bar dataKey="ejercido"  name="Ejercido"  fill="#0098D4"   radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )
              }
            </div>
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Reparadores activos</h3>
              {reparadores.length === 0
                ? <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '32px 0' }}>Sin reparadores registrados</p>
                : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                        {['Nombre','Asignados','Resueltos','Estado'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 500 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reparadores.map(r => (
                        <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}>
                          <td style={{ padding: '8px' , fontWeight: 500 }}>{r.name}</td>
                          <td style={{ padding: '8px', textAlign: 'center', color: 'var(--text-secondary)' }}>{r.asignados}</td>
                          <td style={{ padding: '8px', textAlign: 'center', color: 'var(--text-secondary)' }}>{r.resueltos}</td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: r.status === 'activo' ? 'var(--success)' : 'var(--text-muted)' }} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              }
            </div>
          </div>

          {/* Últimos reportes */}
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Últimos reportes</h3>
            {recientes.length === 0
              ? <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '32px 0' }}>No hay reportes aún</p>
              : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                      {['Folio','Vía','Colonia','Prioridad','Estado','Score','Fecha','Acciones'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recientes.map(r => (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>{r.folio}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 500 }}>{r.nombre_via}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{r.colonia}</td>
                        <td style={{ padding: '10px 12px' }}><Badge label={PRIO_LABEL[r.prioridad]} color={PRIORIDAD_COLOR[r.prioridad]} bgColor={PRIO_BG[r.prioridad]} /></td>
                        <td style={{ padding: '10px 12px' }}><Badge label={ESTADO_LABEL[r.estado]} color={ESTADO_COLOR[r.estado]} bgColor={`${ESTADO_COLOR[r.estado]}22`} /></td>
                        <td style={{ padding: '10px 12px', fontWeight: 700 }}>{r.score_prioridad}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '12px' }}>{formatFecha(r.fecha_reporte)}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <button onClick={() => navigate('/reportes')} style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--primary)', color: 'var(--primary)', background: 'transparent', cursor: 'pointer' }}>Ver</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            }
          </div>

        </div>
      </div>
    </div>
  )
}
