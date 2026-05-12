import { useState, useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import ReporteCard from '../components/ReporteCard'
import Badge from '../components/Badge'
import { api } from '../lib/api'
import { PRIORIDAD_COLOR, ESTADO_COLOR, ESTADO_LABEL } from '../data/mockData'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const PRIORIDADES = ['critica', 'alta', 'media', 'baja']
const ESTADOS     = ['pendiente', 'validado', 'asignado', 'en_proceso', 'resuelto', 'rechazado']
const PRIO_LABEL  = { critica: 'Crítica', alta: 'Alta', media: 'Media', baja: 'Baja' }
const PRIO_BG     = { critica: '#FEE8EB', alta: '#FEF3E8', media: '#FEFAE8', baja: '#EDF7E8' }
const PRIO_FILTER_STYLE = {
  critica: { color: 'var(--prio-critica)', textOn: 'white' },
  alta: { color: 'var(--prio-alta)', textOn: 'white' },
  media: { color: 'var(--prio-media)', textOn: '#3f3207' },
  baja: { color: 'var(--prio-baja)', textOn: 'white' },
}
const ESTADO_FILTER_STYLE = {
  pendiente:  { color: 'var(--estado-pendiente)', textOn: 'white' },
  validado:   { color: 'var(--estado-validado)', textOn: 'white' },
  asignado:   { color: 'var(--estado-purpura, #8E418D)', textOn: 'white' },
  en_proceso: { color: 'var(--estado-en-proceso)', textOn: 'white' },
  resuelto:   { color: 'var(--estado-resuelto)', textOn: 'white' },
  rechazado:  { color: 'var(--estado-rechazado)', textOn: 'white' },
}

function MapController({ selected }) {
  const map = useMap()
  if (selected) map.flyTo([selected.latitud, selected.longitud], 16, { duration: 0.8 })
  return null
}

export default function Mapa() {
  const [reportes,     setReportes]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [activePrio,   setActivePrio]   = useState(new Set(PRIORIDADES))
  const [activeEstado, setActiveEstado] = useState(new Set(ESTADOS))
  const [selected,     setSelected]     = useState(null)

  useEffect(() => {
    api.get('/api/reportes/mapa')
      .then(setReportes)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = reportes.filter(r => activePrio.has(r.prioridad) && activeEstado.has(r.estado))

  function togglePrio(p) {
    setActivePrio(prev => { const s = new Set(prev); s.has(p) ? s.delete(p) : s.add(p); return s })
  }
  function toggleEstado(e) {
    setActiveEstado(prev => { const s = new Set(prev); s.has(e) ? s.delete(e) : s.add(e); return s })
  }

  return (
    <div className="main-layout">
      <Sidebar />
      <div className="content-wrapper">
        <TopBar title="Mapa de Baches" />
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: 'calc(100vh - 110px)', flexDirection: window.innerWidth <= 1024 ? 'column' : 'row' }}>

          {/* Left panel */}
          <div style={{ 
            width: window.innerWidth <= 1024 ? '100%' : '320px', 
            height: window.innerWidth <= 1024 ? '200px' : '100%',
            flexShrink: 0, 
            background: 'var(--surface)', 
            borderRight: window.innerWidth <= 1024 ? 'none' : '1px solid var(--border)', 
            borderBottom: window.innerWidth <= 1024 ? '1px solid var(--border)' : 'none',
            display: 'flex', 
            flexDirection: 'column', 
            overflow: 'hidden' 
          }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Filtrar por prioridad</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {PRIORIDADES.map(p => (
                  <button
                    key={p}
                    onClick={() => togglePrio(p)}
                    style={{
                      fontSize: '12px',
                      fontWeight: activePrio.has(p) ? 700 : 600,
                      padding: '4px 10px',
                      borderRadius: '999px',
                      cursor: 'pointer',
                      border: `1.5px solid ${PRIO_FILTER_STYLE[p].color}`,
                      background: activePrio.has(p) ? PRIO_FILTER_STYLE[p].color : 'var(--surface)',
                      color: activePrio.has(p) ? PRIO_FILTER_STYLE[p].textOn : 'var(--text-primary)',
                      boxShadow: activePrio.has(p) ? '0 1px 2px rgba(0,0,0,0.12)' : 'none',
                    }}
                  >
                    {PRIO_LABEL[p]}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '12px 0 8px' }}>Filtrar por estado</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {ESTADOS.map(e => (
                  <button
                    key={e}
                    onClick={() => toggleEstado(e)}
                    style={{
                      fontSize: '11px',
                      fontWeight: activeEstado.has(e) ? 700 : 600,
                      padding: '3px 8px',
                      borderRadius: '999px',
                      cursor: 'pointer',
                      border: `1.5px solid ${ESTADO_FILTER_STYLE[e].color}`,
                      background: activeEstado.has(e) ? ESTADO_FILTER_STYLE[e].color : 'var(--surface)',
                      color: activeEstado.has(e) ? ESTADO_FILTER_STYLE[e].textOn : 'var(--text-primary)',
                      boxShadow: activeEstado.has(e) ? '0 1px 2px rgba(0,0,0,0.12)' : 'none',
                    }}
                  >
                    {ESTADO_LABEL[e]}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {loading
                ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0', fontSize: '13px' }}>Cargando...</p>
                : filtered.length === 0
                ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0', fontSize: '13px' }}>Sin resultados</p>
                : filtered.map(r => <ReporteCard key={r.id} reporte={r} onSelect={setSelected} />)
              }
            </div>
          </div>

          {/* Map */}
          <div style={{ flex: 1, position: 'relative' }}>
            <MapContainer center={[17.0732, -96.7266]} zoom={14} style={{ width: '100%', height: '100%' }} scrollWheelZoom>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapController selected={selected} />
              {filtered.map(r => (
                <CircleMarker key={r.id} center={[r.latitud, r.longitud]} radius={10} fillColor={PRIORIDAD_COLOR[r.prioridad]} color="white" weight={2} fillOpacity={0.85} eventHandlers={{ click: () => setSelected(r) }}>
                  <Popup>
                    <div style={{ minWidth: '160px', fontFamily: 'Inter, sans-serif' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#9099B8' }}>{r.folio}</div>
                      <div style={{ fontWeight: 600, fontSize: '13px', margin: '4px 0' }}>{r.nombre_via}</div>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        <Badge label={ESTADO_LABEL[r.estado]} color={ESTADO_COLOR[r.estado]} bgColor={`${ESTADO_COLOR[r.estado]}22`} />
                        <Badge label={PRIO_LABEL[r.prioridad]} color={PRIORIDAD_COLOR[r.prioridad]} bgColor={PRIO_BG[r.prioridad]} />
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>

            {/* Detail panel */}
            {selected && (
              <div style={{ 
                position: 'absolute', 
                top: window.innerWidth <= 768 ? 'auto' : 0, 
                bottom: 0,
                right: 0, 
                width: window.innerWidth <= 768 ? '100%' : '320px', 
                height: window.innerWidth <= 768 ? '50%' : '100%', 
                background: 'white', 
                boxShadow: 'var(--shadow-lg)', 
                zIndex: 500, 
                display: 'flex', 
                flexDirection: 'column', 
                overflowY: 'auto',
                borderTop: window.innerWidth <= 768 ? '4px solid var(--accent)' : 'none',
                animation: window.innerWidth <= 768 ? 'slideUp 0.3s ease-out' : 'slideLeft 0.3s ease-out'
              }}>
                <style>{`
                  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                  @keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
                `}</style>
                <img src={selected.foto} alt="" style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                <div style={{ padding: '20px', flex: 1 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{selected.folio}</div>
                  <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>{selected.nombre_via}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{selected.colonia}, {selected.municipio}</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <Badge label={ESTADO_LABEL[selected.estado]} color={ESTADO_COLOR[selected.estado]} bgColor={`${ESTADO_COLOR[selected.estado]}22`} />
                    <Badge label={PRIO_LABEL[selected.prioridad]} color={PRIORIDAD_COLOR[selected.prioridad]} bgColor={PRIO_BG[selected.prioridad]} />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Score de prioridad</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '6px', background: 'var(--surface-2)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${selected.score_prioridad}%`, height: '100%', background: PRIORIDAD_COLOR[selected.prioridad], borderRadius: '3px' }} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '14px' }}>{selected.score_prioridad}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{selected.descripcion}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>{selected.fecha_reporte ? new Date(selected.fecha_reporte).toLocaleString('es-MX') : '—'}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button style={{ padding: '8px', borderRadius: '6px', background: 'var(--estado-validado)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Validar</button>
                    <button style={{ padding: '8px', borderRadius: '6px', background: 'var(--estado-asignado)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Asignar</button>
                    <button style={{ padding: '8px', borderRadius: '6px', background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', cursor: 'pointer', fontWeight: 500 }}>Rechazar</button>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
