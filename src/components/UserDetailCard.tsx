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

const badgeActive: React.CSSProperties = {
  background: 'var(--color-success-light)',
  color: 'var(--color-success-dark)',
  padding: '2px 8px',
  borderRadius: 'var(--radius-full)',
  fontSize: 'var(--font-size-xs)',
  fontWeight: 'var(--font-weight-medium)',
}

const badgeInactive: React.CSSProperties = {
  background: 'var(--color-gray-100)',
  color: 'var(--color-gray-600)',
  padding: '2px 8px',
  borderRadius: 'var(--radius-full)',
  fontSize: 'var(--font-size-xs)',
  fontWeight: 'var(--font-weight-medium)',
}

const mutedValue: React.CSSProperties = {
  color: 'var(--text-muted)',
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

      {/* Grupo: Identidad */}
      <div className="detail-section-divider">Identidad</div>
      <dl className="dashboard-card__body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-2) var(--space-4)' }}>
        <div className="dashboard-card__pair">
          <dt className="dashboard-card__term">Username</dt>
          <dd className="dashboard-card__value">{user.username || <span style={mutedValue}>-</span>}</dd>
        </div>
        <div className="dashboard-card__pair">
          <dt className="dashboard-card__term">Nombre</dt>
          <dd className="dashboard-card__value">{user.firstName || <span style={mutedValue}>-</span>}</dd>
        </div>
        <div className="dashboard-card__pair">
          <dt className="dashboard-card__term">Apellidos</dt>
          <dd className="dashboard-card__value">{fullLastName || <span style={mutedValue}>-</span>}</dd>
        </div>
        <div className="dashboard-card__pair">
          <dt className="dashboard-card__term">Email</dt>
          <dd className="dashboard-card__value">{user.email || <span style={mutedValue}>-</span>}</dd>
        </div>
      </dl>

      {/* Grupo: Estado */}
      <div className="detail-section-divider">Estado</div>
      <dl className="dashboard-card__body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-2) var(--space-4)' }}>
        <div className="dashboard-card__pair">
          <dt className="dashboard-card__term">Activo</dt>
          <dd className="dashboard-card__value">
            <span style={user.active ? badgeActive : badgeInactive}>
              {user.active ? 'Activo' : 'Inactivo'}
            </span>
          </dd>
        </div>
        <div className="dashboard-card__pair">
          <dt className="dashboard-card__term">Roles</dt>
          <dd className="dashboard-card__value">
            {(user.roles ?? []).join(', ') || <span style={mutedValue}>-</span>}
          </dd>
        </div>
      </dl>

      {/* Grupo: Banda */}
      <div className="detail-section-divider">Banda</div>
      <dl className="dashboard-card__body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-2) var(--space-4)' }}>
        <div className="dashboard-card__pair">
          <dt className="dashboard-card__term">Alta en banda</dt>
          <dd className="dashboard-card__value">{formatDate(user.bandJoinDate) !== '-' ? formatDate(user.bandJoinDate) : <span style={mutedValue}>-</span>}</dd>
        </div>
        <div className="dashboard-card__pair">
          <dt className="dashboard-card__term">Alta en sistema</dt>
          <dd className="dashboard-card__value">{formatDate(user.systemSignupDate) !== '-' ? formatDate(user.systemSignupDate) : <span style={mutedValue}>-</span>}</dd>
        </div>
        <div className="dashboard-card__pair" style={{ gridColumn: '1 / -1' }}>
          <dt className="dashboard-card__term">Instrumentos</dt>
          <dd className="dashboard-card__value">{instrumentsList ?? <span style={mutedValue}>-</span>}</dd>
        </div>
      </dl>

      {/* Grupo: Personal */}
      <div className="detail-section-divider">Personal</div>
      <dl className="dashboard-card__body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-2) var(--space-4)' }}>
        <div className="dashboard-card__pair">
          <dt className="dashboard-card__term">Fecha nacimiento</dt>
          <dd className="dashboard-card__value">{formatDate(user.birthDate) !== '-' ? formatDate(user.birthDate) : <span style={mutedValue}>-</span>}</dd>
        </div>
        <div className="dashboard-card__pair">
          <dt className="dashboard-card__term">Teléfono</dt>
          <dd className="dashboard-card__value">{user.phone || <span style={mutedValue}>-</span>}</dd>
        </div>
      </dl>

      {/* Grupo: Notas */}
      <div className="detail-section-divider">Notas</div>
      <dl className="dashboard-card__body">
        <div className="dashboard-card__pair" style={{ gridTemplateColumns: '1fr' }}>
          <dd className="dashboard-card__value" style={user.notes ? { fontStyle: 'italic' } : mutedValue}>
            {user.notes || 'Sin notas'}
          </dd>
        </div>
      </dl>

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
