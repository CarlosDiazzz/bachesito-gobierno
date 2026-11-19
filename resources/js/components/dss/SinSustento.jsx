// Módulo DSS (Proyecto Integrador DSTD): reportes excluidos del TOPSIS por datos insuficientes.
import { useNavigate } from 'react-router-dom'
import { HelpCircle } from 'lucide-react'

export default function SinSustento({ lista }) {
  const navigate = useNavigate()
  if (!lista?.length) return null

  return (
    <div style={{ background:'var(--surface)', border:'1px dashed var(--border)', borderRadius:12, padding:18, marginTop:20 }}>
      <h3 style={{ margin:'0 0 3px', fontSize:14, fontWeight:900, color:'var(--text-primary)', display:'flex', alignItems:'center', gap:8 }}>
        <HelpCircle size={16} color="#B7791F"/> Sin sustento para recomendar ({lista.length})
      </h3>
      <p style={{ margin:'0 0 12px', fontSize:11, color:'var(--text-muted)' }}>
        Estos reportes no entran al cálculo TOPSIS porque el ETL detectó datos insuficientes. Incluirlos distorsionaría la normalización.
        Requieren revisión o un nuevo análisis IA.
      </p>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {lista.map(r => (
          <div key={r.id} style={{ display:'flex', gap:12, alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap',
            borderLeft:'3px solid #B7791F', background:'#FFFBEB', borderRadius:8, padding:'10px 12px' }}>
            <div style={{ minWidth:0, flex:1 }}>
              <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:3 }}>
                <span style={{ fontSize:11, fontFamily:'monospace', color:'var(--text-muted)', background:'#F1F5F9', padding:'1px 6px', borderRadius:4 }}>{r.folio}</span>
                <span style={{ fontSize:12, fontWeight:800, color:'var(--text-primary)' }}>{r.nombre_via ?? '—'}</span>
                <span style={{ fontSize:11, color:'var(--text-muted)' }}>{r.colonia}</span>
              </div>
              <p style={{ margin:0, fontSize:11, color:'#92400E' }}>{r.motivo}</p>
            </div>
            <button onClick={() => navigate(`/reportes/${r.id}`)} style={{ fontSize:11, fontWeight:700, padding:'5px 12px', borderRadius:6,
              border:'1px solid var(--border)', background:'var(--surface)', cursor:'pointer', color:'var(--text-secondary)' }}>
              Ver detalle
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
