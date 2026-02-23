import type { FormEvent } from 'react'
import type { UserDTO } from '../types/users'
import type { UserUpdatePayload } from '../api/usersApi'
import '../styles/common.css'

/**
 * UserEditForm — Formulario de edición de los datos de un usuario.
 *
 * RESPONSABILIDAD ÚNICA: Este componente solo sabe renderizar el
 * formulario de edición. No hace llamadas a API, no gestiona estado
 * de la lista de usuarios, ni controla la navegación. Todo eso
 * sigue siendo responsabilidad de UsersPage.
 *
 * PATRÓN UTILIZADO — "Controlled Form with Callback Handlers":
 * El estado del formulario (editPayload) vive en el padre (UsersPage).
 * Este componente recibe el valor actual y notifica los cambios vía
 * onFieldChange. Esta elección frente a gestionar el estado aquí
 * localmente se justifica por: el padre necesita el payload para
 * construir la llamada a la API, así que de todas formas tendría
 * que "subir" el estado. Es más limpio tenerlo arriba desde el inicio.
 */

interface UserEditFormProps {
  selectedUser: UserDTO
  editPayload: UserUpdatePayload
  onFieldChange: (field: keyof UserUpdatePayload, value: string) => void
  onSubmit: (e: FormEvent) => void
  onCancel: () => void
  saving: boolean
}

export function UserEditForm({
  selectedUser,
  editPayload,
  onFieldChange,
  onSubmit,
  onCancel,
  saving,
}: UserEditFormProps) {
  return (
    <form onSubmit={onSubmit} className="form-card">
      <div className="section-title">Editar usuario: {selectedUser.username}</div>

      <div className="form-grid">
        <div className="form-field">
          <label className="label-text">Email *</label>
          <input
            type="email" required className="input-full-width"
            value={editPayload.email}
            onChange={e => onFieldChange('email', e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="label-text">Nombre *</label>
          <input
            type="text" required className="input-full-width"
            value={editPayload.firstName}
            onChange={e => onFieldChange('firstName', e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="label-text">1er apellido *</label>
          <input
            type="text" required className="input-full-width"
            value={editPayload.lastName}
            onChange={e => onFieldChange('lastName', e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="label-text">2º apellido</label>
          <input
            type="text" className="input-full-width"
            value={editPayload.secondLastName ?? ''}
            onChange={e => onFieldChange('secondLastName', e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="label-text">Fecha nacimiento</label>
          <input
            type="date" className="input-full-width"
            value={editPayload.birthDate ?? ''}
            onChange={e => onFieldChange('birthDate', e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="label-text">Alta en banda</label>
          <input
            type="date" className="input-full-width"
            value={editPayload.bandJoinDate ?? ''}
            onChange={e => onFieldChange('bandJoinDate', e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="label-text">Teléfono</label>
          <input
            type="text" className="input-full-width"
            value={editPayload.phone ?? ''}
            onChange={e => onFieldChange('phone', e.target.value)}
          />
        </div>

        <div className="form-field grid-full-width">
          <label className="label-text">Notas</label>
          <textarea
            rows={3} className="textarea-base"
            value={editPayload.notes ?? ''}
            onChange={e => onFieldChange('notes', e.target.value)}
          />
        </div>

        <div className="form-field grid-full-width">
          <label className="label-text">URL foto de perfil</label>
          <input
            type="text" className="input-full-width"
            value={editPayload.profilePictureUrl ?? ''}
            onChange={e => onFieldChange('profilePictureUrl', e.target.value)}
          />
        </div>
      </div>

      <div className="button-row">
        <button type="submit" className="button-primary" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        <button type="button" className="button-secondary" onClick={onCancel} disabled={saving}>
          Cancelar
        </button>
      </div>
    </form>
  )
}