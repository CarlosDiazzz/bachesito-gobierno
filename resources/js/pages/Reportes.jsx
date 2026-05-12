import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Download, Plus } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import Badge from '../components/Badge'
import { api } from '../lib/api'
import { PRIORIDAD_COLOR, ESTADO_COLOR, ESTADO_LABEL } from '../data/mockData'

const PRIO_LABEL = { critica: 'Crítica', alta: 'Alta', media: 'Media', baja: 'Baja' }
const PRIO_BG    = { critica: '#FEE8EB', alta: '#FEF3E8', media: '#FEFAE8', baja: '#EDF7E8' }

function formatFecha(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Reportes() {
  const navigate = useNavigate()
  const [reportes,  setReportes]  = useState([])
  const [meta,      setMeta]      = useState({ total: 0, last_page: 1, current_page: 1 })
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [priFilter, setPri]       = useState('')
  const [estFilter, setEst]       = useState('')
  const [selected,  setSelected]  = useState(new Set())
  const [page,      setPage]      = useState(1)

  const fetchReportes = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, per_page: 20 })
      if (search)    params.set('search',    search)
      if (priFilter) params.set('prioridad', priFilter)
      if (estFilter) params.set('estado',    estFilter)
      const data = await api.get(`/api/reportes?${params}`)
      setReportes(data.data)
      setMeta(data.meta)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [search, priFilter, estFilter, page])

  useEffect(() => { setPage(1) }, [search, priFilter, estFilter])
  useEffect(() => { fetchReportes() }, [fetchReportes])

  function toggleRow(id) {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }
  function toggleAll() {
    setSelected(prev => prev.size === reportes.length ? new Set() : new Set(reportes.map(r => r.id)))
  }

  const counts = {
    pendientes: reportes.filter(r => r.estado === 'pendiente').length,
    en_proceso: reportes.filter(r => r.estado === 'en_proceso').length,
    resueltos:  reportes.filter(r => r.estado === 'resuelto').length,
    rechazados: reportes.filter(r => r.estado === 'rechazado').length,
  }

  return (
    <div className="main-layout">
      <Sidebar />
      <div className="content-wrapper">
        <TopBar title="Gestión de Reportes" />
        <div className="container-fluid">

          {/* Controls */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por folio, vía o colonia..."
                style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', background: 'var(--surface)', color: 'var(--text-primary)', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', width: window.innerWidth <= 768 ? '100%' : 'auto' }}>
              <select value={priFilter} onChange={e => setPri(e.target.value)} style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', background: 'var(--surface)', cursor: 'pointer' }}>
                <option value="">Prioridad: Todas</option>
                <option value="critica">Crítica</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
              <select value={estFilter} onChange={e => setEst(e.target.value)} style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', background: 'var(--surface)', cursor: 'pointer' }}>
                <option value="">Estado: Todos</option>
                {Object.entries(ESTADO_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px', width: window.innerWidth <= 768 ? '100%' : 'auto' }}>
              <button onClick={() => navigate('/reportes/nuevo')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 16px', borderRadius: '6px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                <Plus size={15} /> Nuevo
              </button>
              <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 16px', borderRadius: '6px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                <Download size={15} /> Exportar
              </button>
            </div>
          </div>

          {/* Mini stats */}
          <div className="grid-4">
            {[
              { label: 'Pendientes', count: counts.pendientes, color: 'var(--estado-pendiente)' },
              { label: 'En Proceso', count: counts.en_proceso, color: 'var(--estado-en-proceso)' },
              { label: 'Resueltos',  count: counts.resueltos,  color: 'var(--estado-resuelto)' },
              { label: 'Rechazados', count: counts.rechazados, color: 'var(--estado-rechazado)' },
            ].map(({ label, count, color }) => (
              <div key={label} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '12px 16px', boxShadow: 'var(--shadow-sm)', borderTop: `3px solid ${color}` }}>
                <div style={{ fontSize: '22px', fontWeight: 700, color }}>{count}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead style={{ background: 'var(--surface-2)' }}>
                  <tr style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 12px', width: '32px' }}>
                      <input type="checkbox" onChange={toggleAll} checked={selected.size === reportes.length && reportes.length > 0} readOnly />
                    </th>
                    {['Folio','Vía','Colonia','Prioridad','Estado','Score','Fecha','Acciones'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? <tr><td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando...</td></tr>
                    : reportes.length === 0
                    ? <tr><td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Sin reportes</td></tr>
                    : reportes.map(r => (
                      <tr key={r.id}
                        style={{ borderBottom: '1px solid var(--border)', background: selected.has(r.id) ? 'var(--primary-light)' : 'transparent', transition: 'background 0.1s' }}
                        onMouseEnter={e => { if (!selected.has(r.id)) e.currentTarget.style.background = 'var(--surface-2)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = selected.has(r.id) ? 'var(--primary-light)' : 'transparent' }}
                      >
                        <td style={{ padding: '10px 12px' }}><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleRow(r.id)} /></td>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>{r.folio}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 500 }}>{r.nombre_via}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{r.colonia}</td>
                        <td style={{ padding: '10px 12px' }}><Badge label={PRIO_LABEL[r.prioridad]} color={PRIORIDAD_COLOR[r.prioridad]} bgColor={PRIO_BG[r.prioridad]} /></td>
                        <td style={{ padding: '10px 12px' }}><Badge label={ESTADO_LABEL[r.estado]} color={ESTADO_COLOR[r.estado]} bgColor={`${ESTADO_COLOR[r.estado]}22`} /></td>
                        <td style={{ padding: '10px 12px', fontWeight: 700 }}>{r.score_prioridad}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '12px' }}>{formatFecha(r.fecha_reporte)}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <button onClick={() => navigate(`/reportes/${r.id}`)} style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--primary)', color: 'var(--primary)', background: 'transparent', cursor: 'pointer' }}>Ver</button>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {meta.last_page > 1 && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>{meta.total} reportes total</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid var(--border)', background: 'transparent', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}>← Anterior</button>
                  <span style={{ padding: '4px 10px', color: 'var(--text-secondary)' }}>{page} / {meta.last_page}</span>
                  <button disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)} style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid var(--border)', background: 'transparent', cursor: page >= meta.last_page ? 'not-allowed' : 'pointer', opacity: page >= meta.last_page ? 0.5 : 1 }}>Siguiente →</button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
