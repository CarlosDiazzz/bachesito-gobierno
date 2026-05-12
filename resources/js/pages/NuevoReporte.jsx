import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Upload, MapPin, CheckCircle, XCircle, AlertTriangle, Loader, ChevronLeft, Shield } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const SEVERIDAD_COLOR = { alta: 'var(--danger)', media: 'var(--warning)', baja: 'var(--success)' }
const SEVERIDAD_BG    = { alta: '#FEE8EB',        media: '#FEF3E8',        baja: '#EDF7E8' }

function LocationPicker({ value, onChange }) {
  useMapEvents({
    click(e) { onChange([e.latlng.lat, e.latlng.lng]) },
  })
  return value ? <Marker position={value} /> : null
}

function AiResultCard({ resultado, loading }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '14px' }}>
        <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
        Analizando imagen con IA…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }
  if (!resultado) return null

  if (!resultado.es_bache) {
    return (
      <div style={{ padding: '16px', background: '#FEE8EB', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <XCircle size={22} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontWeight: 600, color: 'var(--danger)', marginBottom: '4px' }}>No se detectó un bache</div>
          <div style={{ fontSize: '13px', color: '#9D2449' }}>{resultado.razon}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Confianza: {resultado.confianza}% · Modelo: {resultado.modelo_usado}</div>
        </div>
      </div>
    )
  }

  const sColor = SEVERIDAD_COLOR[resultado.severidad_ia] ?? 'var(--primary)'
  const sBg    = SEVERIDAD_BG[resultado.severidad_ia]    ?? 'var(--primary-light)'

  return (
    <div style={{ padding: '16px', background: sBg, borderRadius: 'var(--radius-md)', border: `1px solid ${sColor}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <CheckCircle size={20} style={{ color: sColor }} />
        <span style={{ fontWeight: 700, color: sColor, fontSize: '15px' }}>¡Bache detectado!</span>
        <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 600, color: 'white', background: sColor, padding: '2px 10px', borderRadius: '999px', textTransform: 'capitalize' }}>
          Severidad {resultado.severidad_ia}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
        {[
          { label: 'Confianza IA', value: `${resultado.confianza}%` },
          { label: 'Profundidad est.', value: resultado.profundidad_estimada_cm ? `${resultado.profundidad_estimada_cm} cm` : '—' },
          { label: 'Área est.', value: resultado.area_estimada_m2 ? `${resultado.area_estimada_m2} m²` : '—' },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: sColor }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}><strong>Diagnóstico:</strong> {resultado.razon}</div>
      {resultado.recomendacion && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}><strong>Recomendación:</strong> {resultado.recomendacion}</div>}
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>Modelo: {resultado.modelo_usado}</div>
    </div>
  )
}

export default function NuevoReporte() {
  const navigate = useNavigate()
  const fileRef   = useRef()

  const [foto,       setFoto]       = useState(null)
  const [fotoPreview,setFotoPreview] = useState(null)
  const [aiResult,   setAiResult]   = useState(null)
  const [aiLoading,  setAiLoading]  = useState(false)
  const [aiError,    setAiError]    = useState(null)
  const [coords,     setCoords]     = useState(null)
  const [form,       setForm]       = useState({
    nombre_via: '',
    tipo_via: 'avenida_principal',
    descripcion: '',
    municipio_id: '',
    colonia_id: '',
    calle_id: '',
    direccion_aproximada: '',
  })
  const [municipios, setMunicipios] = useState([])
  const [ubicacionIA, setUbicacionIA] = useState(null)
  const [ubicacionLoading, setUbicacionLoading] = useState(false)
  const [ubicacionError, setUbicacionError] = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState(null)

  useEffect(() => {
    fetch('/api/municipios', { credentials: 'include', headers: { Accept: 'application/json' } })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setMunicipios(Array.isArray(data) ? data : [])
      })
      .catch(() => {})
  }, [])

  const autocompletarUbicacion = useCallback(async ([lat, lng]) => {
    setCoords([lat, lng])
    setUbicacionError(null)
    setUbicacionLoading(true)

    try {
      const params = new URLSearchParams({
        latitud: String(lat),
        longitud: String(lng),
      })
      const data = await api.get(`/api/ubicacion/sugerir?${params.toString()}`)

      setUbicacionIA(data)
      setForm(prev => ({
        ...prev,
        municipio_id: data.municipio_id ? String(data.municipio_id) : prev.municipio_id,
        colonia_id: data.colonia_id ? String(data.colonia_id) : '',
        calle_id: data.calle_id ? String(data.calle_id) : '',
        nombre_via: data.nombre_via ?? prev.nombre_via,
        tipo_via: data.tipo_via ?? prev.tipo_via,
        direccion_aproximada: data.direccion_aproximada ?? prev.direccion_aproximada,
      }))
    } catch (e) {
      setUbicacionError(e.message ?? 'No fue posible autocompletar la ubicación')
    } finally {
      setUbicacionLoading(false)
    }
  }, [])

  const handleFoto = useCallback(async (file) => {
    if (!file) return
    setFoto(file)
    setFotoPreview(URL.createObjectURL(file))
    setAiResult(null)
    setAiError(null)
    setAiLoading(true)

    const fd = new FormData()
    fd.append('foto', file)

    try {
      const data = await api.upload('/api/ai/preanalizar', fd)
      setAiResult(data)
    } catch (e) {
      setAiResult(null)
      setAiError(e.message ?? 'No fue posible analizar la imagen con IA')
    } finally {
      setAiLoading(false)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!coords) { setError('Selecciona la ubicación en el mapa'); return }
    if (!form.municipio_id) { setError('Selecciona un municipio'); return }
    setSaving(true); setError(null)

    const fd = new FormData()
    fd.append('latitud',    coords[0])
    fd.append('longitud',   coords[1])
    fd.append('nombre_via', form.nombre_via)
    fd.append('tipo_via',   form.tipo_via)
    fd.append('descripcion', form.descripcion)
    fd.append('municipio_id', form.municipio_id)
    if (form.colonia_id) fd.append('colonia_id', form.colonia_id)
    if (form.calle_id) fd.append('calle_id', form.calle_id)
    if (form.direccion_aproximada) fd.append('direccion_aproximada', form.direccion_aproximada)
    if (foto) fd.append('foto', foto)

    try {
      const data = await api.upload('/api/reportes', fd)
      navigate(`/reportes/${data.id}`)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '14px', background: 'var(--surface)', color: 'var(--text-primary)', outline: 'none' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .upload-zone:hover { border-color: var(--primary) !important; background: var(--primary-light) !important; }`}</style>
      <Sidebar />
      <div style={{ marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Nuevo Reporte" />
        <div style={{ padding: '24px', maxWidth: '960px' }}>

          <button onClick={() => navigate('/reportes')} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', marginBottom: '20px', padding: 0 }}>
            <ChevronLeft size={18} /> Volver a reportes
          </button>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

              {/* LEFT — Foto + AI */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 900, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    <MapPin size={18} style={{ color: 'var(--primary)' }} /> FOTO DEL BACHE
                  </h3>

                  {fotoPreview ? (
                    <div style={{ position: 'relative' }}>
                      <img src={fotoPreview} alt="preview" style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                      <button type="button" onClick={() => { setFoto(null); setFotoPreview(null); setAiResult(null) }}
                        style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: '16px' }}>×</button>
                    </div>
                  ) : (
                    <div className="upload-zone"
                      onClick={() => fileRef.current?.click()}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => { e.preventDefault(); handleFoto(e.dataTransfer.files[0]) }}
                      style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', padding: '40px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <Upload size={32} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                      <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '4px' }}>Arrastra la foto o haz clic</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>JPG, PNG, WEBP · máx 10MB</div>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFoto(e.target.files[0])} />
                </div>

                {/* AI Result */}
                <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 900, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    <Shield size={18} style={{ color: 'var(--accent)' }} /> ANÁLISIS IA
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', marginLeft: 'auto', background: 'var(--bg)', padding: '2px 8px', borderRadius: '4px' }}>GPT-4o VISION</span>
                  </h3>
                  {!foto && !aiLoading
                    ? <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Sube una foto para activar el análisis automático.</p>
                    : <AiResultCard resultado={aiResult} loading={aiLoading} />
                  }
                  {aiError && (
                    <div style={{ marginTop: '10px', padding: '10px 14px', background: 'var(--danger-light)', border: '1px solid rgba(244,76,99,0.3)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <AlertTriangle size={16} style={{ flexShrink: 0 }} /> {aiError}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT — Mapa + Formulario */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={16} style={{ color: 'var(--primary)' }} />
                    Ubicación
                    {coords && <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--success)', marginLeft: 'auto' }}>✓ Marcada</span>}
                  </h3>
                  <div style={{ height: '220px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <MapContainer center={[17.0732, -96.7266]} zoom={14} style={{ width: '100%', height: '100%' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                      <LocationPicker value={coords} onChange={autocompletarUbicacion} />
                    </MapContainer>
                  </div>
                  {!coords && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>Haz clic en el mapa para marcar el bache</p>}
                  {coords && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>{coords[0].toFixed(6)}, {coords[1].toFixed(6)}</p>}
                  {ubicacionLoading && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>Analizando ubicación…</p>}
                  {ubicacionError && <p style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '6px' }}>{ubicacionError}</p>}
                  {ubicacionIA?.direccion_aproximada && (
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                      <strong>Dirección detectada:</strong> {ubicacionIA.direccion_aproximada}
                    </p>
                  )}
                </div>

                <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Datos del reporte</h3>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Municipio *</label>
                    <select
                      value={form.municipio_id}
                      onChange={e => setForm(f => ({ ...f, municipio_id: e.target.value }))}
                      required
                      style={inputStyle}
                    >
                      <option value="">Selecciona un municipio</option>
                      {municipios.map(m => (
                        <option key={m.id} value={m.id}>{m.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Nombre de la vía *</label>
                    <input value={form.nombre_via} onChange={e => setForm(f => ({...f, nombre_via: e.target.value}))} placeholder="Ej: Avenida Independencia" required style={inputStyle} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Tipo de vía *</label>
                    <select value={form.tipo_via} onChange={e => setForm(f => ({...f, tipo_via: e.target.value}))} required style={inputStyle}>
                      <option value="avenida_principal">Avenida principal</option>
                      <option value="calle_secundaria">Calle secundaria</option>
                      <option value="boulevard">Boulevard</option>
                      <option value="carretera">Carretera</option>
                      <option value="callejon">Callejón</option>
                      <option value="privada">Privada</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Descripción *</label>
                    <textarea value={form.descripcion} onChange={e => setForm(f => ({...f, descripcion: e.target.value}))} placeholder="Describe el tamaño, profundidad y situación del bache..." required rows={3}
                      style={{...inputStyle, resize: 'vertical', fontFamily: 'inherit'}} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Dirección aproximada</label>
                    <input
                      value={form.direccion_aproximada}
                      onChange={e => setForm(f => ({ ...f, direccion_aproximada: e.target.value }))}
                      placeholder="Referencia detectada o manual"
                      style={inputStyle}
                    />
                  </div>

                  {(ubicacionIA?.colonia_nombre || ubicacionIA?.calle_nombre) && (
                    <div style={{ padding: '10px 12px', border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-md)', background: 'var(--bg)' }}>
                      {ubicacionIA?.colonia_nombre && <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}><strong>Colonia detectada:</strong> {ubicacionIA.colonia_nombre}</div>}
                      {ubicacionIA?.calle_nombre && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}><strong>Calle detectada:</strong> {ubicacionIA.calle_nombre}</div>}
                    </div>
                  )}

                  {error && (
                    <div style={{ padding: '10px 14px', background: 'var(--danger-light)', border: '1px solid rgba(244,76,99,0.3)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <AlertTriangle size={16} style={{ flexShrink: 0 }} /> {error}
                    </div>
                  )}

                  <button type="submit" disabled={saving}
                    style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: saving ? 'var(--text-muted)' : 'var(--primary)', color: 'white', border: 'none', fontWeight: 600, fontSize: '15px', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {saving && <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid white', animation: 'spin 0.8s linear infinite' }} />}
                    {saving ? 'Creando reporte...' : '✓ Crear reporte'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
