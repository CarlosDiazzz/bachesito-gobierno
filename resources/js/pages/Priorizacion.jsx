import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, AlertTriangle, MapPin, Clock, Zap, RefreshCw, ChevronRight, BarChart2, Map, Database } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import TabCalidadDatos from '../components/dss/TabCalidadDatos'
import ResumenPresupuesto, { dinero } from '../components/dss/ResumenPresupuesto'
import PanelExplicacion from '../components/dss/PanelExplicacion'
import SinSustento from '../components/dss/SinSustento'
import IndicadoresPanel from '../components/dss/IndicadoresPanel'
import AvisoEtl from '../components/dss/AvisoEtl'
import { api } from '../lib/api'

// ── Helpers ───────────────────────────────────────────────────────────────────

const ESTADO_LABEL = { pendiente:'Pendiente', validado:'Validado', asignado:'Asignado', en_proceso:'En proceso' }
const ESTADO_COLOR = { pendiente:'#B7791F', validado:'#2B6CB0', asignado:'#6B46C1', en_proceso:'#C05621' }
const PRIO_COLOR   = { critica:'#9D2449', alta:'#C05621', media:'#B7791F', baja:'#276749' }
const SEV_COLOR    = { alta:'#9D2449', media:'#B7791F', baja:'#276749' }
const SEV_EMOJI    = { alta:'🔴', media:'🟡', baja:'🟢' }
const DECISION_CFG = {
  recomendado: { label:'Recomendado', bg:'#DCFCE7', color:'#166534' },
  en_espera:   { label:'En espera',   bg:'#F1F5F9', color:'#475569' },
}

const URG_CFG = {
  inmediata: { label:'Inmediata', bg:'#FEE2E2', color:'#991B1B' },
  alta:      { label:'Alta',      bg:'#FEF3C7', color:'#92400E' },
  media:     { label:'Media',     bg:'#ECFDF5', color:'#065F46' },
}
const INT_CFG = {
  bacheo_focalizado:      { label:'Bacheo focalizado',      icon:'🎯' },
  rehabilitacion_integral:{ label:'Rehabilitación integral', icon:'🏗' },
  mantenimiento_preventivo:{ label:'Mantenimiento preventivo',icon:'🛡' },
}

function pct(val, max) { return Math.min((val / max) * 100, 100) }

function ScoreBar({ score }) {
  const color = score >= 70 ? '#9D2449' : score >= 45 ? '#C05621' : '#276749'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ flex:1, height:6, background:'#F1F5F9', borderRadius:99, overflow:'hidden' }}>
        <div style={{ width:`${score}%`, height:'100%', background:color, borderRadius:99, transition:'width 0.6s' }} />
      </div>
      <span style={{ fontSize:13, fontWeight:900, color, minWidth:36, textAlign:'right' }}>{score}</span>
    </div>
  )
}

function CriterioBar({ label, val, max, color='var(--primary)' }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <span style={{ fontSize:10, color:'var(--text-muted)', minWidth:90, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</span>
      <div style={{ flex:1, height:4, background:'#F1F5F9', borderRadius:99, overflow:'hidden' }}>
        <div style={{ width:`${pct(val, max)}%`, height:'100%', background:color, borderRadius:99 }} />
      </div>
      <span style={{ fontSize:10, fontWeight:800, color:'var(--text-secondary)', minWidth:28, textAlign:'right' }}>{typeof val === 'number' && !Number.isInteger(val) ? val.toFixed(1) : val}</span>
    </div>
  )
}

// ── Tab: Ranking TOPSIS ───────────────────────────────────────────────────────
function TabRanking({ ranking, onAsignar, onExplicar }) {
  const navigate = useNavigate()

  if (!ranking.length) return (
    <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text-muted)' }}>
      <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
      <p style={{ fontWeight:700 }}>No hay baches activos para priorizar</p>
    </div>
  )

  const maxDias    = Math.max(...ranking.map(r => r.criterios.dias_pendiente), 1)
  const maxDensidad = Math.max(...ranking.map(r => r.criterios.densidad_zona), 1)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {ranking.map(r => (
        <div key={r.id} style={{
          background:'var(--surface)', border:'1px solid var(--border)',
          borderRadius:12, overflow:'hidden',
          borderLeft:`4px solid ${PRIO_COLOR[r.prioridad] ?? '#94A3B8'}`,
        }}>
          <div style={{ display:'flex', alignItems:'stretch', gap:0 }}>

            {/* Rank */}
            <div style={{
              minWidth:52, display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center', padding:'16px 8px',
              background: r.rank <= 3 ? 'var(--primary-light)' : '#F8FAFC',
              borderRight:'1px solid var(--border)',
            }}>
              <span style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase' }}>#</span>
              <span style={{ fontSize:22, fontWeight:900, color: r.rank <= 3 ? 'var(--primary)' : 'var(--text-secondary)' }}>{r.rank}</span>
            </div>

            {/* Info */}
            <div style={{ flex:1, padding:'14px 16px', minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:6 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:2 }}>
                    <span style={{ fontSize:11, fontFamily:'monospace', color:'var(--text-muted)', background:'#F1F5F9', padding:'1px 6px', borderRadius:4 }}>{r.folio}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:ESTADO_COLOR[r.estado], background:`${ESTADO_COLOR[r.estado]}18`, padding:'1px 8px', borderRadius:99 }}>
                      {ESTADO_LABEL[r.estado] ?? r.estado}
                    </span>
                    {r.ai_severidad && (
                      <span style={{ fontSize:11, fontWeight:700, color:SEV_COLOR[r.ai_severidad] }}>
                        {SEV_EMOJI[r.ai_severidad]} {r.ai_severidad}
                      </span>
                    )}
                    {DECISION_CFG[r.decision] && (
                      <span style={{ fontSize:10, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.4px',
                        color:DECISION_CFG[r.decision].color, background:DECISION_CFG[r.decision].bg, padding:'2px 8px', borderRadius:99 }}>
                        {DECISION_CFG[r.decision].label}
                      </span>
                    )}
                    {r.num_reportes_fusionados > 1 && (
                      <span style={{ fontSize:10, fontWeight:700, color:'#3730A3', background:'#E0E7FF', padding:'1px 7px', borderRadius:99 }}>
                        ×{r.num_reportes_fusionados} reportes
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize:14, fontWeight:800, color:'var(--text-primary)', margin:'0 0 2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                    {r.nombre_via}
                  </p>
                  <p style={{ fontSize:11, color:'var(--text-muted)', margin:0 }}>{r.colonia}</p>
                </div>

                {/* TOPSIS score */}
                <div style={{ textAlign:'center', minWidth:68, flexShrink:0 }}>
                  <div style={{
                    width:60, height:60, borderRadius:'50%', margin:'0 auto 2px',
                    border:`3px solid ${r.topsis_score >= 70 ? '#9D2449' : r.topsis_score >= 45 ? '#C05621' : '#276749'}`,
                    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                    background: r.topsis_score >= 70 ? '#FFF5F7' : r.topsis_score >= 45 ? '#FFF8F1' : '#F0FFF4',
                  }}>
                    <span style={{ fontSize:16, fontWeight:900, color: r.topsis_score >= 70 ? '#9D2449' : r.topsis_score >= 45 ? '#C05621' : '#276749', lineHeight:1 }}>{r.topsis_score}</span>
                    <span style={{ fontSize:8, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase' }}>TOPSIS</span>
                  </div>
                  {r.costo_estimado !== undefined && (
                    <div style={{ marginTop:4 }}>
                      <div style={{ fontSize:13, fontWeight:900, color:'var(--text-primary)' }}>{dinero(r.costo_estimado)}</div>
                      <div style={{ fontSize:8, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase' }}>
                        Costo{r.costo_detalle?.area_supuesta ? ' *' : ''}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Criterios */}
              <div style={{ display:'flex', flexDirection:'column', gap:4, marginTop:8 }}>
                <CriterioBar label="Severidad"  val={r.criterios.severidad}      max={1}             color="#9D2449" />
                <CriterioBar label="Tipo vía"   val={r.criterios.tipo_via}       max={1}             color="#C05621" />
                <CriterioBar label="Días"       val={r.criterios.dias_pendiente} max={maxDias}       color="#B7791F" />
                <CriterioBar label="Densidad"   val={r.criterios.densidad_zona}  max={maxDensidad}   color="#6B46C1" />
                <CriterioBar label="Score IA"   val={r.criterios.score_ia}       max={100}           color="#2B6CB0" />
              </div>

              {/* Descripción */}
              {r.descripcion && (
                <p style={{ fontSize:11, color:'var(--text-muted)', margin:'8px 0 0', lineHeight:1.4,
                  overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                  {r.descripcion}
                </p>
              )}

              {/* Actions */}
              <div style={{ display:'flex', gap:8, marginTop:10 }}>
                <button
                  onClick={() => navigate(`/reportes/${r.id}`)}
                  style={{ fontSize:11, fontWeight:700, padding:'5px 12px', borderRadius:6,
                    border:'1px solid var(--border)', background:'transparent', cursor:'pointer', color:'var(--text-secondary)' }}
                >
                  Ver detalle
                </button>
                {r.explicacion && onExplicar && (
                  <button
                    onClick={() => onExplicar(r)}
                    style={{ fontSize:11, fontWeight:700, padding:'5px 12px', borderRadius:6,
                      border:'1px solid var(--primary)', background:'var(--primary-light)', cursor:'pointer', color:'var(--primary)' }}
                  >
                    ¿Por qué?
                  </button>
                )}
                {(r.estado === 'validado') && (
                  <button
                    onClick={() => onAsignar(r)}
                    style={{ fontSize:11, fontWeight:700, padding:'5px 12px', borderRadius:6,
                      border:'none', background:'var(--primary)', color:'white', cursor:'pointer' }}
                  >
                    Asignar reparador
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Tab: Zonas ────────────────────────────────────────────────────────────────
function TabZonas({ zonas }) {
  if (!zonas.length) return (
    <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text-muted)' }}>
      <p style={{ fontWeight:700 }}>Sin datos de zonas disponibles</p>
    </div>
  )

  const maxRiesgo = Math.max(...zonas.map(z => z.riesgo), 1)

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16 }}>
      {zonas.map((z, i) => (
        <div key={z.colonia_id ?? i} style={{
          background:'var(--surface)', border:'1px solid var(--border)',
          borderRadius:12, padding:20, position:'relative', overflow:'hidden',
        }}>
          {i < 3 && (
            <div style={{ position:'absolute', top:12, right:12, background:i===0?'#9D2449':i===1?'#C05621':'#B7791F',
              color:'white', fontSize:10, fontWeight:900, padding:'2px 8px', borderRadius:99 }}>
              {i===0?'ZONA CRÍTICA':i===1?'ALERTA':'ATENCIÓN'}
            </div>
          )}
          <div style={{ marginBottom:12 }}>
            <p style={{ fontSize:16, fontWeight:900, color:'var(--text-primary)', margin:'0 0 2px' }}>{z.colonia}</p>
            <p style={{ fontSize:12, color:'var(--text-muted)', margin:0 }}>{z.total} baches activos</p>
          </div>

          {/* Riesgo bar */}
          <div style={{ marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Índice de riesgo</span>
              <span style={{ fontSize:13, fontWeight:900, color: z.riesgo > maxRiesgo*0.6 ? '#9D2449' : z.riesgo > maxRiesgo*0.3 ? '#C05621' : '#276749' }}>{z.riesgo}</span>
            </div>
            <div style={{ height:6, background:'#F1F5F9', borderRadius:99, overflow:'hidden' }}>
              <div style={{
                width:`${pct(z.riesgo, maxRiesgo)}%`, height:'100%', borderRadius:99,
                background: z.riesgo > maxRiesgo*0.6 ? '#9D2449' : z.riesgo > maxRiesgo*0.3 ? '#C05621' : '#276749',
                transition:'width 0.6s',
              }} />
            </div>
          </div>

          {/* Desglose por prioridad */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {[
              { label:'Críticos', val:z.criticos, color:'#9D2449' },
              { label:'Altos',    val:z.altos,    color:'#C05621' },
              { label:'Medios',   val:z.medios,   color:'#B7791F' },
              { label:'Bajos',    val:z.bajos,    color:'#276749' },
            ].filter(s => s.val > 0).map(s => (
              <div key={s.label} style={{ background:`${s.color}12`, border:`1px solid ${s.color}30`,
                borderRadius:8, padding:'6px 10px', textAlign:'center' }}>
                <div style={{ fontSize:18, fontWeight:900, color:s.color }}>{s.val}</div>
                <div style={{ fontSize:9, fontWeight:700, color:s.color, textTransform:'uppercase', letterSpacing:'0.5px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Comparación de escenarios ─────────────────────────────────────────────────

function construirComparacion(equilibrado = [], rezago = []) {
  const rezagoPorId = new globalThis.Map(
    rezago.map(reporte => [reporte.id, reporte])
  )

  return equilibrado.map(base => {
    const alternativo = rezagoPorId.get(base.id)

    if (!alternativo) {
      return {
        id: base.id,
        folio: base.folio,
        nombre_via: base.nombre_via,
        colonia: base.colonia,
        rank_equilibrado: base.rank,
        rank_rezago: null,
        score_equilibrado: base.topsis_score,
        score_rezago: null,
        movimiento: 0,
        diferencia_score: 0,
        explicacion: 'No existe información para comparar este reporte.',
      }
    }

    const movimiento = base.rank - alternativo.rank
    const diferenciaScore = Number(
      (alternativo.topsis_score - base.topsis_score).toFixed(1)
    )

    let explicacion = 'Conserva la misma posición en los dos escenarios.'

    if (movimiento > 0) {
      explicacion =
        `Sube ${movimiento} ${movimiento === 1 ? 'posición' : 'posiciones'} ` +
        'porque el escenario de rezago da mayor importancia a los días pendientes.'
    }

    if (movimiento < 0) {
      const posiciones = Math.abs(movimiento)
      explicacion =
        `Baja ${posiciones} ${posiciones === 1 ? 'posición' : 'posiciones'} ` +
        'al disminuir el peso de la severidad y del tipo de vía.'
    }

    return {
      id: base.id,
      folio: base.folio,
      nombre_via: base.nombre_via,
      colonia: base.colonia,
      rank_equilibrado: base.rank,
      rank_rezago: alternativo.rank,
      score_equilibrado: base.topsis_score,
      score_rezago: alternativo.topsis_score,
      movimiento,
      diferencia_score: diferenciaScore,
      explicacion,
    }
  })
}

function TabComparacion({ comparacion }) {
  if (!comparacion.length) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '60px 20px',
        color: 'var(--text-muted)',
      }}>
        <p style={{ fontWeight: 700 }}>
          No hay reportes disponibles para comparar
        </p>
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '18px 20px',
        borderBottom: '1px solid var(--border)',
      }}>
        <h3 style={{
          margin: '0 0 5px',
          fontSize: 16,
          fontWeight: 900,
          color: 'var(--text-primary)',
        }}>
          Comparación de escenarios TOPSIS
        </h3>

        <p style={{
          margin: 0,
          fontSize: 12,
          color: 'var(--text-muted)',
        }}>
          Un movimiento positivo indica que el reporte recibe mayor prioridad
          cuando se busca reducir el rezago.
        </p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          minWidth: 920,
          borderCollapse: 'collapse',
        }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {[
                'Reporte',
                'Atención equilibrada',
                'Reducción del rezago',
                'Movimiento',
                'Explicación',
              ].map(titulo => (
                <th key={titulo} style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid var(--border)',
                  textAlign: 'left',
                  fontSize: 10,
                  fontWeight: 900,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  {titulo}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {comparacion.map(item => {
              const sube = item.movimiento > 0
              const baja = item.movimiento < 0
              const color = sube
                ? '#276749'
                : baja
                  ? '#9D2449'
                  : '#64748B'

              const simbolo = sube ? '↑' : baja ? '↓' : '→'
              const movimiento = Math.abs(item.movimiento)

              return (
                <tr key={item.id}>
                  <td style={{
                    padding: '13px 14px',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <div style={{
                      fontSize: 11,
                      fontFamily: 'monospace',
                      color: 'var(--primary)',
                      marginBottom: 3,
                    }}>
                      {item.folio}
                    </div>

                    <div style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                    }}>
                      {item.nombre_via}
                    </div>

                    <div style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                    }}>
                      {item.colonia}
                    </div>
                  </td>

                  <td style={{
                    padding: '13px 14px',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <strong>#{item.rank_equilibrado}</strong>
                    <div style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      marginTop: 3,
                    }}>
                      Score: {item.score_equilibrado}
                    </div>
                  </td>

                  <td style={{
                    padding: '13px 14px',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <strong>#{item.rank_rezago ?? '—'}</strong>
                    <div style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      marginTop: 3,
                    }}>
                      Score: {item.score_rezago ?? '—'}
                    </div>
                  </td>

                  <td style={{
                    padding: '13px 14px',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '4px 9px',
                      borderRadius: 99,
                      background: `${color}15`,
                      color,
                      fontSize: 12,
                      fontWeight: 900,
                    }}>
                      {simbolo} {movimiento}
                    </span>

                    <div style={{
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      marginTop: 5,
                    }}>
                      Score {item.diferencia_score > 0 ? '+' : ''}
                      {item.diferencia_score}
                    </div>
                  </td>

                  <td style={{
                    padding: '13px 14px',
                    borderBottom: '1px solid var(--border)',
                    maxWidth: 320,
                    fontSize: 12,
                    lineHeight: 1.5,
                    color: 'var(--text-secondary)',
                  }}>
                    {item.explicacion}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
// ── Tab: Recomendación IA ─────────────────────────────────────────────────────
function TabIA({ ranking, zonas }) {
  const [estado,  setEstado]  = useState('idle') // idle | cargando | listo | error
  const [result,  setResult]  = useState(null)
  const [errMsg,  setErrMsg]  = useState('')

  async function generar() {
    setEstado('cargando')
    setErrMsg('')
    try {
      const data = await api.post('/api/analisis/ia-recomendacion', { ranking, zonas })
      setResult(data)
      setEstado('listo')
    } catch (e) {
      setErrMsg(e.message || 'Error al conectar con la IA')
      setEstado('error')
    }
  }

  if (estado === 'idle') return (
    <div style={{ textAlign:'center', padding:'60px 20px', maxWidth:500, margin:'0 auto' }}>
      <div style={{ width:80, height:80, borderRadius:'50%', background:'var(--primary-light)',
        display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
        <Brain size={36} color="var(--primary)" />
      </div>
      <h3 style={{ fontSize:20, fontWeight:900, color:'var(--text-primary)', margin:'0 0 8px' }}>Recomendación estratégica con IA</h3>
      <p style={{ fontSize:13, color:'var(--text-muted)', margin:'0 0 24px', lineHeight:1.6 }}>
        GPT-4o analiza el ranking TOPSIS y genera una recomendación de intervención priorizada para los {ranking.length} baches activos.
      </p>
      <button onClick={generar} style={{
        background:'var(--primary)', color:'white', border:'none', borderRadius:10,
        padding:'14px 32px', fontSize:14, fontWeight:800, cursor:'pointer',
        display:'inline-flex', alignItems:'center', gap:10, textTransform:'uppercase', letterSpacing:'1px',
      }}>
        <Brain size={18} /> Generar recomendación
      </button>
    </div>
  )

  if (estado === 'cargando') return (
    <div style={{ textAlign:'center', padding:'60px 20px' }}>
      <div style={{ width:48, height:48, borderRadius:'50%', border:'4px solid var(--border)', borderTop:'4px solid var(--primary)',
        animation:'spin 0.8s linear infinite', margin:'0 auto 20px' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ fontWeight:700, color:'var(--text-primary)' }}>GPT-4o analizando {ranking.length} baches…</p>
      <p style={{ fontSize:12, color:'var(--text-muted)' }}>Esto puede tomar unos segundos</p>
    </div>
  )

  if (estado === 'error') return (
    <div style={{ textAlign:'center', padding:'60px 20px' }}>
      <p style={{ color:'#9D2449', fontWeight:700, marginBottom:12 }}>⚠️ {errMsg}</p>
      <button onClick={generar} style={{ background:'var(--primary)', color:'white', border:'none', borderRadius:8, padding:'10px 24px', fontWeight:700, cursor:'pointer' }}>
        Reintentar
      </button>
    </div>
  )

  const rec = result?.recomendacion ?? {}
  const urg = URG_CFG[rec.urgencia] ?? URG_CFG.media
  const int = INT_CFG[rec.tipo_intervencion] ?? INT_CFG.bacheo_focalizado

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, maxWidth:760 }}>

      {/* Decision principal */}
      <div style={{ background:'var(--primary)', borderRadius:14, padding:24, color:'white' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <Brain size={22} />
          <span style={{ fontSize:12, fontWeight:800, textTransform:'uppercase', letterSpacing:'1px', opacity:0.8 }}>Decisión estratégica · GPT-4o</span>
          <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
            <span style={{ fontSize:11, fontWeight:800, background:urg.bg, color:urg.color, padding:'2px 10px', borderRadius:99 }}>
              {urg.label}
            </span>
            <span style={{ fontSize:11, fontWeight:800, background:'rgba(255,255,255,0.2)', color:'white', padding:'2px 10px', borderRadius:99 }}>
              {int.icon} {int.label}
            </span>
          </div>
        </div>
        <p style={{ fontSize:17, fontWeight:700, lineHeight:1.5, margin:0 }}>{rec.decision_principal}</p>
      </div>

      {/* Orden de atención */}
      {rec.orden_atencion?.length > 0 && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:20 }}>
          <h4 style={{ fontSize:13, fontWeight:900, color:'var(--text-primary)', textTransform:'uppercase', letterSpacing:'1px', margin:'0 0 14px' }}>
            📋 Orden de atención recomendado
          </h4>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {rec.orden_atencion.map((item, i) => (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--primary)', color:'white',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:900, flexShrink:0 }}>
                  {i + 1}
                </div>
                <div>
                  <span style={{ fontSize:12, fontFamily:'monospace', color:'var(--primary)', fontWeight:700, background:'var(--primary-light)', padding:'1px 6px', borderRadius:4, marginRight:8 }}>
                    {item.folio}
                  </span>
                  <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{item.razon}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Justificacion */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:20 }}>
          <h4 style={{ fontSize:13, fontWeight:900, color:'var(--text-primary)', textTransform:'uppercase', letterSpacing:'1px', margin:'0 0 10px' }}>
            🧠 Justificación técnica
          </h4>
          <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6, margin:0 }}>{rec.justificacion}</p>
        </div>

        {/* Zonas críticas + advertencias */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {rec.zonas_criticas?.length > 0 && (
            <div style={{ background:'#FFF5F7', border:'1px solid #FEB2B2', borderRadius:12, padding:16 }}>
              <h4 style={{ fontSize:12, fontWeight:900, color:'#9D2449', textTransform:'uppercase', letterSpacing:'1px', margin:'0 0 8px' }}>📍 Zonas críticas</h4>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {rec.zonas_criticas.map((z, i) => (
                  <span key={i} style={{ background:'#9D2449', color:'white', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99 }}>{z}</span>
                ))}
              </div>
            </div>
          )}
          {rec.advertencias?.length > 0 && (
            <div style={{ background:'#FFFBEB', border:'1px solid #FCD34D', borderRadius:12, padding:16 }}>
              <h4 style={{ fontSize:12, fontWeight:900, color:'#92400E', textTransform:'uppercase', letterSpacing:'1px', margin:'0 0 8px' }}>⚠️ Advertencias</h4>
              {rec.advertencias.map((a, i) => (
                <p key={i} style={{ fontSize:12, color:'#92400E', margin:'0 0 4px', lineHeight:1.4 }}>• {a}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div style={{ display:'flex', gap:12, fontSize:11, color:'var(--text-muted)', alignItems:'center', paddingTop:4 }}>
        <span>Modelo: {result?.modelo}</span>
        {result?.tokens_usados > 0 && <span>Tokens: {result.tokens_usados}</span>}
        {result?.generado_at && <span>Generado: {new Date(result.generado_at).toLocaleTimeString('es-MX')}</span>}
        <button onClick={generar} style={{ marginLeft:'auto', background:'none', border:'1px solid var(--border)', borderRadius:6, padding:'4px 12px', cursor:'pointer', color:'var(--text-muted)', fontSize:11, display:'flex', alignItems:'center', gap:4 }}>
          <RefreshCw size={12} /> Regenerar
        </button>
      </div>
    </div>
  )
}

// ── Vista principal ───────────────────────────────────────────────────────────
export default function Priorizacion() {
  const [tab,     setTab]     = useState('ranking')
  const [ranking, setRanking] = useState([])
  const [zonas,   setZonas]   = useState([])
  const [meta,    setMeta]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [escenario, setEscenario] = useState('equilibrado')
  const [comparacion, setComparacion] = useState([])
  const [coloniasDisponibles, setColoniasDisponibles] = useState([])
  const [filtros, setFiltros] = useState({
    buscar: '',
    colonia: '',
    estado: '',
    severidad: '',
    dias_min: '',
  })
  const [filtrosAplicados, setFiltrosAplicados] = useState({})
  // Módulo DSS: presupuesto, reportes sin sustento y panel de explicación
  const [presupuesto, setPresupuesto] = useState('')
  const [presupuestoAplicado, setPresupuestoAplicado] = useState('')
  const [sinSustento, setSinSustento] = useState([])
  const [indicadores, setIndicadores] = useState([])
  const [filaExplicada, setFilaExplicada] = useState(null)

  const recalcularPresupuesto = () => {
    if (presupuesto === presupuestoAplicado) cargar()
    else setPresupuestoAplicado(presupuesto)
  }

  const aplicarFiltros = () => {
    setFiltrosAplicados({ ...filtros })
  }

  const limpiarFiltros = () => {
    const vacios = {
      buscar: '',
      colonia: '',
      estado: '',
      severidad: '',
      dias_min: '',
    }

    setFiltros(vacios)
    setFiltrosAplicados({})
  }

  const cargar = async () => {
    setLoading(true)
    setError(null)
    try {
      const parametros = new URLSearchParams()

      Object.entries(filtrosAplicados).forEach(([clave, valor]) => {
        if (valor !== '' && valor !== null && valor !== undefined) {
          parametros.set(clave, valor)
        }
      })

      if (presupuestoAplicado !== '') parametros.set('presupuesto', presupuestoAplicado)

      const filtrosQuery = parametros.toString()
      const sufijo = filtrosQuery ? `&${filtrosQuery}` : ''

      const [equilibradoData, rezagoData] = await Promise.all([
        api.get(`/api/analisis/topsis?escenario=equilibrado${sufijo}`),
        api.get(`/api/analisis/topsis?escenario=rezago${sufijo}`),
      ])

      const data = escenario === 'rezago'
        ? rezagoData
        : equilibradoData
      setRanking(data.ranking ?? [])
      setZonas(data.zonas ?? [])
      setMeta(data.meta ?? null)
      setSinSustento(data.sin_sustento ?? [])
      setIndicadores(data.indicadores ?? [])
      // Prellenar con el disponible del mes la primera vez
      if (presupuestoAplicado === '' && data.meta?.presupuesto_origen === 'presupuestos_mes') {
        setPresupuesto(String(data.meta.presupuesto))
      }
      setComparacion(construirComparacion(
        equilibradoData.ranking ?? [],
        rezagoData.ranking ?? []
      ))
    } catch (e) {
      setError(e.message || 'Error al cargar el análisis')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [escenario, filtrosAplicados, presupuestoAplicado])

  const totalCriticos = ranking.filter(r => r.topsis_score >= 70).length
  const scorePromedio = ranking.length
    ? (ranking.reduce((s, r) => s + r.topsis_score, 0) / ranking.length).toFixed(1)
    : '—'
  const zonasAlerta   = zonas.filter(z => z.criticos > 0).length

  const TABS = [
    { id:'ranking', label:'Ranking TOPSIS', icon:<BarChart2 size={15}/> },
    { id:'comparacion', label:'Comparar escenarios', icon:<BarChart2 size={15}/> },
    { id:'zonas',   label:'Por Zonas',      icon:<Map size={15}/> },
    { id:'ia',      label:'Recomendación IA', icon:<Brain size={15}/> },
    { id:'calidad', label:'Calidad de datos', icon:<Database size={15}/> },
  ]

  return (
    <div className="main-layout">
      <Sidebar />
      <div className="content-wrapper">
        <TopBar title="Priorización IA" />

        <main className="container-fluid" style={{ maxWidth: 1100 }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h1 style={{ fontSize: window.innerWidth <= 480 ? 20 : 24, fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Brain size={26} color="var(--primary)" />
                  <span className="hidden-mobile">Centro de Análisis y</span> Priorización
                </h1>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                  {meta?.escenarios?.[escenario]?.descripcion
                    ?? 'Calculando la configuración del escenario…'}
                </p>

                {meta?.pesos && (
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '5px 0 0' }}>
                    Pesos TOPSIS ·
                    Severidad {Math.round(meta.pesos.severidad * 100)} % ·
                    Tipo de vía {Math.round(meta.pesos.tipo_via * 100)} % ·
                    Días pendientes {Math.round(meta.pesos.dias_pendiente * 100)} % ·
                    Densidad zonal {Math.round(meta.pesos.densidad_zona * 100)} % ·
                    Score IA {Math.round(meta.pesos.score_ia * 100)} %
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
                <label style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  fontSize: 10,
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  Escenario

                  <select
                    value={escenario}
                    onChange={e => setEscenario(e.target.value)}
                    disabled={loading}
                    style={{
                      minWidth: 220,
                      padding: '9px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      background: 'var(--surface)',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: loading ? 'wait' : 'pointer',
                    }}
                  >
                    <option value="equilibrado">Atención equilibrada</option>
                    <option value="rezago">Reducción del rezago</option>
                  </select>
                </label>

                <button onClick={cargar} disabled={loading} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
                  border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)',
                  cursor: loading ? 'wait' : 'pointer', fontSize: 12, fontWeight: 700,
                  color: 'var(--text-secondary)',
                  opacity: loading ? 0.5 : 1,
                }}>
                  <RefreshCw
                    size={14}
                    style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }}
                  />
                  Recalcular
                </button>
              </div>
            </div>
          </div>

          {/* Filtros del análisis */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 18,
            marginBottom: 24,
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              marginBottom: 14,
            }}>
              <div>
                <h3 style={{
                  margin: '0 0 3px',
                  fontSize: 14,
                  fontWeight: 900,
                  color: 'var(--text-primary)',
                }}>
                  Filtros del análisis
                </h3>

                <p style={{
                  margin: 0,
                  fontSize: 11,
                  color: 'var(--text-muted)',
                }}>
                  Los filtros se aplican antes de calcular y normalizar TOPSIS.
                </p>
              </div>

              {Object.values(filtrosAplicados).some(valor => valor !== '') && (
                <span style={{
                  padding: '3px 9px',
                  borderRadius: 99,
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  fontSize: 10,
                  fontWeight: 900,
                }}>
                  FILTROS ACTIVOS
                </span>
              )}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 12,
            }}>
              <label style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                fontSize: 10,
                fontWeight: 800,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
              }}>
                Folio, calle o dirección

                <input
                  type="text"
                  value={filtros.buscar}
                  onChange={e => setFiltros({
                    ...filtros,
                    buscar: e.target.value,
                  })}
                  onKeyDown={e => {
                    if (e.key === 'Enter') aplicarFiltros()
                  }}
                  placeholder="Ej. Avenida"
                  style={{
                    padding: '9px 10px',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                  }}
                />
              </label>

              <label style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                fontSize: 10,
                fontWeight: 800,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
              }}>
                Colonia

                <select
                  value={filtros.colonia}
                  onChange={e => setFiltros({
                    ...filtros,
                    colonia: e.target.value,
                  })}
                  style={{
                    padding: '9px 10px',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="">Todas</option>

                  {coloniasDisponibles.map(colonia => (
                    <option key={colonia} value={colonia}>
                      {colonia}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                fontSize: 10,
                fontWeight: 800,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
              }}>
                Estado

                <select
                  value={filtros.estado}
                  onChange={e => setFiltros({
                    ...filtros,
                    estado: e.target.value,
                  })}
                  style={{
                    padding: '9px 10px',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="">Todos</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="validado">Validado</option>
                  <option value="asignado">Asignado</option>
                  <option value="en_proceso">En proceso</option>
                </select>
              </label>

              <label style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                fontSize: 10,
                fontWeight: 800,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
              }}>
                Severidad

                <select
                  value={filtros.severidad}
                  onChange={e => setFiltros({
                    ...filtros,
                    severidad: e.target.value,
                  })}
                  style={{
                    padding: '9px 10px',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="">Todas</option>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </label>

              <label style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                fontSize: 10,
                fontWeight: 800,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
              }}>
                Días mínimos pendientes

                <input
                  type="number"
                  min="0"
                  max="3650"
                  value={filtros.dias_min}
                  onChange={e => setFiltros({
                    ...filtros,
                    dias_min: e.target.value,
                  })}
                  placeholder="Ej. 30"
                  style={{
                    padding: '9px 10px',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                  }}
                />
              </label>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              marginTop: 14,
              flexWrap: 'wrap',
            }}>
              <button
                type="button"
                onClick={limpiarFiltros}
                disabled={loading}
                style={{
                  padding: '9px 16px',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: loading ? 'wait' : 'pointer',
                }}
              >
                Limpiar
              </button>

              <button
                type="button"
                onClick={aplicarFiltros}
                disabled={loading}
                style={{
                  padding: '9px 18px',
                  border: 'none',
                  borderRadius: 8,
                  background: 'var(--primary)',
                  color: 'white',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: loading ? 'wait' : 'pointer',
                }}
              >
                Aplicar filtros
              </button>
            </div>
          </div>
          {/* KPIs */}
          {!loading && !error && (
            <div className="grid-4" style={{ marginBottom: 28 }}>
              {[
                { label: 'Baches activos', val: ranking.length, icon: <AlertTriangle size={20} />, color: 'var(--primary)' },
                { label: 'Críticos TOPSIS', val: totalCriticos, icon: <Zap size={20} />, color: '#C05621' },
                { label: 'Zonas en alerta', val: zonasAlerta, icon: <MapPin size={20} />, color: '#B7791F' },
                { label: 'Score promedio', val: scorePromedio, icon: <BarChart2 size={20} />, color: '#2B6CB0' },
              ].map(({ label, val, icon, color }) => (
                <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
                    <span style={{ color }}>{icon}</span>
                  </div>
                  <span style={{ fontSize: 30, fontWeight: 900, color }}>{val}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--border)', paddingBottom: 0, overflowX: 'auto', whiteSpace: 'nowrap' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
                border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                color: tab === t.id ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: tab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: '-2px', transition: 'all 0.15s', textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                {t.icon} {t.label}
                {t.id === 'ranking' && ranking.length > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 900, background: 'var(--primary)', color: 'white', padding: '1px 6px', borderRadius: 99, marginLeft: 2 }}>
                    {ranking.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          {/* La pestaña de calidad de datos (módulo DSS) carga sus propios datos, independiente de TOPSIS */}
          {tab === 'calidad' && <TabCalidadDatos />}

          {tab !== 'calidad' && loading && (
            <div style={{ textAlign:'center', padding:'60px 20px' }}>
              <div style={{ width:40, height:40, borderRadius:'50%', border:'4px solid var(--border)', borderTop:'4px solid var(--primary)', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ color:'var(--text-muted)', fontWeight:700 }}>Calculando TOPSIS…</p>
            </div>
          )}

          {tab !== 'calidad' && error && (
            <div style={{ background:'#FFF5F7', border:'1px solid #FEB2B2', borderRadius:12, padding:24, textAlign:'center' }}>
              <p style={{ color:'#9D2449', fontWeight:700, margin:'0 0 12px' }}>⚠️ {error}</p>
              <button onClick={cargar} style={{ background:'var(--primary)', color:'white', border:'none', borderRadius:8, padding:'10px 24px', fontWeight:700, cursor:'pointer' }}>
                Reintentar
              </button>
            </div>
          )}

          {tab === 'ranking' && !error && <AvisoEtl meta={meta} onEjecutado={cargar} />}
          {tab === 'ranking' && !error && !loading && <IndicadoresPanel indicadores={indicadores} />}
          {tab === 'ranking' && !error && (
            <ResumenPresupuesto
              meta={meta}
              presupuesto={presupuesto}
              setPresupuesto={setPresupuesto}
              onRecalcular={recalcularPresupuesto}
              loading={loading}
            />
          )}
          {!loading && !error && tab === 'ranking' && <TabRanking ranking={ranking} onAsignar={r => window.location.href = `/reportes/${r.id}`} onExplicar={setFilaExplicada} />}
          {!loading && !error && tab === 'ranking' && <SinSustento lista={sinSustento} />}
          {filaExplicada && <PanelExplicacion fila={filaExplicada} onCerrar={() => setFilaExplicada(null)} />}
          {!loading && !error && tab === 'comparacion' && <TabComparacion comparacion={comparacion} />}
          {!loading && !error && tab === 'zonas'   && <TabZonas zonas={zonas} />}
          {!loading && !error && tab === 'ia'       && <TabIA key={escenario} ranking={ranking} zonas={zonas} />}
        </main>
      </div>
    </div>
  )
}
