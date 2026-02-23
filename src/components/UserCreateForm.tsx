import type { FormEvent } from 'react'
import type { UserCreatePayload } from '../api/usersApi'
import type { KeycloakRoleResponse } from '../types/roles'
import '../styles/common.css'

/**
 * UserCreateForm — Formulario de creación de nuevo usuario.
 *
 * DIFERENCIA CON UserEditForm:
 * - Incluye campos de credenciales (username, password) que no son
 *   editables una vez creado el usuario (restricción de Keycloak).
 * - Incluye selección de roles inline (en edición los roles se gestionan
 *   en un panel separado para no mezclar responsabilidades).
 * - No recibe selectedUser porque no hay usuario previo al que referenciar.
 *
 * DECISIÓN — ¿Por qué roles en el formulario de creación pero no en edición?
 * En creación, la asignación inicial de roles es parte del proceso de alta
 * del usuario: se hace una sola llamada a la API que crea el usuario con sus
 * roles. En edición, cambiar roles es una operación independiente (PUT /roles)
 * que puede fallar de forma aislada. Separarla en un panel propio facilita
 * el manejo de errores y hace la UX más clara.
 */

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
  return (
    <form onSubmit={onSubmit} className="form-card">
      <div className="section-title">Nuevo usuario</div>

      <div className="form-grid">
        {/* ── Credenciales ── */}
        <div className="form-field">
          <label className="label-text">Username *</label>
          <input
            type="text" required className="input-full-width"
            value={createPayload.username}
            onChange={e => onFieldChange('username', e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="label-text">Email *</label>
          <input
            type="email" required className="input-full-width"
            value={createPayload.email}
            onChange={e => onFieldChange('email', e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="label-text">Password *</label>
          <input
            type="password" required className="input-full-width"
            value={createPayload.password}
            onChange={e => onFieldChange('password', e.target.value)}
          />
        </div>

        {/* ── Datos personales ── */}
        <div className="form-field">
          <label className="label-text">Nombre *</label>
          <input
            type="text" required className="input-full-width"
            value={createPayload.firstName}
            onChange={e => onFieldChange('firstName', e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="label-text">1er apellido *</label>
          <input
            type="text" required className="input-full-width"
            value={createPayload.lastName}
            onChange={e => onFieldChange('lastName', e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="label-text">2º apellido</label>
          <input
            type="text" className="input-full-width"
            value={createPayload.secondLastName ?? ''}
            onChange={e => onFieldChange('secondLastName', e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="label-text">Fecha nacimiento</label>
          <input
            type="date" className="input-full-width"
            value={createPayload.birthDate ?? ''}
            onChange={e => onFieldChange('birthDate', e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="label-text">Alta en banda</label>
          <input
            type="date" className="input-full-width"
            value={createPayload.bandJoinDate ?? ''}
            onChange={e => onFieldChange('bandJoinDate', e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="label-text">Teléfono</label>
          <input
            type="text" className="input-full-width"
            value={createPayload.phone ?? ''}
            onChange={e => onFieldChange('phone', e.target.value)}
          />
        </div>

        <div className="form-field grid-full-width">
          <label className="label-text">Notas</label>
          <textarea
            rows={3} className="textarea-base"
            value={createPayload.notes ?? ''}
            onChange={e => onFieldChange('notes', e.target.value)}
          />
        </div>

        <div className="form-field grid-full-width">
          <label className="label-text">URL foto de perfil</label>
          <input
            type="text" className="input-full-width"
            value={createPayload.profilePictureUrl ?? ''}
            onChange={e => onFieldChange('profilePictureUrl', e.target.value)}
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