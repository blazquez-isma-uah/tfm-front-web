import type { UserDTO } from '../types/users'
import { XMarkIcon } from './Icons'
import { formatDate } from '../utils/date'
import '../styles/common.css'

interface UserDetailCardProps {
  user: UserDTO
  onBack?: () => void
  onEdit?: (user: UserDTO) => void
  onToggleActive?: (user: UserDTO) => void
  onManageInstruments?: (user: UserDTO) => void
  onManageRoles?: (user: UserDTO) => void
  showButtons?: boolean
  backButtonLabel?: string
}

export function UserDetailCard({
  user,
  onBack,
  onManageInstruments,
  onManageRoles,
  showButtons = true,
}: UserDetailCardProps) {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <div className="section-title" style={{ marginBottom: 0 }}>Detalle de usuario</div>
        {showButtons && onBack && (
          <button type="button" className="button-secondary" onClick={onBack}>
            <XMarkIcon /> Ocultar
          </button>
        )}
      </div>

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
