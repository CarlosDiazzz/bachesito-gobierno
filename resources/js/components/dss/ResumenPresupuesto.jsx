// Módulo DSS (Proyecto Integrador DSTD): presupuesto y resumen de la recomendación.
import { Wallet, CheckCircle, PiggyBank, ListChecks, RefreshCw, AlertTriangle, Database } from 'lucide-react'

export const dinero = v => v === null || v === undefined
  ? '—'
  : `$${Number(v).toLocaleString('es-MX', { maximumFractionDigits: 2 })}`

function Aviso({ icon, color, bg, borde, children }) {
  return (
    <div style={{ display:'flex', gap:10, alignItems:'flex-start', background:bg, border:`1px solid ${borde}`, borderRadius:12, padding:'12px 14px' }}>
      <span style={{ color, flexShrink:0, marginTop:1 }}>{icon}</span>
      <p style={{ margin:0, fontSize:12, fontWeight:700, color, lineHeight:1.45 }}>{children}</p>
    </div>
  )
}

export default function ResumenPresupuesto({ meta, presupuesto, setPresupuesto, onRecalcular, loading }) {
  const etl = meta?.fuente === 'dss_reportes_limpios'

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:20 }}>
      {meta && !etl && (
        <Aviso icon={<AlertTriangle size={16}/>} color="#92400E" bg="#FEF3C7" borde="#FCD34D">
          {meta.aviso_fuente}
        </Aviso>
      )}
      {meta && etl && (
        <p style={{ margin:0, fontSize:11, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:6 }}>
          <Database size={13}/>
          Ranking calculado con datos limpios del ETL (ejecución #{meta.ejecucion_etl_id},{' '}
          {meta.ejecucion_etl_at ? new Date(meta.ejecucion_etl_at).toLocaleString('es-MX', { dateStyle:'medium', timeStyle:'short' }) : '—'}).
          {meta.num_sin_sustento > 0 && ` ${meta.num_sin_sustento} reporte(s) sin sustento quedaron fuera del cálculo.`}
        </p>
      )}

      {/* Presupuesto */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:18 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:12, flexWrap:'wrap', marginBottom:14 }}>
          <div>
            <h3 style={{ margin:'0 0 3px', fontSize:14, fontWeight:900, color:'var(--text-primary)' }}>Recomendación por presupuesto</h3>
            <p style={{ margin:0, fontSize:11, color:'var(--text-muted)' }}>
              Se recorre el ranking en orden y se recomienda cada bache cuyo costo estimado aún cabe en el saldo.
              {meta?.presupuesto_origen === 'presupuestos_mes' && ' Monto prellenado con el disponible del mes.'}
            </p>
          </div>
          <form
            onSubmit={e => { e.preventDefault(); onRecalcular() }}
            style={{ display:'flex', alignItems:'flex-end', gap:8 }}
          >
            <label style={{ display:'flex', flexDirection:'column', gap:5, fontSize:10, fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>
              Presupuesto (MXN)
              <input
                type="number" min="0" step="100"
                value={presupuesto}
                onChange={e => setPresupuesto(e.target.value)}
                placeholder="Ej. 50000"
                style={{ width:160, padding:'9px 10px', border:'1px solid var(--border)', borderRadius:8, background:'var(--surface)', color:'var(--text-primary)', fontWeight:700 }}
              />
            </label>
            <button type="submit" disabled={loading} style={{
              display:'flex', alignItems:'center', gap:6, padding:'10px 16px', border:'none', borderRadius:8,
              background:'var(--primary)', color:'white', fontSize:11, fontWeight:800, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1,
            }}>
              <RefreshCw size={13} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }}/> Recalcular
            </button>
          </form>
        </div>

        {meta?.aviso_presupuesto ? (
          <Aviso icon={<Wallet size={16}/>} color="#92400E" bg="#FEF3C7" borde="#FCD34D">
            {meta.aviso_presupuesto}
          </Aviso>
        ) : meta && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:10 }}>
            {[
              { label:'Presupuesto',             val:dinero(meta.presupuesto),        icon:<Wallet size={16}/>,      color:'#2B6CB0' },
              { label:'Comprometido en recom.',  val:dinero(meta.costo_recomendados), icon:<CheckCircle size={16}/>, color:'var(--primary)' },
              { label:'Saldo',                   val:dinero(meta.saldo_restante),     icon:<PiggyBank size={16}/>,   color:'#276749' },
              { label:'Recomendados',            val:`${meta.num_recomendados} / ${meta.num_recomendados + meta.num_en_espera}`, icon:<ListChecks size={16}/>, color:'#C05621' },
            ].map(({ label, val, icon, color }) => (
              <div key={label} style={{ background:'#F8FAFC', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</span>
                  <span style={{ color }}>{icon}</span>
                </div>
                <span style={{ fontSize:20, fontWeight:900, color }}>{val}</span>
              </div>
            ))}
          </div>
        )}
        {meta?.parametros_costo && (
          <p style={{ margin:'10px 0 0', fontSize:10, color:'var(--text-muted)' }}>
            Costo por bache = área × {dinero(meta.parametros_costo.costo_m2)}/m² + {dinero(meta.parametros_costo.costo_fijo_movilizacion)} de movilización
            (área supuesta {meta.parametros_costo.area_default_m2} m² si la IA no la estimó). Valores supuestos, no oficiales.
          </p>
        )}
      </div>
    </div>
  )
}
