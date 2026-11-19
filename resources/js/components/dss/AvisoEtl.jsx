// Módulo DSS (Proyecto Integrador DSTD): aviso cuando hay reportes posteriores al último ETL.
import { useState } from 'react'
import { AlertTriangle, Play, RefreshCw } from 'lucide-react'
import { api } from '../../lib/api'

export default function AvisoEtl({ meta, onEjecutado }) {
  const [ejecutando, setEjecutando] = useState(false)
  const [error, setError] = useState(null)

  if (!meta?.etl_desactualizado) return null

  const ejecutar = async () => {
    setEjecutando(true)
    setError(null)
    try {
      await api.post('/api/dss/etl/ejecutar', {})
      onEjecutado?.()
    } catch (e) {
      setError(e.message || 'El ETL falló')
    } finally {
      setEjecutando(false)
    }
  }

  const n = meta.reportes_nuevos_desde_etl

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap',
      background:'#FEF3C7', border:'1px solid #FCD34D', borderRadius:12, padding:'12px 14px', marginBottom:16 }}>
      <div style={{ display:'flex', gap:10, alignItems:'flex-start', minWidth:0, flex:1 }}>
        <AlertTriangle size={16} color="#92400E" style={{ flexShrink:0, marginTop:1 }}/>
        <div>
          <p style={{ margin:0, fontSize:12, fontWeight:800, color:'#92400E' }}>
            Hay {n} reporte{n === 1 ? '' : 's'} nuevo{n === 1 ? '' : 's'} desde el último ETL
          </p>
          <p style={{ margin:'2px 0 0', fontSize:11, color:'#92400E' }}>
            El ranking usa la ejecución #{meta.ejecucion_etl_id}. Los reportes creados o modificados después no están incluidos.
            {error && <strong> {error}</strong>}
          </p>
        </div>
      </div>
      <button onClick={ejecutar} disabled={ejecutando} style={{
        display:'flex', alignItems:'center', gap:6, padding:'9px 16px', border:'none', borderRadius:8,
        background:'var(--primary)', color:'white', fontSize:11, fontWeight:800,
        cursor: ejecutando ? 'wait' : 'pointer', opacity: ejecutando ? 0.6 : 1,
      }}>
        {ejecutando ? <RefreshCw size={13} style={{ animation:'spin 0.8s linear infinite' }}/> : <Play size={13}/>}
        {ejecutando ? 'Ejecutando…' : 'Ejecutar ETL'}
      </button>
    </div>
  )
}
