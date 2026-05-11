import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import Badge from './Badge'
import { PRIORIDAD_COLOR, ESTADO_COLOR, ESTADO_LABEL } from '../data/mockData'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const PRIO_LABEL = { critica: 'Crítica', alta: 'Alta', media: 'Media', baja: 'Baja' }
const PRIO_BG    = { critica: '#FEE8EB', alta: '#FEF3E8', media: '#FEFAE8', baja: '#EDF7E8' }

export default function MapaReportes({ reportes = [], style = {} }) {
  return (
    <MapContainer
      center={[17.0732, -96.7266]}
      zoom={14}
      style={{ width: '100%', height: '100%', minHeight: '300px', ...style }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {reportes.map(r => (
        <CircleMarker
          key={r.id}
          center={[r.latitud, r.longitud]}
          radius={10}
          fillColor={PRIORIDAD_COLOR[r.prioridad]}
          color="white"
          weight={2}
          fillOpacity={0.85}
        >
          <Popup>
            <div style={{ minWidth: '180px', fontFamily: 'Inter, sans-serif' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{r.folio}</div>
              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>{r.nombre_via}</div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <Badge label={ESTADO_LABEL[r.estado] || r.estado} color={ESTADO_COLOR[r.estado]} bgColor={`${ESTADO_COLOR[r.estado]}22`} />
                <Badge label={PRIO_LABEL[r.prioridad]} color={PRIORIDAD_COLOR[r.prioridad]} bgColor={PRIO_BG[r.prioridad]} />
              </div>
              <div style={{ fontSize: '12px', color: '#5A6080', marginBottom: '4px' }}>{r.descripcion}</div>
              <div style={{ fontSize: '12px', color: '#9099B8' }}>Score: <strong>{r.score_prioridad}</strong></div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
