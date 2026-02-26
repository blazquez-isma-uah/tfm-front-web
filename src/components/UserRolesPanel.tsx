import type { FormEvent } from 'react'
import type { UserDTO } from '../types/users'
import type { KeycloakRoleResponse } from '../types/roles'
import '../styles/common.css'
import { SaveIcon, CancelIcon } from './Icons'

/**
 * UserRolesPanel — Panel para gestionar los roles asignados a un usuario.
 *
 * RESPONSABILIDAD: Renderizar la lista de roles disponibles con checkboxes
 * que reflejan los roles actualmente asignados al usuario seleccionado.
 *
 * NOTA SOBRE EL ORIGEN DE LOS ROLES:
 * Los roles disponibles (roles: KeycloakRoleResponse[]) se cargan una sola
 * vez al montar UsersPage (en el useEffect de roles). No se vuelven a cargar
 * al abrir este panel porque los roles del sistema raramente cambian durante
 * una sesión. Pasarlos como prop evita una llamada a la API redundante.
 *
 * Los roles actuales del usuario (selectedRoleNames) sí se calculan en
 * UsersPage al abrir el panel, desde user.roles que viene del servidor.
 */

interface UserRolesPanelProps {
  selectedUser: UserDTO
  roles: KeycloakRoleResponse[]
  selectedRoleNames: string[]
  onToggleRole: (roleName: string) => void
  onSubmit: (e: FormEvent) => void
  onCancel: () => void
  saving: boolean
}

export function UserRolesPanel({
  selectedUser,
  roles,
  selectedRoleNames,
  onToggleRole,
  onSubmit,
  onCancel,
  saving,
}: UserRolesPanelProps) {
  return (
    <form onSubmit={onSubmit} className="form-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div className="section-title" style={{ margin: 0 }}>
          Roles de {selectedUser.firstName} {selectedUser.lastName}{selectedUser.secondLastName ? ` ${selectedUser.secondLastName}` : ''} ({selectedUser.username})
        </div>
        <div className="actions-container" style={{ marginLeft: 'auto' }}>
          <span className="tooltip-wrap" data-tooltip="Guardar roles">
            <button type="submit" className="btn-icon btn-icon-edit"
              aria-label="Guardar roles" disabled={saving}>
              <SaveIcon />
            </button>
          </span>
          <span className="tooltip-wrap" data-tooltip="Cancelar">
            <button type="button" className="btn-icon btn-icon-neutral"
              aria-label="Cancelar" onClick={onCancel} disabled={saving}>
              <CancelIcon />
            </button>
          </span>
        </div>
      </div>

      <div className="checkbox-group" style={{ marginTop: '1rem' }}>
        {roles.map(role => (
          <label key={role.id} className="checkbox-label">
            <input
              type="checkbox"
              checked={selectedRoleNames.includes(role.name)}
              onChange={() => onToggleRole(role.name)}
            />
            <span>{role.name}</span>
          </label>
        ))}
        {roles.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            No hay roles definidos en el sistema.
          </p>
        )}
      </div>

    </form>
  )
}