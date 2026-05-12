import { useState } from 'react'
import { User, Lock, Mail, Phone, MapPin, Building2, Save, ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showPasswords, setShowPasswords] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    municipio: user?.municipio || '',
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const sectionStyle = {
    background: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    marginBottom: '24px'
  }

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 800,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '8px'
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    background: 'var(--bg)',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit'
  }

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    })
  }

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    })
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(profileData),
      })

      const data = await response.json()
      if (response.ok) {
        setMessage({ type: 'success', text: 'Perfil actualizado exitosamente' })
      } else {
        setMessage({ type: 'error', text: data.message || 'Error al actualizar el perfil' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error de conexión' })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Las nuevas contraseñas no coinciden' })
      return
    }

    if (passwordData.newPassword.length < 12) {
      setMessage({ type: 'error', text: 'La contraseña debe tener mínimo 12 caracteres' })
      return
    }

    setLoading(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        setMessage({ type: 'success', text: 'Contraseña cambiada exitosamente' })
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      } else {
        setMessage({ type: 'error', text: data.message || 'Error al cambiar la contraseña' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error de conexión' })
    } finally {
      setLoading(false)
    }
  }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'AD'

  return (
    <div className="main-layout">
      <Sidebar />
      <div className="content-wrapper">
        <TopBar title="Mi Perfil" />
        
        <div className="container-fluid">
          <button 
            onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '8px', fontWeight: 600, fontSize: '14px', padding: 0 }}
          >
            <ArrowLeft size={18} /> Volver
          </button>

          {/* Message */}
          {message && (
            <div style={{
              padding: '14px 16px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${message.type === 'success' ? '#22c55e' : '#ef4444'}`
            }}>
              {message.type === 'success' ? <CheckCircle size={18} color="#22c55e" /> : <AlertCircle size={18} color="#ef4444" />}
              <span style={{ color: message.type === 'success' ? '#22c55e' : '#ef4444', fontWeight: 600, fontSize: '13px' }}>
                {message.text}
              </span>
            </div>
          )}

          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--primary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Tu Perfil de Usuario
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Gestiona tu información personal y contraseña de acceso
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth <= 1024 ? '1fr' : '350px 1fr', gap: '24px', alignItems: 'start' }}>
            
            {/* Avatar Section */}
            <div style={{ ...sectionStyle, textAlign: 'center', marginBottom: 0 }}>
              <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'var(--primary)', fontSize: '48px', border: '4px solid var(--primary)', margin: '0 auto 16px' }}>
                {initials}
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>{user?.name}</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'capitalize', fontWeight: 600 }}>
                {user?.roles?.[0] || 'Usuario'}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Personal Information Section */}
              <div style={{ ...sectionStyle, marginBottom: 0 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <User size={18} color="var(--primary)" /> Información Personal
                </h3>
                
                <form onSubmit={handleSaveProfile} style={{ display: 'grid', gridTemplateColumns: window.innerWidth <= 600 ? '1fr' : '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={labelStyle}>Nombre Completo</label>
                    <input
                      type="text"
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      style={inputStyle}
                      placeholder="Ej: Juan Pérez"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Correo Institucional</label>
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      style={inputStyle}
                      placeholder="correo@bachesito.gob.mx"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Teléfono de Contacto</label>
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      style={inputStyle}
                      placeholder="+52 (951) 516-0000"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Municipio</label>
                    <input
                      type="text"
                      name="municipio"
                      value={profileData.municipio}
                      disabled
                      style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      gridColumn: window.innerWidth <= 600 ? 'auto' : '1 / -1',
                      padding: '12px 20px',
                      background: loading ? 'var(--surface-2)' : 'var(--primary)',
                      color: loading ? 'var(--text-muted)' : 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Save size={16} /> {loading ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </form>
              </div>

              {/* Security Section */}
              <div style={{ ...sectionStyle, marginBottom: 0 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Lock size={18} color="var(--primary)" /> Seguridad y Contraseña
                </h3>
                
                <form onSubmit={handleChangePassword} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                  <div>
                    <label style={labelStyle}>Contraseña Actual</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        style={inputStyle}
                        placeholder="Ingresa tu contraseña actual"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      >
                        {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth <= 600 ? '1fr' : '1fr 1fr', gap: '20px' }}>
                    <div>
                      <label style={labelStyle}>Nueva Contraseña</label>
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        style={inputStyle}
                        placeholder="Mínimo 12 caracteres"
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Confirmar Contraseña</label>
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        style={inputStyle}
                        placeholder="Repite la nueva"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !passwordData.currentPassword || !passwordData.newPassword}
                    style={{
                      padding: '12px 20px',
                      background: loading || !passwordData.currentPassword || !passwordData.newPassword ? 'var(--surface-2)' : 'var(--primary)',
                      color: loading || !passwordData.currentPassword || !passwordData.newPassword ? 'var(--text-muted)' : 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: loading || !passwordData.currentPassword || !passwordData.newPassword ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Lock size={16} /> {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '24px' }}>
            Municipio de Oaxaca de Juárez · Sistema de Gestión Vial · 2026
          </div>
        </div>
      </div>
    </div>
  )
}
