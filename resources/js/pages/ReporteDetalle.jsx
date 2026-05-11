import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, MapPin, CheckCircle, XCircle, Clock, User, AlertTriangle } from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import Badge from '../components/Badge'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { PRIORIDAD_COLOR, ESTADO_COLOR, ESTADO_LABEL } from '../data/mockData'

const PRIO_LABEL = { critica: 'Crítica', alta: 'Alta', media: 'Media', baja: 'Baja' }
const PRIO_BG    = { critica: '#FEE8EB', alta: '#FEF3E8', media: '#FEFAE8', baja: '#EDF7E8' }
const SEV_COLOR  = { alta: 'var(--danger)', media: 'var(--warning)', baja: 'var(--success)' }
const SEV_BG     = { alta: '#FEE8EB',       media: '#FEF3E8',        baja: '#EDF7E8' }

const ESTADOS_FLUJO = [
  { key: 'pendiente',  label: 'Pendiente',  color: 'var(--estado-pendiente)' },
  { key: 'validado',   label: 'Validado',   color: 'var(--estado-validado)' },
  { key: 'asignado',   label: 'Asignado',   color: 'var(--estado-asignado)' },
  { key: 'en_proceso', label: 'En proceso', color: 'var(--estado-en-proceso)' },
  { key: 'resuelto',   label: 'Resuelto',   color: 'var(--estado-resuelto)' },
]

const ORDEN_ESTADOS = { pendiente: 0, validado: 1, asignado: 2, en_proceso: 3, resuelto: 4, rechazado: -1, cerrado: 5 }

function EstadoTimeline({ estadoActual }) {
  const idx = ORDEN_ESTADOS[estadoActual] ?? -1
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {ESTADOS_FLUJO.map((e, i) => {
        const done    = i < idx
        const current = i === idx
        return (
          <div key={e.key} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: current ? e.color : done ? 'var(--success)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: current ? `3px solid ${e.color}` : 'none', boxSizing: 'border-box' }}>
                {done && <CheckCircle size={14} style={{ color: 'white' }} />}
                {current && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'white' }} />}
              </div>
              <span style={{ fontSize: '10px', color: current ? e.color : 'var(--text-muted)', fontWeight: current ? 600 : 400, whiteSpace: 'nowrap' }}>{e.label}</span>
            </div>
            {i < ESTADOS_FLUJO.length - 1 && (
              <div style={{ flex: 1, height: '2px', background: i < idx ? 'var(--success)' : 'var(--border)', marginBottom: '20px' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function ReporteDetalle() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const { user }  = useAuth()

  const [reporte,  setReporte]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    api.get(`/api/reportes/${id}`)
      .then(setReporte)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const cambiarEstado = async (nuevoEstado) => {
    setUpdating(true)
    try {
      const updated = await api.patch(`/api/reportes/${id}/estado`, { estado: nuevoEstado })
      setReporte(prev => ({ ...prev, ...updated }))
    } catch (e) {
      setError(e.message)
    } finally {
      setUpdating(false)
    }
  }

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

  if (error || !reporte) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
        <Sidebar />
        <div style={{ marginLeft: '240px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
          <AlertTriangle size={48} style={{ color: 'var(--danger)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>{error ?? 'Reporte no encontrado'}</p>
          <button onClick={() => navigate('/reportes')} style={{ padding: '8px 20px', borderRadius: '6px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer' }}>Volver</button>
        </div>
      </div>
    )
  }

  const ai       = reporte.ai
  const prioColor = PRIORIDAD_COLOR[reporte.prioridad]
  const prio_bg  = PRIO_BG[reporte.prioridad]

  const botonesAccion = [
    reporte.estado === 'pendiente'  && { label: 'Validar',     estado: 'validado',   color: 'var(--estado-validado)' },
    reporte.estado === 'validado'   && { label: 'Asignar',     estado: 'asignado',   color: 'var(--estado-asignado)' },
    reporte.estado === 'asignado'   && { label: 'Iniciar',     estado: 'en_proceso', color: 'var(--estado-en-proceso)' },
    reporte.estado === 'en_proceso' && { label: 'Marcar resuelto', estado: 'resuelto', color: 'var(--estado-resuelto)' },
    !['rechazado','cerrado','resuelto'].includes(reporte.estado) && { label: 'Rechazar', estado: 'rechazado', color: 'var(--danger)', outline: true },
  ].filter(Boolean)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Sidebar />
      <div style={{ marginLeft: '240px', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Detalle de Reporte" />
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => navigate('/reportes')} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: 0 }}>
              <ChevronLeft size={18} /> Reportes
            </button>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '4px 10px', borderRadius: '4px' }}>{reporte.folio}</div>
            <Badge label={ESTADO_LABEL[reporte.estado]} color={ESTADO_COLOR[reporte.estado]} bgColor={`${ESTADO_COLOR[reporte.estado]}22`} />
            <Badge label={PRIO_LABEL[reporte.prioridad]} color={prioColor} bgColor={prio_bg} />
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              {botonesAccion.map(b => (
                <button key={b.estado} disabled={updating} onClick={() => cambiarEstado(b.estado)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: b.outline ? `1px solid ${b.color}` : 'none', background: b.outline ? 'transparent' : b.color, color: b.outline ? b.color : 'white', fontWeight: 500, fontSize: '13px', cursor: updating ? 'not-allowed' : 'pointer', opacity: updating ? 0.6 : 1 }}>
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '20px' }}>
            <EstadoTimeline estadoActual={reporte.estado} />
          </div>

          {/* Main grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

            {/* LEFT col */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Foto principal */}
              <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <img src={reporte.foto} alt="Foto del bache" style={{ width: '100%', height: '260px', objectFit: 'cover' }} />
              </div>

              {/* AI Analysis */}
              <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🤖 Análisis IA
                  {ai && <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>{ai.modelo_usado}</span>}
                </h3>
                {!ai
                  ? <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Sin análisis disponible</p>
                  : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                        {ai.es_bache
                          ? <CheckCircle size={22} style={{ color: 'var(--success)' }} />
                          : <XCircle    size={22} style={{ color: 'var(--danger)' }} />
                        }
                        <span style={{ fontWeight: 600, fontSize: '15px', color: ai.es_bache ? 'var(--success)' : 'var(--danger)' }}>
                          {ai.es_bache ? 'Bache confirmado' : 'No es un bache'}
                        </span>
                        {ai.severidad_ia && (
                          <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 600, color: 'white', background: SEV_COLOR[ai.severidad_ia], padding: '2px 10px', borderRadius: '999px', textTransform: 'capitalize' }}>
                            Severidad {ai.severidad_ia}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                        {[
                          { label: 'Confianza',     value: `${ai.confianza}%` },
                          { label: 'Profundidad',   value: ai.profundidad_estimada_cm ? `${ai.profundidad_estimada_cm} cm` : '—' },
                          { label: 'Área',          value: ai.area_estimada_m2 ? `${ai.area_estimada_m2} m²` : '—' },
                        ].map(({ label, value }) => (
                          <div key={label} style={{ background: 'var(--surface-2)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</div>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
                          </div>
                        ))}
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{ai.razon}</p>
                    </>
                  )
                }
              </div>

              {/* Score */}
              <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '14px' }}>Score de prioridad</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${prioColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '22px', fontWeight: 800, color: prioColor }}>{reporte.score_prioridad}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: '10px', background: 'var(--surface-2)', borderRadius: '5px', overflow: 'hidden', marginBottom: '6px' }}>
                      <div style={{ width: `${reporte.score_prioridad}%`, height: '100%', background: prioColor, borderRadius: '5px', transition: 'width 0.6s' }} />
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Prioridad <strong style={{ color: prioColor }}>{PRIO_LABEL[reporte.prioridad]}</strong> · {reporte.score_prioridad}/100
                    </div>
                  </div>
                </div>
                {reporte.score_detalle && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {[
                      ['Severidad', reporte.score_detalle.score_severidad],
                      ['Tipo vía',  reporte.score_detalle.score_tipo_via],
                      ['PCI',       reporte.score_detalle.score_pci],
                      ['Zona',      reporte.score_detalle.score_reportes_zona],
                    ].map(([l, v]) => (
                      <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', background: 'var(--surface-2)', borderRadius: '4px' }}>
                        <span>{l}</span><strong>{v?.toFixed(1)}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT col */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Info */}
              <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '14px' }}>Información</h3>
                {[
                  { label: 'Vía',         value: reporte.nombre_via },
                  { label: 'Colonia',     value: reporte.colonia },
                  { label: 'Municipio',   value: reporte.municipio },
                  { label: 'Tipo vía',    value: reporte.tipo_via?.replace('_', ' ') },
                  { label: 'Descripción', value: reporte.descripcion },
                  { label: 'Ciudadano',   value: reporte.ciudadano },
                  { label: 'Fecha',       value: reporte.fecha_reporte ? new Date(reporte.fecha_reporte).toLocaleString('es-MX') : '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', gap: '12px', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ width: '90px', flexShrink: 0, fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{value ?? '—'}</span>
                  </div>
                ))}
              </div>

              {/* Mapa */}
              <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} style={{ color: 'var(--primary)' }} /> Ubicación
                </h3>
                <div style={{ height: '200px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <MapContainer center={[reporte.latitud, reporte.longitud]} zoom={16} style={{ width: '100%', height: '100%' }} zoomControl={false}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <CircleMarker center={[reporte.latitud, reporte.longitud]} radius={12} fillColor={prioColor} color="white" weight={3} fillOpacity={0.9} />
                  </MapContainer>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>{reporte.latitud}, {reporte.longitud}</p>
              </div>

              {/* Historial */}
              <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} style={{ color: 'var(--text-muted)' }} /> Historial
                </h3>
                {!reporte.historial?.length
                  ? <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Sin cambios registrados</p>
                  : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {reporte.historial.map((h, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: ESTADO_COLOR[h.estado_nuevo] ?? 'var(--text-muted)', marginTop: '5px', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: '13px' }}>
                              <Badge label={ESTADO_LABEL[h.estado_anterior] ?? '—'} color="var(--text-muted)" bgColor="var(--surface-2)" />
                              {' → '}
                              <Badge label={ESTADO_LABEL[h.estado_nuevo]} color={ESTADO_COLOR[h.estado_nuevo]} bgColor={`${ESTADO_COLOR[h.estado_nuevo]}22`} />
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {h.user ?? 'Sistema'} · {h.fecha ? new Date(h.fecha).toLocaleString('es-MX') : ''}
                            </div>
                            {h.motivo && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontStyle: 'italic' }}>{h.motivo}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
