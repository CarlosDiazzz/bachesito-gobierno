import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import Badge from '../components/Badge'
import { mockPresupuestos } from '../data/mockData'

const conceptos = ['Bacheo de emergencia', 'Mantenimiento rutinario', 'Pavimentación nueva', 'Bacheo preventivo', 'Obras complementarias']
const dependencias = ['Secretaría de Infraestructura', 'Ayuntamiento Oaxaca de Juárez', 'SIOP Oaxaca', 'Obras Públicas Municipal', 'SINFRA']
const tipos = [
  { label: 'Inversión', color: 'var(--primary)', bg: 'var(--primary-light)' },
  { label: 'Mantenimiento', color: 'var(--success)', bg: 'var(--success-light)' },
  { label: 'Inversión', color: 'var(--primary)', bg: 'var(--primary-light)' },
  { label: 'Mantenimiento', color: 'var(--success)', bg: 'var(--success-light)' },
  { label: 'Obra nueva', color: 'var(--purple)', bg: 'var(--purple-light)' },
]

const totalAsignado = mockPresupuestos.reduce((s, m) => s + m.asignado, 0)
const totalEjercido = mockPresupuestos.reduce((s, m) => s + m.ejercido, 0)
const pctEjercido = Math.round((totalEjercido / totalAsignado) * 100)

export default function Presupuestos() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <div style={{ marginLeft: '240px', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Presupuestos" />
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Top stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { label: 'Presupuesto Total 2026', value: 3200000, color: 'var(--primary)' },
              { label: 'Ejercido',               value: 1840000, color: 'var(--success)', sub: '57.5% del total' },
              { label: 'Disponible',             value: 1360000, color: 'var(--warning)', sub: '42.5% restante' },
            ].map(({ label, value, color, sub }) => (
              <div key={label} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '20px', borderTop: `4px solid ${color}` }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{label}</div>
                <div style={{ fontSize: '26px', fontWeight: 700, color }}>${value.toLocaleString('es-MX')}</div>
                {sub && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{sub}</div>}
              </div>
            ))}
          </div>

          {/* Main chart */}
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Presupuesto por mes 2026</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={mockPresupuestos} barCategoryGap="30%">
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => `$${v.toLocaleString('es-MX')}`} />
                <Bar dataKey="asignado" name="Asignado" fill="#0098D466" radius={[4,4,0,0]} />
                <Bar dataKey="ejercido"  name="Ejercido"  fill="#0098D4"   radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detalle por mes */}
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Detalle por mes</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead style={{ background: 'var(--surface-2)' }}>
                <tr style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                  {['Mes','Concepto','Tipo','Monto','Dependencia'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockPresupuestos.map((m, i) => (
                  <tr key={m.mes} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{m.mes}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{conceptos[i]}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <Badge label={tipos[i].label} color={tipos[i].color} bgColor={tipos[i].bg} />
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>${m.ejercido.toLocaleString('es-MX')}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '12px' }}>{dependencias[i]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary box */}
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Municipio de Oaxaca de Juárez — Secretaría de Infraestructura Vial</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Resumen de ejercicio presupuestal 2026</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <span>Asignado: <strong>${totalAsignado.toLocaleString('es-MX')}</strong></span>
              <span>Ejercido: <strong>${totalEjercido.toLocaleString('es-MX')}</strong> ({pctEjercido}%)</span>
            </div>
            <div style={{ height: '16px', background: 'var(--surface-2)', borderRadius: '8px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${pctEjercido}%`, background: 'var(--success)', transition: 'width 0.5s' }} />
              <div style={{ flex: 1, background: 'var(--primary)', opacity: 0.3 }} />
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--success)', borderRadius: '2px' }} /> Ejercido
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--primary)', opacity: 0.3, borderRadius: '2px' }} /> Disponible
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
