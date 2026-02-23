import type { FormEvent } from 'react'
import type { InstrumentRequestDTO } from '../types/instruments'
import type { InstrumentDTO } from '../types/instruments'
import '../styles/common.css'

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

  return (
    <form onSubmit={onSubmit} className="form-card">
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
            required
            className="input-full-width"
            value={payload.instrumentName}
            onChange={e => onFieldChange('instrumentName', e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="label-text">Voz</label>
          <input
            type="text"
            className="input-full-width"
            value={payload.voice ?? ''}
            onChange={e => onFieldChange('voice', e.target.value)}
            placeholder="Ej: Soprano, Tenor…"
          />
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