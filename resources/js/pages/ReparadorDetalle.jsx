import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, CheckCircle, Clock, AlertTriangle, TrendingUp, Wrench, Mail, Building2, Award } from 'lucide-react'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import Badge from '../components/Badge'
import { api } from '../lib/api'
import { PRIORIDAD_COLOR, ESTADO_COLOR, ESTADO_LABEL } from '../data/mockData'

const PRIO_LABEL = { critica: 'Crítica', alta: 'Alta', media: 'Media', baja: 'Baja' }
const PRIO_BG    = { critica: '#FEE8EB', alta: '#FEF3E8', media: '#FEFAE8', baja: '#EDF7E8' }
const ROL_COLOR  = { supervisor: 'var(--purple)', reparador: 'var(--primary)', autoridad: 'var(--guinda)' }

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || '?'
}

function StatMini({ label, value, color = 'var(--text-primary)', sub }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '16px 20px', flex: 1 }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 800, color, lineHeight: 1 }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{sub}</div>}
    </div>
  )
}

function diasColor(dias) {
  if (dias == null) return 'var(--text-muted)'
  if (dias <= 2)  return 'var(--success)'
  if (dias <= 5)  return 'var(--warning)'
  return 'var(--danger)'
}

export default function ReparadorDetalle() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [rep,     setRep]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [tab,     setTab]     = useState('activas') // 'activas' | 'historial'

  useEffect(() => {
    api.get(`/api/reparadores/${id}`)
      .then(setRep)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
        <Sidebar />
        <div style={{ marginLeft: '260px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid var(--border)', borderTop: '4px solid var(--primary)', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  if (error || !rep) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
        <Sidebar />
        <div style={{ marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <AlertTriangle size={48} style={{ color: 'var(--danger)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>{error ?? 'Reparador no encontrado'}</p>
          <button onClick={() => navigate('/reparadores')} style={{ padding: '8px 20px', borderRadius: '6px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer' }}>Volver</button>
        </div>
      </div>
    )
  }

  const tasaResolucion = rep.total > 0 ? Math.round((rep.resueltos / rep.total) * 100) : 0
  const rolColor = ROL_COLOR[rep.rol] ?? 'var(--primary)'

  return (
    <div className="main-layout">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Sidebar />
      <div className="content-wrapper">
        <TopBar title="Perfil de Reparador" />
        <div className="container-fluid">

          {/* Back */}
          <button onClick={() => navigate('/reparadores')} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: 0, alignSelf: 'flex-start' }}>
            <ChevronLeft size={18} /> Reparadores
          </button>

          {/* Profile header card */}
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '24px', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: rolColor, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: 800, flexShrink: 0, boxShadow: `0 0 0 4px ${rolColor}33`, margin: window.innerWidth <= 480 ? '0 auto' : '0' }}>
              {getInitials(rep.name)}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: '200px', textAlign: window.innerWidth <= 480 ? 'center' : 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: window.innerWidth <= 480 ? 'center' : 'flex-start', marginBottom: '6px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 700 }}>{rep.name}</h2>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <Badge
                    label={rep.rol?.charAt(0).toUpperCase() + rep.rol?.slice(1)}
                    color={rolColor} bgColor={`${rolColor}22`}
                  />
                  <Badge
                    label={rep.status === 'activo' ? 'Activo' : 'Inactivo'}
                    color={rep.status === 'activo' ? 'var(--success)' : 'var(--text-muted)'}
                    bgColor={rep.status === 'activo' ? 'var(--success-light)' : 'var(--surface-2)'}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', justifyContent: window.innerWidth <= 480 ? 'center' : 'flex-start' }}>
                  <Mail size={14} /> {rep.email}
                </div>
                {rep.dependencia && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', justifyContent: window.innerWidth <= 480 ? 'center' : 'flex-start' }}>
                    <Building2 size={14} /> {rep.dependencia}
                  </div>
                )}
              </div>
            </div>

            {/* Tasa de resolución visual */}
            <div style={{ minWidth: '180px', textAlign: 'center', margin: window.innerWidth <= 768 ? '0 auto' : '0' }}>
              <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto 8px' }}>
                <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--surface-2)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke={rep.status === 'activo' ? 'var(--success)' : 'var(--text-muted)'} strokeWidth="3"
                    strokeDasharray={`${tasaResolucion} ${100 - tasaResolucion}`} strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--success)' }}>{tasaResolucion}%</span>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tasa de resolución</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{rep.total} asignaciones totales</div>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid-4">
            <StatMini label="Activos ahora"     value={rep.asignados}      color="var(--primary)"  sub={rep.asignados === 1 ? '1 pendiente' : `${rep.asignados} pendientes`} />
            <StatMini label="En proceso"        value={rep.en_proceso}     color="var(--warning)"  sub="trabajando" />
            <StatMini label="Resueltos"         value={rep.resueltos}      color="var(--success)"  sub="completados" />
            <StatMini label="Tiempo promedio"   value={rep.tiempo_promedio ? `${rep.tiempo_promedio}d` : '—'} color="var(--purple)" sub="días por bache" />
          </div>

          {/* Two columns */}
          <div className="grid-2" style={{ alignItems: 'start' }}>

            {/* Actividad mensual */}
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={16} style={{ color: 'var(--primary)' }} /> Actividad mensual
              </h3>
              {rep.actividad_meses?.every(m => m.completados === 0 && m.recibidos === 0)
                ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '32px 0' }}>Sin actividad registrada</p>
                : (
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={rep.actividad_meses} barCategoryGap="30%">
                        <XAxis dataKey="mes" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(v, n) => [v, n === 'completados' ? 'Completados' : 'Recibidos']} />
                        <Bar dataKey="recibidos"   name="recibidos"   fill="#bc955c44" radius={[3,3,0,0]} />
                        <Bar dataKey="completados" name="completados" fill="#691332"   radius={[3,3,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )
              }
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)', justifyContent: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 10, height: 10, background: '#bc955c44', borderRadius: '2px', display: 'inline-block' }} />Recibidos</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 10, height: 10, background: '#691332', borderRadius: '2px', display: 'inline-block' }} />Resueltos</span>
              </div>
            </div>

            {/* Rendimiento resumen */}
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={16} style={{ color: 'var(--warning)' }} /> Rendimiento
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Tasa de resolución', value: tasaResolucion, max: 100, unit: '%', color: 'var(--success)' },
                  { label: 'Score promedio atendido', value: rep.score_promedio, max: 100, unit: '/100', color: 'var(--warning)' },
                  { label: 'Asignaciones completadas', value: rep.resueltos, max: Math.max(rep.total, 1), unit: `/${rep.total}`, color: 'var(--primary)' },
                ].map(({ label, value, max, unit, color }) => (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <span>{label}</span>
                      <strong style={{ color }}>{value ?? 0}{unit}</strong>
                    </div>
                    <div style={{ height: '8px', background: 'var(--surface-2)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(((value ?? 0) / max) * 100, 100)}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.5s' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs: activas / historial */}
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
            {/* Tab header */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
              {[
                { key: 'activas',   label: `Asignaciones (${rep.activas?.length ?? 0})`,   icon: Wrench },
                { key: 'historial', label: `Historial (${rep.historial?.length ?? 0})`, icon: CheckCircle },
              ].map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setTab(key)}
                  style={{ flex: 1, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', fontWeight: tab === key ? 700 : 500, color: tab === key ? 'var(--primary)' : 'var(--text-muted)', borderBottom: tab === key ? '3px solid var(--primary)' : '3px solid transparent', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '-1px', whiteSpace: 'nowrap' }}>
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ overflowX: 'auto' }}>
              {tab === 'activas' && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '800px' }}>
                  <thead style={{ background: 'var(--surface-2)' }}>
                    <tr style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                      {['Folio','Vía','Colonia','Prioridad','Estado','Score','Días','Acciones'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {!rep.activas?.length
                      ? <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Sin asignaciones activas</td></tr>
                      : rep.activas.map(a => (
                        <tr key={a.id}
                          style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>{a.folio}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 500 }}>{a.nombre_via}</td>
                          <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{a.colonia ?? '—'}</td>
                          <td style={{ padding: '10px 14px' }}>
                            {a.prioridad && <Badge label={PRIO_LABEL[a.prioridad]} color={PRIORIDAD_COLOR[a.prioridad]} bgColor={PRIO_BG[a.prioridad]} />}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            {a.estado_reporte && <Badge label={ESTADO_LABEL[a.estado_reporte] ?? a.estado_reporte} color={ESTADO_COLOR[a.estado_reporte]} bgColor={`${ESTADO_COLOR[a.estado_reporte]}22`} />}
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 700 }}>{a.score ?? '—'}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ fontWeight: 600, color: diasColor(a.dias_activo) }}>
                              {a.dias_activo != null ? `${a.dias_activo}d` : '—'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <button onClick={() => navigate(`/reportes/${a.reporte_id}`)}
                              style={{ fontSize: '11px', fontWeight: 700, padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--primary)', color: 'var(--primary)', background: 'transparent', cursor: 'pointer' }}>
                              Ver reporte
                            </button>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              )}

              {tab === 'historial' && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '800px' }}>
                  <thead style={{ background: 'var(--surface-2)' }}>
                    <tr style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                      {['Folio','Vía','Prioridad','Score','F.Asig','F.Res','Días','Acciones'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {!rep.historial?.length
                      ? <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Sin historial de resoluciones</td></tr>
                      : rep.historial.map(h => (
                        <tr key={h.id}
                          style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>{h.folio}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 500 }}>{h.nombre_via}</td>
                          <td style={{ padding: '10px 14px' }}>
                            {h.prioridad && <Badge label={PRIO_LABEL[h.prioridad]} color={PRIORIDAD_COLOR[h.prioridad]} bgColor={PRIO_BG[h.prioridad]} />}
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 700 }}>{h.score ?? '—'}</td>
                          <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '11px' }}>
                            {h.fecha_asignacion ? new Date(h.fecha_asignacion).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' }) : '—'}
                          </td>
                          <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '11px' }}>
                            {h.fecha_completada ? new Date(h.fecha_completada).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' }) : '—'}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ fontWeight: 600, color: diasColor(h.dias_resolucion) }}>
                              {h.dias_resolucion != null ? `${h.dias_resolucion}d` : '—'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <button onClick={() => navigate(`/reportes/${h.reporte_id}`)}
                              style={{ fontSize: '11px', fontWeight: 700, padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--primary)', color: 'var(--primary)', background: 'transparent', cursor: 'pointer' }}>
                              Ver reporte
                            </button>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

        </div>
      </div>
    </div>
  )
}
