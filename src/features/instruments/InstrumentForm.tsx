import type { FormEvent } from 'react'
import type { InstrumentRequestDTO } from '../../types/instruments'
import type { InstrumentDTO } from '../../types/instruments'
import { useFormValidation, rules } from '../../hooks/useFormValidation'
import '../../styles/common.css'

const VALIDATION_RULES = {
  instrumentName: [rules.required('El nombre es obligatorio')]
}

/**
 * InstrumentForm — Formulario único para crear y editar instrumentos.
 *
 * Se usa un solo componente porque los campos son idénticos; solo cambian
 * el título y el texto del botón según el modo. Esto contrasta con
 * `UserCreateForm`/`UserEditForm`, donde existen diferencias estructurales
 * (credenciales y roles en alta, no en edición).
 *
 * Componente controlado: el payload vive en el contenedor y se propaga
 * mediante `onFieldChange`, sin llamadas directas a la API.
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
    // Limpiamos el error del campo al escribir para feedback inmediato.
    clearError(field)
    onFieldChange(field, value)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    // Validamos antes de delegar al padre el submit.
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
            placeholder="Ej: Principal, 1, 2…"
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