import type { FormEvent } from 'react'
import type { UserDTO } from '../types/users'
import type { UserUpdatePayload } from '../api/usersApi'
import { useFormValidation, rules } from '../hooks/useFormValidation'
import '../styles/common.css'

/**
 * UserEditForm — Formulario de edición de los datos de un usuario.
 *
 * VALIDACIÓN FRONTEND:
 * Se usa useFormValidation con reglas definidas a nivel de módulo
 * (fuera del componente) para evitar recrearlas en cada render.
 *
 * El submit intercepta el evento, valida, y solo propaga al padre
 * si todos los campos son válidos. Los errores se limpian campo a
 * campo en el onChange para dar feedback inmediato al usuario.
 */

// Reglas a nivel de módulo — no se recrean en cada render
const VALIDATION_RULES = {
  email:     [rules.required('El email es obligatorio'), rules.email('Formato de email no válido')],
  firstName: [rules.required('El nombre es obligatorio')],
  lastName:  [rules.required('El primer apellido es obligatorio')],
}

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
  const { errors, validate, clearError } = useFormValidation<UserUpdatePayload>(VALIDATION_RULES)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (validate(editPayload as unknown as Record<string, unknown>)) {
      onSubmit(e)
    }
  }

  const handleChange = (field: keyof UserUpdatePayload, value: string) => {
    clearError(field)
    onFieldChange(field, value)
  }

  return (
    <form onSubmit={handleSubmit} className="form-card" noValidate>
      <div className="section-title">Editar usuario: {selectedUser.username}</div>

      <div className="form-grid">
        <div className="form-field">
          <label className="label-text">Email *</label>
          <input
            type="email"
            className={`input-full-width${errors.email ? ' input--error' : ''}`}
            value={editPayload.email}
            onChange={e => handleChange('email', e.target.value)}
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="form-field">
          <label className="label-text">Nombre *</label>
          <input
            type="text"
            className={`input-full-width${errors.firstName ? ' input--error' : ''}`}
            value={editPayload.firstName}
            onChange={e => handleChange('firstName', e.target.value)}
          />
          {errors.firstName && <span className="field-error">{errors.firstName}</span>}
        </div>

        <div className="form-field">
          <label className="label-text">1er apellido *</label>
          <input
            type="text"
            className={`input-full-width${errors.lastName ? ' input--error' : ''}`}
            value={editPayload.lastName}
            onChange={e => handleChange('lastName', e.target.value)}
          />
          {errors.lastName && <span className="field-error">{errors.lastName}</span>}
        </div>

        <div className="form-field">
          <label className="label-text">2º apellido</label>
          <input
            type="text" className="input-full-width"
            value={editPayload.secondLastName ?? ''}
            onChange={e => handleChange('secondLastName', e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="label-text">Fecha nacimiento</label>
          <input
            type="date" className="input-full-width"
            value={editPayload.birthDate ?? ''}
            onChange={e => handleChange('birthDate', e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="label-text">Alta en banda</label>
          <input
            type="date" className="input-full-width"
            value={editPayload.bandJoinDate ?? ''}
            onChange={e => handleChange('bandJoinDate', e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="label-text">Teléfono</label>
          <input
            type="text" className="input-full-width"
            value={editPayload.phone ?? ''}
            onChange={e => handleChange('phone', e.target.value)}
          />
        </div>

        <div className="form-field grid-full-width">
          <label className="label-text">Notas</label>
          <textarea
            rows={3} className="textarea-base"
            value={editPayload.notes ?? ''}
            onChange={e => handleChange('notes', e.target.value)}
          />
        </div>

        <div className="form-field grid-full-width">
          <label className="label-text">URL foto de perfil</label>
          <input
            type="text" className="input-full-width"
            value={editPayload.profilePictureUrl ?? ''}
            onChange={e => handleChange('profilePictureUrl', e.target.value)}
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