import type { UserDTO } from '../types/users'
import { formatDate } from '../utils/date'
import '../styles/common.css'

interface UserDetailCardProps {
  user: UserDTO
  onBack?: () => void
  onEdit?: (user: UserDTO) => void
  onManageInstruments?: (user: UserDTO) => void
  onManageRoles?: (user: UserDTO) => void
  showButtons?: boolean
}

export function UserDetailCard({
  user,
  onBack,
  onEdit,
  onManageInstruments,
  onManageRoles,
  showButtons = true,
}: UserDetailCardProps) {
  return (
    <div className="card" style={{ marginTop: '1rem' }}>
      <div className="section-title">Detalle de usuario</div>
      <div className="detail-grid">
        <div className="detail-item">
          <span className="detail-label">Username</span>
          <span className="detail-value">{user.username}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Nombre</span>
          <span className="detail-value">{user.firstName}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Apellidos</span>
          <span className="detail-value">
            {[user.lastName, user.secondLastName].filter(Boolean).join(' ')}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Email</span>
          <span className="detail-value">{user.email}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Activo</span>
          <span className="detail-value">{user.active ? 'Sí' : 'No'}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Roles</span>
          <span className="detail-value">
            {(user.roles ?? []).join(', ') || '-'}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Instrumentos</span>
          <span className="detail-value">
            {user.instruments && user.instruments.length > 0
              ? [...user.instruments]
                  .sort((a: any, b: any) => {
                    const na = (a?.instrumentName ?? String(a))
                      .toString()
                      .toLowerCase()
                    const nb = (b?.instrumentName ?? String(b))
                      .toString()
                      .toLowerCase()
                    return na.localeCompare(nb)
                  })
                  .map((inst: any) =>
                    inst && inst.instrumentName
                      ? `${inst.instrumentName}${inst.voice ? ' ' + inst.voice : ''}`
                      : String(inst),
                  )
                  .join(', ')
              : '-'}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Fecha nacimiento</span>
          <span className="detail-value">{formatDate(user.birthDate)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Alta en banda</span>
          <span className="detail-value">{formatDate(user.bandJoinDate)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Alta en sistema</span>
          <span className="detail-value">
            {formatDate(user.systemSignupDate)}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Teléfono</span>
          <span className="detail-value">{user.phone || '-'}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Notas</span>
          <span className="detail-value">{user.notes || '-'}</span>
        </div>
      </div>

      {showButtons && (
        <div className="button-row-1rem">
          {onBack && (
            <button
              type="button"
              className="button-subtle"
              onClick={onBack}
            >
              Volver a la lista
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              className="button-secondary"
              onClick={() => onEdit(user)}
            >
              Editar
            </button>
          )}
          {onManageInstruments && (
            <button
              type="button"
              className="button-primary"
              onClick={() => onManageInstruments(user)}
            >
              Gestionar instrumentos
            </button>
          )}
          {onManageRoles && (
            <button
              type="button"
              className="button-primary"
              onClick={() => onManageRoles(user)}
            >
              Gestionar roles
            </button>
          )}
        </div>
      )}
    </div>
  )
}
