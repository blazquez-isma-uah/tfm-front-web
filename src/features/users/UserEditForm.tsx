import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { UserDTO } from '../../types/users'
import type { UserUpdatePayload } from '../../api/usersApi'
import { uploadProfilePicture, getUserPictureUrl } from '../../api/usersApi'
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
}

interface UserEditFormProps {
  selectedUser: UserDTO
  editPayload: UserUpdatePayload
  onFieldChange: (field: keyof UserUpdatePayload, value: string) => void
  onSubmit: (e: FormEvent) => void
  onCancel: () => void
  saving: boolean
  token?: string
}

export function UserEditForm({
  selectedUser,
  editPayload,
  onFieldChange,
  onSubmit,
  onCancel,
  saving,
  token,
}: UserEditFormProps) {
  const { errors, validate, clearError, validateField } = useFormValidation<UserUpdatePayload>(VALIDATION_RULES)

  const [pictureUrl, setPictureUrl] = useState<string | null>(null)
  const [uploadingPicture, setUploadingPicture] = useState(false)
  const [pictureError, setPictureError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!token) return
    getUserPictureUrl(selectedUser.id, token)
      .then(setPictureUrl)
      .catch(() => setPictureUrl(null))
  }, [selectedUser.id, token])

  const handlePictureFile = async (file: File) => {
    if (!token) return
    setPictureError(null)
    setUploadingPicture(true)
    try {
      await uploadProfilePicture(file, true, selectedUser.id, token)
      const refreshedUrl = await getUserPictureUrl(selectedUser.id, token)
      setPictureUrl(refreshedUrl)
    } catch (err: any) {
      setPictureError(
        err.response?.status === 501
          ? 'La foto de perfil no está disponible en el entorno local'
          : 'No se pudo subir la foto de perfil',
      )
    } finally {
      setUploadingPicture(false)
    }
  }

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
          <label className="label-text">Foto de perfil</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
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
                  {selectedUser.firstName?.[0]?.toUpperCase() ?? '?'}
                </span>
              )}
            </div>
            <button
              type="button"
              className="button-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPicture}
            >
              {uploadingPicture ? 'Subiendo...' : 'Cambiar foto'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handlePictureFile(file)
                e.target.value = ''
              }}
            />
          </div>
          {pictureError && <p className="error-message">{pictureError}</p>}
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