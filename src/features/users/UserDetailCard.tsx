import { useEffect, useRef, useState } from 'react'
import type { UserDTO } from '../../types/users'
import { useAuth } from '../auth/AuthContext'
import { getUserPictureUrl } from '../../api/usersApi'
import { HideDetailButton } from '../../components/HideDetailButton'
import { formatDate } from '../../utils/date'
import '../../styles/common.css'

interface UserDetailCardProps {
  user: UserDTO
  onBack?: () => void
  onEdit?: (user: UserDTO) => void
  onToggleActive?: (user: UserDTO) => void
  onManageInstruments?: (user: UserDTO) => void
  onManageRoles?: (user: UserDTO) => void
  showButtons?: boolean
  // Solo se usan desde ProfilePage. Si no se pasan, la tarjeta es de solo lectura.
  onPictureFileSelected?: (file: File) => void
  pictureUploading?: boolean
  pictureError?: string | null
}

/**
 * UserDetailCard — Tarjeta de detalle de usuario.
 *
 * Muestra información completa y opcionalmente botones de acciones
 * delegadas al contenedor.
 */
export function UserDetailCard({
  user,
  onBack,
  onManageInstruments,
  onManageRoles,
  showButtons = true,
  onPictureFileSelected,
  pictureUploading = false,
  pictureError = null,
}: UserDetailCardProps) {
  const { token } = useAuth()
  const [pictureUrl, setPictureUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!token || user.id == null) return
    let cancelled = false
    getUserPictureUrl(user.id, token)
      .then((url) => { if (!cancelled) setPictureUrl(url) })
      .catch(() => { if (!cancelled) setPictureUrl(null) }) // p.ej. 501 en local: sin foto, sin error visible
    return () => { cancelled = true }
  }, [user.id, token])

  const fullLastName = [user.lastName, user.secondLastName].filter(Boolean).join(' ')

  const instrumentsList =
    user.instruments && user.instruments.length > 0
      ? [...user.instruments]
          .sort((a: any, b: any) => {
            const na = (a?.instrumentName ?? String(a)).toString().toLowerCase()
            const nb = (b?.instrumentName ?? String(b)).toString().toLowerCase()
            return na.localeCompare(nb)
          })
          .map((inst: any) =>
            inst && inst.instrumentName
              ? `${inst.instrumentName}${inst.voice ? ' ' + inst.voice : ''}`
              : String(inst),
          )
          .join(', ')
      : null

  return (
    <div className="card" style={{ marginTop: '1rem' }}>
      {/* Header */}
      <div className="user-detail-header">
        {showButtons && onBack && (
          <div className="user-detail-header__close-row">
            <HideDetailButton onClick={onBack} />
          </div>
        )}

        <div className="user-detail-header__identity">
            <div
              style={{
                width: 56, height: 56, borderRadius: '50%', overflow: 'hidden',
                background: 'var(--color-gray-200)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              {pictureUrl ? (
                <img
                  src={pictureUrl}
                  alt="Foto de perfil"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={() => setPictureUrl(null)}
                />
              ) : (
                <span style={{ fontSize: '1.2rem', color: 'var(--color-gray-500)' }}>
                  {user.firstName?.[0]?.toUpperCase() ?? '?'}
                </span>
              )}
            </div>            
            {onPictureFileSelected && (
              <>
                <button
                  type="button"
                  className="button-secondary"
                  style={{ padding: '0.3rem 0.75rem', fontSize: '0.85rem' }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={pictureUploading}
                >
                  {pictureUploading ? 'Subiendo...' : 'Cambiar foto'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) onPictureFileSelected(file)
                    e.target.value = ''
                  }}
                />
              </>
            )}

        </div>
        <div className="section-title user-detail-header__title">
          Detalle de usuario
        </div>        
      </div>
      {onPictureFileSelected && pictureError && (
        <p className="error-message" style={{ marginBottom: 'var(--space-4)' }}>{pictureError}</p>
      )}

      {/* Sección: Identidad */}
      <div className="detail-section">
        <div className="detail-grid">
          <div className="detail-field">
            <span className="detail-field__label">Username</span>
            <span className="detail-field__value">{user.username}</span>
          </div>
          <div className="detail-field">
            <span className="detail-field__label">Nombre</span>
            <span className="detail-field__value">{user.firstName}</span>
          </div>
          <div className="detail-field">
            <span className="detail-field__label">Apellidos</span>
            <span className="detail-field__value">
              {fullLastName || <span className="detail-field__value--empty">-</span>}
            </span>
          </div>
          <div className="detail-field">
            <span className="detail-field__label">Email</span>
            <span className="detail-field__value">{user.email}</span>
          </div>
          <div className="detail-field">
            <span className="detail-field__label">Teléfono</span>
            <span className="detail-field__value">{user.phone || <span className="detail-field__value--empty">-</span>}</span>
          </div>
          <div className="detail-field">
            <span className="detail-field__label">Fecha nacimiento</span>
            <span className="detail-field__value">
              {formatDate(user.birthDate) !== '-' ? formatDate(user.birthDate) : <span className="detail-field__value--empty">-</span>}
            </span>
          </div>
          <div className="detail-field detail-field--full">
            <span className="detail-field__label">Instrumentos</span>
            <span className="detail-field__value">
              {instrumentsList || <span className="detail-field__value--empty">Sin instrumentos asignados</span>}
            </span>
          </div>
        </div>
      </div>

      {/* Sección: Banda */}
      <div className="detail-section">
        <div className="detail-grid">
          <div className="detail-field">
            <span className="detail-field__label">Alta en banda</span>
            <span className="detail-field__value">
              {formatDate(user.bandJoinDate) !== '-' ? formatDate(user.bandJoinDate) : <span className="detail-field__value--empty">-</span>}
            </span>
          </div>
          <div className="detail-field">
            <span className="detail-field__label">Alta en sistema</span>
            <span className="detail-field__value">
              {formatDate(user.systemSignupDate) !== '-' ? formatDate(user.systemSignupDate) : <span className="detail-field__value--empty">-</span>}
            </span>
          </div>
          <div className="detail-field">
            <span className="detail-field__label">Estado</span>
            <span className="detail-field__value">
              <span className={user.active ? 'badge badge--success' : 'badge badge--neutral'}>
                {user.active ? 'Activo' : 'Inactivo'}
              </span>
            </span>
          </div>
          <div className="detail-field">
            <span className="detail-field__label">Roles</span>
            <span className="detail-field__value">
              {(user.roles ?? []).join(', ') || <span className="detail-field__value--empty">Sin roles</span>}
            </span>
          </div>
        </div>
      </div>

      {/* Sección: Notas */}
      <div className="detail-section">
        <div className="detail-grid">
          <div className="detail-field detail-field--full">
            <span className="detail-field__label">Notas</span>
            <span className="detail-field__value">
              {user.notes || <span className="detail-field__value--empty">Sin notas</span>}
            </span>
          </div>
        </div>
      </div>

      {showButtons && (
        <div className="button-row" style={{ marginTop: 'var(--space-5)' }}>
          {onManageInstruments && (
            <button
              type="button"
              className="button-secondary"
              onClick={() => onManageInstruments(user)}
            >
              Instrumentos
            </button>
          )}
          {onManageRoles && (
            <button
              type="button"
              className="button-secondary"
              onClick={() => onManageRoles(user)}
            >
              Roles
            </button>
          )}
        </div>
      )}
    </div>
  )
}
