import type { FormEvent } from 'react'
import type { UserCreatePayload } from '../api/usersApi'
import type { KeycloakRoleResponse } from '../types/roles'
import { useFormValidation, rules } from '../hooks/useFormValidation'
import '../styles/common.css'

/**
 * UserCreateForm — Formulario de creación de nuevo usuario.
 *
 * VALIDACIÓN FRONTEND:
 * Reglas más estrictas que en edición porque incluye credenciales:
 * - username: requerido, mínimo 3 caracteres, sin espacios
 * - password: requerido, mínimo 8 caracteres
 * - email: requerido, formato válido
 * - firstName, lastName: requeridos
 */

const VALIDATION_RULES = {
  username:  [rules.required('El username es obligatorio'), rules.minLength(3, 'Mínimo 3 caracteres'), rules.noSpaces('No puede contener espacios')],
  email:     [rules.required('El email es obligatorio'), rules.email('Formato de email no válido')],
  password:  [rules.required('La contraseña es obligatoria'), rules.minLength(6, 'Mínimo 6 caracteres')],
  firstName: [rules.required('El nombre es obligatorio')],
  lastName:  [rules.required('El primer apellido es obligatorio')],
}

interface UserCreateFormProps {
  createPayload: UserCreatePayload
  roles: KeycloakRoleResponse[]
  onFieldChange: (field: keyof UserCreatePayload, value: string) => void
  onToggleRole: (roleName: string) => void
  onSubmit: (e: FormEvent) => void
  onCancel: () => void
  saving: boolean
}

export function UserCreateForm({
  createPayload,
  roles,
  onFieldChange,
  onToggleRole,
  onSubmit,
  onCancel,
  saving,
}: UserCreateFormProps) {
  const { errors, validate, clearError } = useFormValidation<UserCreatePayload>(VALIDATION_RULES)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (validate(createPayload as unknown as Record<string, unknown>)) {
      onSubmit(e)
    }
  }

  const handleChange = (field: keyof UserCreatePayload, value: string) => {
    clearError(field)
    onFieldChange(field, value)
  }

  return (
    <form onSubmit={handleSubmit} className="form-card" noValidate>
      <div className="section-title">Nuevo usuario</div>

      <div className="form-grid">
        {/* ── Credenciales ── */}
        <div className="form-field">
          <label className="label-text">Username *</label>
          <input
            type="text"
            className={`input-full-width${errors.username ? ' input--error' : ''}`}
            value={createPayload.username}
            onChange={e => handleChange('username', e.target.value)}
          />
          {errors.username && <span className="field-error">{errors.username}</span>}
        </div>

        <div className="form-field">
          <label className="label-text">Email *</label>
          <input
            type="email"
            className={`input-full-width${errors.email ? ' input--error' : ''}`}
            value={createPayload.email}
            onChange={e => handleChange('email', e.target.value)}
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="form-field">
          <label className="label-text">Password *</label>
          <input
            type="password"
            className={`input-full-width${errors.password ? ' input--error' : ''}`}
            value={createPayload.password}
            onChange={e => handleChange('password', e.target.value)}
          />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>

        {/* ── Datos personales ── */}
        <div className="form-field">
          <label className="label-text">Nombre *</label>
          <input
            type="text"
            className={`input-full-width${errors.firstName ? ' input--error' : ''}`}
            value={createPayload.firstName}
            onChange={e => handleChange('firstName', e.target.value)}
          />
          {errors.firstName && <span className="field-error">{errors.firstName}</span>}
        </div>

        <div className="form-field">
          <label className="label-text">1er apellido *</label>
          <input
            type="text"
            className={`input-full-width${errors.lastName ? ' input--error' : ''}`}
            value={createPayload.lastName}
            onChange={e => handleChange('lastName', e.target.value)}
          />
          {errors.lastName && <span className="field-error">{errors.lastName}</span>}
        </div>

        <div className="form-field">
          <label className="label-text">2º apellido</label>
          <input
            type="text" className="input-full-width"
            value={createPayload.secondLastName ?? ''}
            onChange={e => handleChange('secondLastName', e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="label-text">Fecha nacimiento</label>
          <input
            type="date" className="input-full-width"
            value={createPayload.birthDate ?? ''}
            onChange={e => handleChange('birthDate', e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="label-text">Alta en banda</label>
          <input
            type="date" className="input-full-width"
            value={createPayload.bandJoinDate ?? ''}
            onChange={e => handleChange('bandJoinDate', e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="label-text">Teléfono</label>
          <input
            type="text" className="input-full-width"
            value={createPayload.phone ?? ''}
            onChange={e => handleChange('phone', e.target.value)}
          />
        </div>

        <div className="form-field grid-full-width">
          <label className="label-text">Notas</label>
          <textarea
            rows={3} className="textarea-base"
            value={createPayload.notes ?? ''}
            onChange={e => handleChange('notes', e.target.value)}
          />
        </div>

        <div className="form-field grid-full-width">
          <label className="label-text">URL foto de perfil</label>
          <input
            type="text" className="input-full-width"
            value={createPayload.profilePictureUrl ?? ''}
            onChange={e => handleChange('profilePictureUrl', e.target.value)}
          />
        </div>

        {/* ── Roles ── */}
        {roles.length > 0 && (
          <div className="form-field grid-full-width">
            <label className="label-text">Roles</label>
            <div className="checkbox-group">
              {roles.map(r => (
                <label key={r.id} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={createPayload.roles.includes(r.name)}
                    onChange={() => onToggleRole(r.name)}
                  />
                  <span>{r.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="button-row">
        <button type="submit" className="button-primary" disabled={saving}>
          {saving ? 'Guardando...' : 'Crear usuario'}
        </button>
        <button type="button" className="button-secondary" onClick={onCancel} disabled={saving}>
          Cancelar
        </button>
      </div>
    </form>
  )
}