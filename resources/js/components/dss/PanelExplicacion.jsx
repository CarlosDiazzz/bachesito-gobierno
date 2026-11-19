// Módulo DSS (Proyecto Integrador DSTD): desglose del cálculo TOPSIS de un bache.
import { useEffect } from 'react'
import { X } from 'lucide-react'
import { dinero } from './ResumenPresupuesto'

const LABEL = {
  severidad:      'Severidad',
  tipo_via:       'Tipo de vía',
  dias_pendiente: 'Días pendientes',
  densidad_zona:  'Densidad zona',
  score_ia:       'Score IA',
}

const th = { textAlign:'right', padding:'7px 8px', borderBottom:'2px solid var(--border)', fontSize:9, fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', whiteSpace:'nowrap' }
const td = { textAlign:'right', padding:'8px', borderBottom:'1px solid var(--border)', fontFamily:'monospace', fontSize:11, color:'var(--text-secondary)' }

export default function PanelExplicacion({ fila, onCerrar }) {
  useEffect(() => {
    const esc = e => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onCerrar])

  if (!fila) return null
  const e = fila.explicacion ?? {}
  const destacados = new Set(e.criterios_destacados ?? [])
  const c = fila.costo_detalle

  return (
    <div onClick={onCerrar} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.45)', zIndex:1000, display:'flex', justifyContent:'flex-end' }}>
      <aside onClick={ev => ev.stopPropagation()} role="dialog" aria-label={`Explicación ${fila.folio}`} style={{
        width:'min(560px, 100%)', height:'100%', overflowY:'auto', background:'var(--surface)',
        boxShadow:'-8px 0 24px rgba(0,0,0,0.15)', padding:'20px 18px',
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, marginBottom:14 }}>
          <div>
            <span style={{ fontSize:11, fontFamily:'monospace', color:'var(--text-muted)', background:'#F1F5F9', padding:'1px 6px', borderRadius:4 }}>{fila.folio}</span>
            <h3 style={{ margin:'6px 0 2px', fontSize:16, fontWeight:900, color:'var(--text-primary)' }}>¿Por qué esta posición?</h3>
            <p style={{ margin:0, fontSize:12, color:'var(--text-muted)' }}>{fila.nombre_via} · {fila.colonia}</p>
          </div>
          <button onClick={onCerrar} aria-label="Cerrar" style={{ border:'1px solid var(--border)', background:'transparent', borderRadius:8, padding:6, cursor:'pointer', color:'var(--text-secondary)' }}>
            <X size={16}/>
          </button>
        </div>

        {e.frase && (
          <div style={{ background:'var(--primary-light)', borderRadius:10, padding:'12px 14px', marginBottom:16 }}>
            <p style={{ margin:0, fontSize:13, fontWeight:700, color:'var(--primary)', lineHeight:1.5 }}>{e.frase}</p>
          </div>
        )}

        <h4 style={{ margin:'0 0 8px', fontSize:12, fontWeight:900, color:'var(--text-primary)' }}>1. Matriz de decisión por criterio</h4>
        <div style={{ overflowX:'auto', marginBottom:16 }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign:'left' }}>Criterio</th>
                <th style={th}>Crudo</th><th style={th}>Normalizado</th><th style={th}>Peso</th>
                <th style={th}>Ponderado</th><th style={th}>Ideal +</th><th style={th}>Ideal −</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(e.criterios ?? {}).map(([k, v]) => (
                <tr key={k} style={{ background: destacados.has(k) ? '#F0FFF4' : 'transparent' }}>
                  <td style={{ ...td, textAlign:'left', fontFamily:'inherit', fontWeight:800, color:'var(--text-primary)' }}>
                    {LABEL[k] ?? k}{destacados.has(k) && ' ★'}
                  </td>
                  <td style={td}>{v.crudo}</td>
                  <td style={td}>{v.normalizado.toFixed(4)}</td>
                  <td style={td}>{Math.round(v.peso * 100)} %</td>
                  <td style={{ ...td, fontWeight:800, color:'var(--text-primary)' }}>{v.ponderado.toFixed(4)}</td>
                  <td style={td}>{v.ideal_positivo.toFixed(4)}</td>
                  <td style={td}>{v.ideal_negativo.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ margin:'6px 0 0', fontSize:10, color:'var(--text-muted)' }}>
            ★ criterio donde el bache está más cerca del ideal positivo. Normalizado = crudo / √Σ crudo². Ponderado = normalizado × peso.
          </p>
        </div>

        <h4 style={{ margin:'0 0 8px', fontSize:12, fontWeight:900, color:'var(--text-primary)' }}>2. Distancias y score</h4>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8, marginBottom:16 }}>
          {[
            { label:'D⁺ (al ideal positivo)', val:e.d_ideal_positivo?.toFixed(4) },
            { label:'D⁻ (al ideal negativo)', val:e.d_ideal_negativo?.toFixed(4) },
            { label:'Score = D⁻ / (D⁺ + D⁻)', val:e.score?.toFixed(4) },
          ].map(x => (
            <div key={x.label} style={{ background:'#F8FAFC', border:'1px solid var(--border)', borderRadius:10, padding:'10px 12px' }}>
              <div style={{ fontSize:9, fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', marginBottom:4 }}>{x.label}</div>
              <div style={{ fontSize:16, fontWeight:900, color:'var(--text-primary)', fontFamily:'monospace' }}>{x.val ?? '—'}</div>
            </div>
          ))}
        </div>

        <h4 style={{ margin:'0 0 8px', fontSize:12, fontWeight:900, color:'var(--text-primary)' }}>3. Costo y decisión</h4>
        {c && (
          <p style={{ margin:'0 0 6px', fontSize:12, color:'var(--text-secondary)', fontFamily:'monospace' }}>
            {c.area_m2} m²{c.area_supuesta ? ' (supuesta)' : ''} × {dinero(c.costo_m2)} + {dinero(c.costo_fijo)} = <strong>{dinero(c.costo)}</strong>
          </p>
        )}
        <p style={{ margin:0, fontSize:12, color:'var(--text-secondary)' }}>
          Posición {e.posicion} de {e.total}
          {e.saldo_despues !== null && e.saldo_despues !== undefined && <> · saldo después de evaluar este bache: <strong>{dinero(e.saldo_despues)}</strong></>}
          {fila.num_reportes_fusionados > 1 && <> · agrupa {fila.num_reportes_fusionados} reportes</>}
        </p>
      </aside>
    </div>
  )
}
