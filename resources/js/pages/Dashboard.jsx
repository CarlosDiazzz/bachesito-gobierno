import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, AlertTriangle, Clock, CheckCircle, Shield, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import Footer from '../components/Footer'
import StatCard from '../components/StatCard'
import MapaReportes from '../components/MapaReportes'
import Badge from '../components/Badge'
import { useUI } from '../context/UIContext'
import { api } from '../lib/api'
import { PRIORIDAD_COLOR, ESTADO_COLOR, ESTADO_LABEL } from '../data/mockData'

const PRIO_LABEL = { critica: 'Crítica', alta: 'Alta', media: 'Media', baja: 'Baja' }
const PRIO_BG    = { critica: 'var(--primary-light)', alta: 'var(--accent-light)', media: '#FEFAE8', baja: '#EDF7E8' }

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
      <div className="main-layout">
        <Sidebar />
        <div className="content-wrapper" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid var(--border)', borderTop: '4px solid var(--primary)', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  return (
    <div className="main-layout">
      <Sidebar />
      <div className="content-wrapper">
        <TopBar title="PANEL DE CONTROL INSTITUCIONAL" />
        
        <div className="container-fluid">

          {/* Stat cards - High Density */}
          <div className="grid-4">
            <StatCard icon={MapPin}        label="TOTAL REPORTES"    value={stats.total}         color="var(--primary)" />
            <StatCard icon={Shield}        label="BACHES CRÍTICOS"   value={stats.criticos}      color="var(--primary)"   trend={{ value: 12, positive: false }} />
            <StatCard icon={TrendingUp}    label="EN PROCESO"        value={stats.en_proceso}    color="var(--accent)" />
            <StatCard icon={CheckCircle}   label="RESUELTOS / MES"   value={stats.resueltos_mes} color="var(--success)" />
          </div>

          {/* Mapa + críticos */}
          <div className="grid-map-sidebar">
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', padding: '16px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 900, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--primary)' }}>Mapa de Incidencias</h3>
              <div style={{ height: '360px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <MapaReportes reportes={mapaData} />
              </div>
            </div>
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 900, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--primary)' }}>Atención Prioritaria</h3>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {criticos.length === 0
                  ? <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '32px 0' }}>Sin baches críticos activos</p>
                  : criticos.map(r => (
                    <div key={r.id} onClick={() => navigate(`/reportes/${r.id}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderBottom: '1px solid var(--bg)', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ width: '4px', height: '32px', borderRadius: '2px', background: PRIORIDAD_COLOR[r.prioridad] }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px' }}>{r.folio}</div>
                        <div style={{ fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>{r.nombre_via}</div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 900, color: PRIORIDAD_COLOR[r.prioridad], background: PRIO_BG[r.prioridad], padding: '2px 8px', borderRadius: '4px' }}>{r.score_prioridad}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>

          {/* Presupuesto + reparadores */}
          <div className="grid-2">
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', padding: '16px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 900, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--primary)' }}>Ejecución Presupuestal</h3>
              {presupuestos.length === 0
                ? <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '32px 0' }}>Sin datos de presupuesto</p>
                : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={presupuestos} barCategoryGap="25%">
                      <XAxis dataKey="mes" tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)', fontSize: '12px' }}
                        formatter={v => [`$${v.toLocaleString('es-MX')}`, '']}
                      />
                      <Bar dataKey="asignado" name="Asignado" fill="#bc955c22" radius={[4,4,0,0]} />
                      <Bar dataKey="ejercido"  name="Ejercido" radius={[4,4,0,0]}>
                        {presupuestos.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.ejercido > entry.asignado ? '#691332' : '#9D2449'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )
              }
            </div>
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', padding: '16px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 900, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--primary)' }}>Fuerza Operativa</h3>
              {reparadores.length === 0
                ? <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '32px 0' }}>Sin reparadores registrados</p>
                : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '2px solid var(--bg)' }}>
                        <th style={{ textAlign: 'left', padding: '8px', fontWeight: 900 }}>Nombre</th>
                        <th style={{ textAlign: 'center', padding: '8px', fontWeight: 900 }}>Asignados</th>
                        <th style={{ textAlign: 'center', padding: '8px', fontWeight: 900 }}>Resueltos</th>
                        <th style={{ textAlign: 'right', padding: '8px', fontWeight: 900 }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reparadores.map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px solid var(--bg)' }}>
                          <td style={{ padding: '10px 8px', fontWeight: 700, color: 'var(--text-primary)' }}>{r.name}</td>
                          <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 600 }}>{r.asignados}</td>
                          <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 600 }}>{r.resueltos}</td>
                          <td style={{ padding: '10px 8px', textAlign: 'right' }}>
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
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', padding: '16px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 900, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--primary)' }}>Registro Reciente de Incidencias</h3>
            {recientes.length === 0
              ? <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '32px 0' }}>No hay reportes aún</p>
              : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '2px solid var(--bg)' }}>
                        {['Folio','Vía','Colonia','Prioridad','Estado','Score','Fecha','Acciones'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '10px', fontWeight: 900 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recientes.map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px solid var(--bg)', transition: 'background 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '12px 10px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-muted)' }}>{r.folio}</td>
                          <td style={{ padding: '12px 10px', fontWeight: 700, color: 'var(--text-primary)' }}>{r.nombre_via}</td>
                          <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>{r.colonia}</td>
                          <td style={{ padding: '12px 10px' }}><Badge label={PRIO_LABEL[r.prioridad]} color={PRIORIDAD_COLOR[r.prioridad]} bgColor={PRIO_BG[r.prioridad]} /></td>
                          <td style={{ padding: '12px 10px' }}><Badge label={ESTADO_LABEL[r.estado]} color={ESTADO_COLOR[r.estado]} bgColor={`${ESTADO_COLOR[r.estado]}22`} /></td>
                          <td style={{ padding: '12px 10px', fontWeight: 900, color: 'var(--primary)' }}>{r.score_prioridad}</td>
                          <td style={{ padding: '12px 10px', color: 'var(--text-muted)', fontWeight: 600 }}>{formatFecha(r.fecha_reporte)}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <button onClick={() => navigate(`/reportes/${r.id}`)} 
                              style={{ fontSize: '10px', fontWeight: 900, padding: '4px 12px', borderRadius: '4px', border: '1px solid var(--primary)', color: 'var(--primary)', background: 'transparent', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' }}>
                              Detalles
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
          </div>

        </div>
        
        <Footer />
      </div>
    </div>
  )
}
