import type { FormEvent } from 'react'
import type { InstrumentRequestDTO } from '../types/instruments'
import type { InstrumentDTO } from '../types/instruments'
import { useFormValidation, rules } from '../hooks/useFormValidation'
import '../styles/common.css'

const VALIDATION_RULES = {
  instrumentName: [rules.required('El nombre es obligatorio')]
}

/**
 * InstrumentForm — Formulario compartido para crear y editar instrumentos.
 *
 * DECISIÓN — Un único componente para create y edit:
 * El formulario de instrumento tiene exactamente 2 campos: instrumentName y voice.
 * La única diferencia entre crear y editar es el título y el texto del botón.
 * Duplicar el componente solo para cambiar esas dos cadenas sería over-engineering.
 * En cambio, para UsersPage se usaron componentes separados (UserEditForm /
 * UserCreateForm) porque las diferencias eran estructurales: el formulario de
 * creación incluía credenciales (username, password) y roles, que no existen
 * en edición.
 *
 * PATRÓN — Modo controlado con payload externo:
 * El estado del formulario (payload) vive en InstrumentsPage, no aquí.
 * Este componente solo renderiza y notifica cambios vía onFieldChange.
 * Justificación: el padre necesita el payload para construir la llamada a API,
 * así que elevarlo evita sincronización innecesaria.
 *
 * @param editing  null → modo CREATE, InstrumentDTO → modo EDIT
 */
interface InstrumentFormProps {
  editing: InstrumentDTO | null
  payload: InstrumentRequestDTO
  onFieldChange: (field: keyof InstrumentRequestDTO, value: string) => void
  onSubmit: (e: FormEvent) => void
  onCancel: () => void
  saving?: boolean
}

export function InstrumentForm({
  editing,
  payload,
  onFieldChange,
  onSubmit,
  onCancel,
  saving = false,
}: InstrumentFormProps) {
  const isEdit = editing !== null

  const { errors, validate, clearError } = useFormValidation<InstrumentRequestDTO>(VALIDATION_RULES)

  const handleChange = (field: keyof InstrumentRequestDTO, value: string) => {
    clearError(field)
    onFieldChange(field, value)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (validate(payload as unknown as Record<string, unknown>)) {
      onSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form-card" noValidate>
      <div className="section-title">
        {isEdit
          ? `Editar instrumento: ${editing.instrumentName}${editing.voice ? ` — ${editing.voice}` : ''}`
          : 'Nuevo instrumento'}
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label className="label-text">Nombre *</label>
          <input
            type="text"
            className={`input-full-width${errors.instrumentName ? ' input--error' : ''}`}
            value={payload.instrumentName}
            onChange={e => handleChange('instrumentName', e.target.value)}
          />
          {errors.instrumentName && <span className="field-error">{errors.instrumentName}</span>}
        </div>

        <div className="form-field">
          <label className="label-text">Voz</label>
          <input
            type="text"
            className={`input-full-width${errors.voice ? ' input--error' : ''}`}
            value={payload.voice ?? ''}
            onChange={e => handleChange('voice', e.target.value)}
            placeholder="Ej: Soprano, Tenor…"
          />
          {errors.voice && <span className="field-error">{errors.voice}</span>}
        </div>
      </div>

      <div className="button-row">
        <button type="submit" className="button-primary" disabled={saving}>
          {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear instrumento'}
        </button>
        <button type="button" className="button-secondary" onClick={onCancel} disabled={saving}>
          Cancelar
        </button>
      </div>
    </form>
  )
}