import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, MapPin, CheckCircle, XCircle, Clock, AlertTriangle, Shield, Upload, Trash2, ZoomIn, X, Loader } from 'lucide-react'
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

const TIPO_LABEL = { ciudadano: 'Ciudadano', verificacion: 'Verificación', resolucion: 'Resolución' }
const TIPO_COLOR = { ciudadano: 'var(--primary)', verificacion: 'var(--warning)', resolucion: 'var(--success)' }

function Lightbox({ fotos, indice, onClose }) {
  const [idx, setIdx] = useState(indice)
  const foto = fotos[idx]
  if (!foto) return null
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 24, background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '28px' }}>
        <X size={28} />
      </button>
      {fotos.length > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + fotos.length) % fotos.length) }}
            style={{ position: 'absolute', left: 20, background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '50%', width: 44, height: 44, fontSize: '20px' }}>‹</button>
          <button onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % fotos.length) }}
            style={{ position: 'absolute', right: 20, background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '50%', width: 44, height: 44, fontSize: '20px' }}>›</button>
        </>
      )}
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '85vh', textAlign: 'center' }}>
        <img src={foto.url} alt="" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '8px', objectFit: 'contain' }} />
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginTop: '10px' }}>
          {TIPO_LABEL[foto.tipo]} · {idx + 1} / {fotos.length}
        </div>
      </div>
    </div>
  )
}

function FotoGaleria({ fotos, reporteId, onFotosChange, onAiChange }) {
  const fileRef   = useRef()
  const [preview,   setPreview]   = useState(null)
  const [file,      setFile]      = useState(null)
  const [tipo,      setTipo]      = useState('verificacion')
  const [reAnalizar,setReAnalizar] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleting,  setDeleting]  = useState(null)
  const [lightbox,  setLightbox]  = useState(null)
  const [uploadErr, setUploadErr] = useState(null)

  const seleccionarArchivo = useCallback((f) => {
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setUploadErr(null)
  }, [])

  const cancelarPreview = () => {
    setFile(null)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const subirFoto = async () => {
    if (!file) return
    setUploading(true)
    setUploadErr(null)
    const fd = new FormData()
    fd.append('foto', file)
    fd.append('tipo', tipo)
    fd.append('re_analizar', reAnalizar ? '1' : '0')
    try {
      const data = await api.upload(`/api/reportes/${reporteId}/fotos`, fd)
      onFotosChange(prev => [...prev, data.foto])
      if (data.ai_actualizado) onAiChange(data.ai_actualizado, data.score_prioridad, data.prioridad)
      cancelarPreview()
    } catch (e) {
      setUploadErr(e.message)
    } finally {
      setUploading(false)
    }
  }

  const eliminarFoto = async (foto) => {
    if (!confirm(`¿Eliminar esta foto (${TIPO_LABEL[foto.tipo]})?`)) return
    setDeleting(foto.id)
    try {
      await api.delete(`/api/reportes/${reporteId}/fotos/${foto.id}`)
      onFotosChange(prev => prev.filter(f => f.id !== foto.id))
    } catch (e) {
      alert(e.message)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
      <style>{`
        .foto-thumb:hover .foto-overlay { opacity: 1 !important; }
        .upload-drop:hover { border-color: var(--primary) !important; background: var(--primary-light) !important; }
      `}</style>

      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Fotos del reporte</h3>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{fotos.length} foto{fotos.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Galería grid */}
      {fotos.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth <= 480 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '2px', padding: '2px' }}>
          {fotos.map((f, i) => (
            <div key={f.id} className="foto-thumb" style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', cursor: 'pointer' }}
              onClick={() => setLightbox(i)}>
              <img src={f.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              {/* Overlay */}
              <div className="foto-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <ZoomIn size={22} style={{ color: 'white' }} />
              </div>
              {/* Tipo badge */}
              <div style={{ position: 'absolute', bottom: 4, left: 4, fontSize: '9px', fontWeight: 700, color: 'white', background: TIPO_COLOR[f.tipo], padding: '2px 6px', borderRadius: '3px', textTransform: 'uppercase' }}>
                {TIPO_LABEL[f.tipo]}
              </div>
              {/* Principal badge */}
              {f.es_principal && (
                <div style={{ position: 'absolute', top: 4, left: 4, fontSize: '9px', fontWeight: 700, color: 'white', background: 'var(--primary)', padding: '2px 6px', borderRadius: '3px' }}>
                  Principal
                </div>
              )}
              {/* Delete btn */}
              <button
                onClick={e => { e.stopPropagation(); eliminarFoto(f) }}
                disabled={deleting === f.id}
                style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(244,76,99,0.85)', border: 'none', borderRadius: '4px', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: deleting === f.id ? 0.5 : 1 }}>
                {deleting === f.id
                  ? <Loader size={12} style={{ color: 'white', animation: 'spin 0.8s linear infinite' }} />
                  : <Trash2 size={12} style={{ color: 'white' }} />
                }
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Sin fotos</div>
      )}

      {/* Upload section */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
        {preview ? (
          /* Preview + controls */
          <div>
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <img src={preview} alt="preview" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: 'var(--radius-md)', display: 'block' }} />
              <button onClick={cancelarPreview} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 26, height: 26, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={14} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <select value={tipo} onChange={e => setTipo(e.target.value)}
                style={{ flex: 1, padding: '8px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '13px', background: 'var(--bg)', cursor: 'pointer' }}>
                <option value="verificacion">Verificación</option>
                <option value="resolucion">Resolución</option>
                <option value="ciudadano">Ciudadano</option>
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <input type="checkbox" checked={reAnalizar} onChange={e => setReAnalizar(e.target.checked)} />
                Re-analizar con IA
              </label>
            </div>
            {uploadErr && (
              <div style={{ padding: '8px 12px', background: 'var(--danger-light)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontSize: '12px', marginBottom: '10px' }}>
                {uploadErr}
              </div>
            )}
            <button onClick={subirFoto} disabled={uploading}
              style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', background: uploading ? 'var(--text-muted)' : 'var(--primary)', color: 'white', border: 'none', fontWeight: 600, fontSize: '14px', cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {uploading && <Loader size={16} style={{ animation: 'spin 0.8s linear infinite' }} />}
              {uploading ? 'Subiendo...' : '↑ Subir foto'}
            </button>
          </div>
        ) : (
          /* Drop zone */
          <div className="upload-drop"
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); seleccionarArchivo(e.dataTransfer.files[0]) }}
            style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', padding: '24px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
            <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: '6px' }} />
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Añadir foto</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>JPG, PNG, WEBP · máx 10 MB</div>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/jpg,image/webp" style={{ display: 'none' }}
          onChange={e => seleccionarArchivo(e.target.files[0])} />
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <Lightbox fotos={fotos} indice={lightbox} onClose={() => setLightbox(null)} />
      )}
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
  const [fotos,    setFotos]    = useState([])

  useEffect(() => {
    api.get(`/api/reportes/${id}`)
      .then(data => { setReporte(data); setFotos(data.fotos ?? []) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleAiChange = (aiActualizado, scoreNuevo, prioridadNueva) => {
    setReporte(prev => ({
      ...prev,
      ai:              aiActualizado,
      score_prioridad: scoreNuevo,
      prioridad:       prioridadNueva,
    }))
  }

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
        <div style={{ marginLeft: '260px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
        <div style={{ marginLeft: '260px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
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
    <div className="main-layout">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Sidebar />
      <div className="content-wrapper">
        <TopBar title="Detalle de Reporte" />
        <div className="container-fluid">

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={() => navigate('/reportes')} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: 0 }}>
                <ChevronLeft size={18} /> <span className="hidden-mobile">Reportes</span>
              </button>
              <div style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '4px 10px', borderRadius: '4px' }}>{reporte.folio}</div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Badge label={ESTADO_LABEL[reporte.estado]} color={ESTADO_COLOR[reporte.estado]} bgColor={`${ESTADO_COLOR[reporte.estado]}22`} />
              <Badge label={PRIO_LABEL[reporte.prioridad]} color={prioColor} bgColor={prio_bg} />
            </div>
            <div style={{ marginLeft: window.innerWidth <= 768 ? '0' : 'auto', display: 'flex', gap: '8px', width: window.innerWidth <= 768 ? '100%' : 'auto', overflowX: 'auto', paddingBottom: window.innerWidth <= 768 ? '8px' : '0' }}>
              {botonesAccion.map(b => (
                <button key={b.estado} disabled={updating} onClick={() => cambiarEstado(b.estado)}
                  style={{ flex: window.innerWidth <= 768 ? 1 : 'none', padding: '10px 16px', borderRadius: '6px', border: b.outline ? `1px solid ${b.color}` : 'none', background: b.outline ? 'transparent' : b.color, color: b.outline ? b.color : 'white', fontWeight: 700, fontSize: '13px', cursor: updating ? 'not-allowed' : 'pointer', opacity: updating ? 0.6 : 1, whiteSpace: 'nowrap' }}>
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '20px', overflowX: 'auto' }}>
            <div style={{ minWidth: '600px' }}>
              <EstadoTimeline estadoActual={reporte.estado} />
            </div>
          </div>

          {/* Main grid */}
          <div className="grid-2">

            {/* LEFT col */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Galería de fotos + upload */}
              <FotoGaleria
                fotos={fotos}
                reporteId={reporte.id}
                onFotosChange={setFotos}
                onAiChange={handleAiChange}
              />

              {/* AI Analysis */}
              <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 900, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  <Shield size={18} style={{ color: 'var(--accent)' }} /> Análisis IA
                  {ai && <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', marginLeft: 'auto', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: '4px' }}>{ai.modelo_usado?.toUpperCase()}</span>}
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
