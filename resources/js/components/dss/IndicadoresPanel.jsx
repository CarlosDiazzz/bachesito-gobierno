// Módulo DSS (Proyecto Integrador DSTD): indicadores formales del modelo de decisión.
import { useState } from 'react'
import { Clock, Wallet, ListChecks, MapPin, ShieldCheck, Info } from 'lucide-react'

const CFG = {
  antiguedad_backlog:     { icon:<Clock size={16}/>,       color:'#B7791F' },
  cobertura_presupuestal: { icon:<Wallet size={16}/>,      color:'#2B6CB0' },
  baches_cubiertos:       { icon:<ListChecks size={16}/>,  color:'#276749' },
  concentracion_colonias: { icon:<MapPin size={16}/>,      color:'#6B46C1' },
  tasa_calidad_datos:     { icon:<ShieldCheck size={16}/>, color:'#9D2449' },
}

function formatoValor(ind) {
  if (ind.valor === null || ind.valor === undefined) return '—'
  const v = Number(ind.valor).toLocaleString('es-MX', { maximumFractionDigits: 1 })
  return ind.unidad === '%' ? `${v} %` : `${v} ${ind.unidad}`
}

function Tarjeta({ ind, abierto, onToggle }) {
  const { icon, color } = CFG[ind.clave] ?? { icon:<Info size={16}/>, color:'var(--primary)' }
  const top = ind.clave === 'concentracion_colonias' ? (ind.detalle?.top ?? []) : []
  const sinColonia = ind.clave === 'concentracion_colonias' ? ind.detalle?.sin_colonia : null

  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:16, display:'flex', flexDirection:'column', gap:6 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:6 }}>
        <span style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>{ind.nombre}</span>
        <span style={{ color }}>{icon}</span>
      </div>

      <div style={{ display:'flex', alignItems:'baseline', gap:6, flexWrap:'wrap' }}>
        <span style={{ fontSize:24, fontWeight:900, color }}>{formatoValor(ind)}</span>
        {ind.clave === 'antiguedad_backlog' && ind.detalle?.n > 0 && (
          <span style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)' }}>mediana {ind.detalle.mediana} días</span>
        )}
      </div>

      <p style={{ margin:0, fontSize:11, color:'var(--text-secondary)', lineHeight:1.4 }}>{ind.interpretacion}</p>

      {top.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:5, marginTop:4 }}>
          {top.map(c => (
            <div key={c.colonia} title={`${c.pendientes} pendientes`}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, fontWeight:700, color:'var(--text-secondary)', marginBottom:2 }}>
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.colonia}</span>
                <span>{c.pendientes} · {c.porcentaje} %</span>
              </div>
              <div style={{ height:5, background:'#F1F5F9', borderRadius:99, overflow:'hidden' }}>
                <div style={{ width:`${c.porcentaje}%`, height:'100%', background:color, borderRadius:99, transition:'width 0.6s' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {sinColonia?.pendientes > 0 && (
        <div title="Reportes sin colonia tras el ETL; no compiten en el top 5" style={{ borderTop:'1px dashed var(--border)', paddingTop:6 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, fontWeight:700, color:'var(--text-muted)', marginBottom:2 }}>
            <span>{sinColonia.texto}</span>
            <span>{sinColonia.porcentaje} %</span>
          </div>
          <div style={{ height:5, background:'#F1F5F9', borderRadius:99, overflow:'hidden' }}>
            <div style={{ width:`${sinColonia.porcentaje}%`, height:'100%', background:'#94A3B8', borderRadius:99 }} />
          </div>
        </div>
      )}

      <button type="button" onClick={onToggle} aria-expanded={abierto} style={{
        alignSelf:'flex-start', display:'flex', alignItems:'center', gap:4, marginTop:'auto', padding:'3px 0',
        border:'none', background:'none', cursor:'pointer', fontSize:10, fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.4px',
      }}>
        <Info size={12}/> {abierto ? 'Ocultar fórmula' : 'Fórmula y fuente'}
      </button>
      {abierto && (
        <div style={{ background:'#F8FAFC', border:'1px solid var(--border)', borderRadius:8, padding:'8px 10px', fontSize:10, color:'var(--text-secondary)', lineHeight:1.5 }}>
          <div><strong>Fórmula:</strong> <span style={{ fontFamily:'monospace' }}>{ind.formula}</span></div>
          <div><strong>Fuente:</strong> {ind.fuente}</div>
        </div>
      )}
    </div>
  )
}

export default function IndicadoresPanel({ indicadores }) {
  const [abierto, setAbierto] = useState(null)
  if (!indicadores?.length) return null

  return (
    <div style={{ marginBottom:20 }}>
      <h3 style={{ margin:'0 0 10px', fontSize:14, fontWeight:900, color:'var(--text-primary)' }}>Indicadores de decisión</h3>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(190px, 1fr))', gap:12, alignItems:'stretch' }}>
        {indicadores.map(ind => (
          <Tarjeta
            key={ind.clave}
            ind={ind}
            abierto={abierto === ind.clave}
            onToggle={() => setAbierto(abierto === ind.clave ? null : ind.clave)}
          />
        ))}
      </div>
    </div>
  )
}
