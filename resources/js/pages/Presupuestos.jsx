import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import Badge from '../components/Badge'
import { api } from '../lib/api'

const TIPO_BADGE = {
  asignado:     { color: 'var(--primary)',  bg: 'var(--primary-light)' },
  ejercido:     { color: 'var(--success)',  bg: 'var(--success-light)' },
  comprometido: { color: 'var(--warning)',  bg: 'var(--warning-light)' },
  disponible:   { color: 'var(--purple)',   bg: 'var(--purple-light)'  },
}

export default function Presupuestos() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const anio = new Date().getFullYear()

  useEffect(() => {
    api.get(`/api/presupuestos?anio=${anio}`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [anio])

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
        <Sidebar />
        <div style={{ marginLeft: '260px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid var(--border)', borderTop: '4px solid var(--primary)', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  const resumen     = data?.resumen     ?? { total: 0, ejercido: 0, disponible: 0, porcentaje: 0 }
  const porMes      = data?.por_mes     ?? []
  const movimientos = data?.movimientos ?? []
  const pct         = resumen.porcentaje

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <div style={{ marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Presupuestos" />
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Top stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { label: `Presupuesto Total ${anio}`, value: resumen.total,      color: 'var(--primary)', sub: null },
              { label: 'Ejercido',                   value: resumen.ejercido,   color: 'var(--success)', sub: `${pct}% del total` },
              { label: 'Disponible',                 value: resumen.disponible, color: 'var(--warning)', sub: `${(100 - pct).toFixed(1)}% restante` },
            ].map(({ label, value, color, sub }) => (
              <div key={label} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '20px', borderTop: `4px solid ${color}` }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{label}</div>
                <div style={{ fontSize: '26px', fontWeight: 700, color }}>${Number(value).toLocaleString('es-MX')}</div>
                {sub && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{sub}</div>}
              </div>
            ))}
          </div>

          {/* Chart */}
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Presupuesto por mes {anio}</h3>
            {porMes.length === 0
              ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0' }}>Sin datos de presupuesto para {anio}</p>
              : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={porMes} barCategoryGap="30%">
                    <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={v => `$${Number(v).toLocaleString('es-MX')}`} />
                    <Bar dataKey="asignado" name="Asignado" fill="#0098D466" radius={[4,4,0,0]} />
                    <Bar dataKey="ejercido"  name="Ejercido"  fill="#0098D4"   radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </div>

          {/* Movimientos */}
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Detalle de movimientos</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead style={{ background: 'var(--surface-2)' }}>
                <tr style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                  {['Mes','Concepto','Tipo','Monto','Dependencia'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movimientos.length === 0
                  ? <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Sin movimientos registrados</td></tr>
                  : movimientos.map(m => {
                    const badge = TIPO_BADGE[m.tipo] ?? { color: 'var(--text-muted)', bg: 'var(--surface-2)' }
                    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
                    return (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{m.mes ? meses[m.mes - 1] : '—'}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{m.concepto}</td>
                        <td style={{ padding: '10px 12px' }}><Badge label={m.tipo} color={badge.color} bgColor={badge.bg} /></td>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>${Number(m.monto).toLocaleString('es-MX')}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '12px' }}>{m.dependencia ?? '—'}</td>
                      </tr>
                    )
                  })
                }
              </tbody>
            </table>
          </div>

          {/* Summary bar */}
          {(resumen.total > 0) && (
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Municipio de Oaxaca de Juárez — Secretaría de Infraestructura Vial</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Resumen de ejercicio presupuestal {anio}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                <span>Asignado: <strong>${Number(resumen.total).toLocaleString('es-MX')}</strong></span>
                <span>Ejercido: <strong>${Number(resumen.ejercido).toLocaleString('es-MX')}</strong> ({pct}%)</span>
              </div>
              <div style={{ height: '16px', background: 'var(--surface-2)', borderRadius: '8px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${pct}%`, background: 'var(--success)', transition: 'width 0.5s' }} />
                <div style={{ flex: 1, background: 'var(--primary)', opacity: 0.3 }} />
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--success)', borderRadius: '2px' }} /> Ejercido</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--primary)', opacity: 0.3, borderRadius: '2px' }} /> Disponible</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
