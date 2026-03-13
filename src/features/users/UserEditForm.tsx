import type { FormEvent } from 'react'
import type { UserDTO } from '../../types/users'
import type { UserUpdatePayload } from '../../api/usersApi'
import { useFormValidation, rules } from '../../hooks/useFormValidation'
import '../../styles/common.css'

/**
 * UserEditForm — Formulario de edición de datos de usuario.
 *
 * Se separa de `UserCreateForm` porque en edición no existen credenciales
 * ni asignación de roles; solo se modifican campos de perfil.
 *
 * Componente presentacional y controlado: no llama a la API ni gestiona
 * estado propio; recibe el payload y notifica cambios al contenedor.
 */

// Reglas a nivel de módulo — no se recrean en cada render
const VALIDATION_RULES = {
  email:              [rules.required('El email es obligatorio'), rules.email('Formato de email no válido')],
  firstName:          [rules.required('El nombre es obligatorio')],
  lastName:           [rules.required('El primer apellido es obligatorio')],
  profilePictureUrl:  [rules.url()],
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
  const { errors, validate, clearError, validateField } = useFormValidation<UserUpdatePayload>(VALIDATION_RULES)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    // Validamos antes de propagar al padre para evitar submits incompletos.
    if (validate(editPayload as unknown as Record<string, unknown>)) {
      onSubmit(e)
    }
  }

  const handleChange = (field: keyof UserUpdatePayload, value: string) => {
    // Limpiamos el error del campo en cuanto el usuario escribe para feedback inmediato.
    clearError(field)
    onFieldChange(field, value)
  }

  return (
    <form onSubmit={handleSubmit} className="form-card" noValidate>
      <div className="section-title">Editar usuario: {selectedUser.username}</div>

      <div className="form-grid">
        <div className="form-field">
          <label className="label-text">Email *</label>
          {/* Validamos también al perder el foco para guiar antes del submit. */}
          <input
            type="email"
            className={`input-full-width${errors.email ? ' input--error' : ''}`}
            value={editPayload.email}
            onChange={e => handleChange('email', e.target.value)}
            onBlur={e => validateField('email', e.target.value)}
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
            onBlur={e => validateField('firstName', e.target.value)}
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
            onBlur={e => validateField('lastName', e.target.value)}
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
            type="text" className={`input-full-width${errors.profilePictureUrl ? ' input--error' : ''}`}
            value={editPayload.profilePictureUrl ?? ''}
            onChange={e => handleChange('profilePictureUrl', e.target.value)}
          />
          {errors.profilePictureUrl && <span className="field-error">{errors.profilePictureUrl}</span>}
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