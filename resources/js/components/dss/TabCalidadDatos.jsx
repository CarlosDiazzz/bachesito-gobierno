// Módulo DSS (Proyecto Integrador DSTD): pestaña de ETL y calidad de datos.
import { useState, useEffect, useCallback } from 'react'
import { Database, CheckCircle, XCircle, AlertTriangle, Percent, RefreshCw, Play } from 'lucide-react'
import { api } from '../../lib/api'

const TIPO_LABEL = {
  duplicado:              'Duplicado',
  coordenada_fuera_rango: 'Coordenada fuera de rango',
  tipo_via_faltante:      'Tipo de vía faltante',
  sin_analisis_ia:        'Sin análisis IA suficiente',
  fecha_invalida:         'Fecha inválida',
  campo_faltante:         'Campo faltante',
}

const ACCION_CFG = {
  descartado: { label:'Descartado', bg:'#FEE2E2', color:'#991B1B' },
  fusionado:  { label:'Fusionado',  bg:'#E0E7FF', color:'#3730A3' },
  imputado:   { label:'Imputado',   bg:'#FEF3C7', color:'#92400E' },
  marcado:    { label:'Marcado',    bg:'#ECFDF5', color:'#065F46' },
}

const SEV_CFG = {
  error:       { label:'Error',       color:'#9D2449' },
  advertencia: { label:'Advertencia', color:'#B7791F' },
}

const selectStyle = {
  padding:'9px 10px', border:'1px solid var(--border)', borderRadius:8,
  background:'var(--surface)', color:'var(--text-primary)', fontSize:12,
}

const labelStyle = {
  display:'flex', flexDirection:'column', gap:5, fontSize:10, fontWeight:800,
  color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px',
}

function formatoFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-MX', { dateStyle:'medium', timeStyle:'short' })
}

export default function TabCalidadDatos() {
  const [ejecucion,  setEjecucion]  = useState(null)
  const [cargando,   setCargando]   = useState(true)
  const [ejecutando, setEjecutando] = useState(false)
  const [error,      setError]      = useState(null)

  const [anomalias,  setAnomalias]  = useState([])
  const [paginacion, setPaginacion] = useState(null)
  const [pagina,     setPagina]     = useState(1)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroSev,  setFiltroSev]  = useState('')
  const [cargandoTabla, setCargandoTabla] = useState(false)

  const cargarUltima = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const data = await api.get('/api/dss/etl/ultima')
      setEjecucion(data.ejecucion)
    } catch (e) {
      setError(e.message || 'No se pudo cargar la última ejecución del ETL')
    } finally {
      setCargando(false)
    }
  }, [])

  const cargarAnomalias = useCallback(async () => {
    if (!ejecucion) return
    setCargandoTabla(true)
    try {
      const params = new URLSearchParams({ ejecucion_id: ejecucion.id, page: pagina })
      if (filtroTipo) params.set('tipo', filtroTipo)
      if (filtroSev)  params.set('severidad', filtroSev)
      const data = await api.get(`/api/dss/etl/anomalias?${params}`)
      setAnomalias(data.data ?? [])
      setPaginacion({ actual: data.current_page, ultima: data.last_page, total: data.total })
    } catch (e) {
      setError(e.message || 'No se pudieron cargar las anomalías')
    } finally {
      setCargandoTabla(false)
    }
  }, [ejecucion, pagina, filtroTipo, filtroSev])

  useEffect(() => { cargarUltima() }, [cargarUltima])
  useEffect(() => { cargarAnomalias() }, [cargarAnomalias])

  const ejecutarEtl = async () => {
    setEjecutando(true)
    setError(null)
    try {
      const data = await api.post('/api/dss/etl/ejecutar', {})
      setPagina(1)
      setEjecucion(data.ejecucion)
    } catch (e) {
      setError(e.message || 'El ETL falló')
      cargarUltima()
    } finally {
      setEjecutando(false)
    }
  }

  const botonEjecutar = (
    <button onClick={ejecutarEtl} disabled={ejecutando} style={{
      display:'flex', alignItems:'center', gap:6, padding:'10px 18px', border:'none',
      borderRadius:8, background:'var(--primary)', color:'white', fontSize:12, fontWeight:800,
      cursor: ejecutando ? 'wait' : 'pointer', opacity: ejecutando ? 0.6 : 1,
    }}>
      {ejecutando
        ? <RefreshCw size={14} style={{ animation:'spin 0.8s linear infinite' }} />
        : <Play size={14} />}
      {ejecutando ? 'Ejecutando…' : 'Ejecutar ETL'}
    </button>
  )

  if (cargando) return (
    <div style={{ textAlign:'center', padding:'60px 20px' }}>
      <div style={{ width:40, height:40, borderRadius:'50%', border:'4px solid var(--border)', borderTop:'4px solid var(--primary)', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color:'var(--text-muted)', fontWeight:700 }}>Cargando calidad de datos…</p>
    </div>
  )

  // Estado vacío: el ETL nunca se ha corrido
  if (!ejecucion) return (
    <div style={{ background:'var(--surface)', border:'1px dashed var(--border)', borderRadius:12, padding:'48px 24px', textAlign:'center' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Database size={44} color="var(--text-muted)" style={{ marginBottom:12 }} />
      <p style={{ fontSize:16, fontWeight:900, color:'var(--text-primary)', margin:'0 0 6px' }}>
        Aún no se ha ejecutado el proceso ETL
      </p>
      <p style={{ fontSize:13, color:'var(--text-muted)', margin:'0 auto 20px', maxWidth:460 }}>
        El ETL revisa los reportes activos, descarta coordenadas y fechas inválidas, fusiona duplicados
        e imputa datos faltantes. Ejecútalo para ver los indicadores de calidad.
      </p>
      {error && <p style={{ color:'#9D2449', fontWeight:700, fontSize:12 }}>⚠️ {error}</p>}
      <div style={{ display:'flex', justifyContent:'center' }}>{botonEjecutar}</div>
    </div>
  )

  const conteo = ejecucion.anomalias_por_tipo ?? {}
  const maxConteo = Math.max(...Object.values(conteo), 1)
  const tasa = ejecucion.tasa_calidad
  const colorTasa = tasa === null ? 'var(--text-muted)' : tasa >= 85 ? '#276749' : tasa >= 60 ? '#B7791F' : '#9D2449'

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, minWidth:0, maxWidth:'100%' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Encabezado */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        <div>
          <h3 style={{ margin:'0 0 3px', fontSize:14, fontWeight:900, color:'var(--text-primary)' }}>
            Proceso ETL y calidad de datos
          </h3>
          <p style={{ margin:0, fontSize:11, color:'var(--text-muted)' }}>
            Última ejecución #{ejecucion.id}: {formatoFecha(ejecucion.finalizado_at ?? ejecucion.iniciado_at)}
            {ejecucion.ejecutado_por ? ` · por ${ejecucion.ejecutado_por}` : ' · desde consola'}
            {ejecucion.estado !== 'completado' && (
              <span style={{ marginLeft:8, padding:'1px 8px', borderRadius:99, fontWeight:900,
                background: ejecucion.estado === 'fallido' ? '#FEE2E2' : '#FEF3C7',
                color: ejecucion.estado === 'fallido' ? '#991B1B' : '#92400E' }}>
                {ejecucion.estado.toUpperCase().replace('_', ' ')}
              </span>
            )}
          </p>
        </div>
        {botonEjecutar}
      </div>

      {error && (
        <div style={{ background:'#FFF5F7', border:'1px solid #FEB2B2', borderRadius:12, padding:14 }}>
          <p style={{ color:'#9D2449', fontWeight:700, margin:0, fontSize:12 }}>⚠️ {error}</p>
        </div>
      )}
      {ejecucion.estado === 'fallido' && ejecucion.mensaje_error && (
        <div style={{ background:'#FFF5F7', border:'1px solid #FEB2B2', borderRadius:12, padding:14 }}>
          <p style={{ color:'#9D2449', fontWeight:700, margin:0, fontSize:12 }}>Error del ETL: {ejecucion.mensaje_error}</p>
        </div>
      )}

      {/* Tarjetas */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:12 }}>
        {[
          { label:'Leídos',          val:ejecucion.registros_leidos,          icon:<Database size={18}/>,      color:'#2B6CB0' },
          { label:'Cargados',        val:ejecucion.registros_cargados,        icon:<CheckCircle size={18}/>,   color:'#276749' },
          { label:'Descartados',     val:ejecucion.registros_descartados,     icon:<XCircle size={18}/>,       color:'#9D2449' },
          { label:'Con advertencia', val:ejecucion.registros_con_advertencia, icon:<AlertTriangle size={18}/>, color:'#B7791F' },
          { label:'Tasa de calidad', val: tasa === null ? '—' : `${tasa} %`,  icon:<Percent size={18}/>,       color:colorTasa },
        ].map(({ label, val, icon, color }) => (
          <div key={label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:18 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</span>
              <span style={{ color }}>{icon}</span>
            </div>
            <span style={{ fontSize:28, fontWeight:900, color }}>{val}</span>
          </div>
        ))}
      </div>
      <p style={{ margin:'-8px 0 0', fontSize:11, color:'var(--text-muted)' }}>
        Tasa de calidad = cargados / leídos × 100. Los reportes fusionados como duplicados no cuentan como cargados ni como descartados.
      </p>

      {/* Conteo por tipo */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:18 }}>
        <h3 style={{ margin:'0 0 14px', fontSize:13, fontWeight:900, color:'var(--text-primary)' }}>Anomalías por tipo</h3>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {Object.entries(TIPO_LABEL).map(([tipo, label]) => {
            const val = conteo[tipo] ?? 0
            return (
              <button key={tipo} type="button"
                onClick={() => { setFiltroTipo(filtroTipo === tipo ? '' : tipo); setPagina(1) }}
                style={{ display:'flex', alignItems:'center', gap:10, background:'none', border:'none', padding:0, cursor:'pointer', textAlign:'left' }}>
                <span style={{ fontSize:11, fontWeight:700, minWidth:190,
                  color: filtroTipo === tipo ? 'var(--primary)' : 'var(--text-secondary)' }}>{label}</span>
                <div style={{ flex:1, height:6, background:'#F1F5F9', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ width:`${(val / maxConteo) * 100}%`, height:'100%', background:'var(--primary)', borderRadius:99, transition:'width 0.6s' }} />
                </div>
                <span style={{ fontSize:13, fontWeight:900, color:'var(--text-primary)', minWidth:28, textAlign:'right' }}>{val}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tabla de anomalías: la tarjeta nunca se desborda; la tabla tiene su propio scroll horizontal */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:18, minWidth:0, maxWidth:'100%', overflow:'hidden' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:12, flexWrap:'wrap', marginBottom:14 }}>
          <h3 style={{ margin:0, fontSize:13, fontWeight:900, color:'var(--text-primary)' }}>
            Detalle de anomalías {paginacion ? `(${paginacion.total})` : ''}
          </h3>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <label style={labelStyle}>
              Tipo
              <select value={filtroTipo} onChange={e => { setFiltroTipo(e.target.value); setPagina(1) }} style={selectStyle}>
                <option value="">Todos</option>
                {Object.entries(TIPO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label style={labelStyle}>
              Severidad
              <select value={filtroSev} onChange={e => { setFiltroSev(e.target.value); setPagina(1) }} style={selectStyle}>
                <option value="">Todas</option>
                <option value="error">Error</option>
                <option value="advertencia">Advertencia</option>
              </select>
            </label>
          </div>
        </div>

        {anomalias.length === 0 && !cargandoTabla ? (
          <p style={{ textAlign:'center', padding:'30px 0', color:'var(--text-muted)', fontWeight:700, margin:0 }}>
            {filtroTipo || filtroSev ? 'No hay anomalías con esos filtros' : '✅ Esta ejecución no registró anomalías'}
          </p>
        ) : (
          <div style={{ width:'100%', maxWidth:'100%', overflowX:'auto', WebkitOverflowScrolling:'touch', opacity: cargandoTabla ? 0.5 : 1 }}>
            <table style={{ width:'100%', minWidth:860, borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr>
                  {['Folio', 'Tipo', 'Campo', 'Valor original', 'Acción', 'Regla aplicada'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'8px 10px', borderBottom:'2px solid var(--border)',
                      fontSize:10, fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {anomalias.map(a => {
                  const accion = ACCION_CFG[a.accion_tomada] ?? {}
                  const sev = SEV_CFG[a.severidad] ?? {}
                  return (
                    <tr key={a.id} style={{ borderBottom:'1px solid var(--border)' }}>
                      <td style={{ padding:'10px', fontWeight:800, color:'var(--text-primary)', whiteSpace:'nowrap' }}>
                        <span title={sev.label} style={{ display:'inline-block', width:8, height:8, borderRadius:99, background:sev.color, marginRight:6 }} />
                        {a.folio ?? '—'}
                      </td>
                      <td style={{ padding:'10px', color:'var(--text-secondary)', whiteSpace:'nowrap' }}>{TIPO_LABEL[a.tipo_anomalia] ?? a.tipo_anomalia}</td>
                      <td style={{ padding:'10px', color:'var(--text-muted)', fontFamily:'monospace', fontSize:11, maxWidth:160, overflowWrap:'anywhere' }}>{a.campo ?? '—'}</td>
                      <td style={{ padding:'10px', color:'var(--text-secondary)', fontFamily:'monospace', fontSize:11, maxWidth:200, overflowWrap:'anywhere' }}>{a.valor_original ?? <em>nulo</em>}</td>
                      <td style={{ padding:'10px' }}>
                        <span style={{ padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:900, background:accion.bg, color:accion.color, whiteSpace:'nowrap' }}>
                          {accion.label ?? a.accion_tomada}
                        </span>
                      </td>
                      <td style={{ padding:'10px', color:'var(--text-secondary)', minWidth:280, whiteSpace:'normal', overflowWrap:'anywhere', lineHeight:1.45 }}>{a.regla_aplicada}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {paginacion && paginacion.ultima > 1 && (
          <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', gap:8, marginTop:14 }}>
            <button disabled={pagina <= 1} onClick={() => setPagina(p => p - 1)} style={{ ...selectStyle, cursor:'pointer', fontWeight:700, opacity: pagina <= 1 ? 0.4 : 1 }}>Anterior</button>
            <span style={{ fontSize:12, color:'var(--text-muted)', fontWeight:700 }}>{paginacion.actual} / {paginacion.ultima}</span>
            <button disabled={pagina >= paginacion.ultima} onClick={() => setPagina(p => p + 1)} style={{ ...selectStyle, cursor:'pointer', fontWeight:700, opacity: pagina >= paginacion.ultima ? 0.4 : 1 }}>Siguiente</button>
          </div>
        )}
      </div>
    </div>
  )
}
