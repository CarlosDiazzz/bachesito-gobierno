import React from 'react'
import { Phone, Share2, MessageCircle, Info, Globe } from 'lucide-react'

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--surface-2)',
      borderTop: '8px solid var(--accent)',
      padding: '40px 24px 20px',
      color: 'var(--text-secondary)',
      fontSize: '14px',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '40px',
      }}>
        {/* Institutional branding */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <img 
              src="/images/logo.png" 
              alt="Logo Institucional" 
              style={{ width: '64px', height: '64px', objectFit: 'contain' }} 
            />
            <div>
              <div style={{ fontWeight: 900, fontSize: '13px', color: 'var(--accent)', letterSpacing: '2px', textTransform: 'uppercase' }}>
                Atención Ciudadana
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', marginTop: '2px', textTransform: 'uppercase' }}>
                OAXACA DE JUÁREZ
              </div>
            </div>
          </div>
          <p style={{ lineHeight: 1.6, fontSize: '13px', color: 'var(--text-muted)', maxWidth: '320px' }}>
            Plataforma oficial para la gestión integral de baches. 
            Comprometidos con la seguridad vial y la modernización de nuestra capital.
          </p>
        </div>

        {/* Emergency 911 Card - Redesigned with Ovals */}
        <div style={{
          background: 'var(--surface)',
          color: 'var(--primary)',
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          border: '1px solid var(--border)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Phone size={20} color="var(--primary)" style={{ marginBottom: '12px' }} />
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            {['9', '1', '1'].map((num, i) => (
              <div key={i} style={{
                width: '44px', height: '64px', borderRadius: '22px',
                background: 'var(--primary)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', fontWeight: 900, boxShadow: 'var(--shadow-sm)',
                border: '2px solid var(--accent)'
              }}>
                {num}
              </div>
            ))}
          </div>

          <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--primary)' }}>
            EMERGENCIAS
          </div>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>Servicio disponible las 24 horas</p>
        </div>

        {/* Social & Links */}
        <div>
          <h4 style={{ fontWeight: 700, marginBottom: '16px', color: 'var(--primary)', fontSize: '15px' }}>
            SÍGUENOS
          </h4>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            {[Share2, MessageCircle, Info, Globe].map((Icon, i) => (
              <a key={i} href="#" style={{ 
                width: '36px', height: '36px', borderRadius: '50%', 
                background: 'white', display: 'flex', alignItems: 'center', 
                justifyContent: 'center', color: 'var(--primary)',
                boxShadow: 'var(--shadow-sm)', transition: 'transform 0.2s'
              }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                 onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <Icon size={18} />
              </a>
            ))}
          </div>
          <a href="#" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '13px', textDecoration: 'underline' }}>
            Aviso de Privacidad
          </a>
        </div>
      </div>

      <div style={{ 
        maxWidth: '1200px', 
        margin: '40px auto 0', 
        paddingTop: '20px', 
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11px',
        color: 'var(--text-muted)'
      }}>
        <div>© 2026 Municipio de Oaxaca de Juárez · HackaTec</div>
        <div>Gobierno del Estado de Oaxaca</div>
      </div>
    </footer>
  )
}
