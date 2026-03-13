import type { FormEvent } from 'react'
import type { UserDTO } from '../../types/users'
import type { InstrumentDTO } from '../../types/instruments'
import type { InstrumentGroup } from '../../utils/instrumentUtils'
import '../../styles/common.css'
import { SaveIcon, CancelIcon } from '../../components/Icons'

/**
 * UserInstrumentsPanel — Panel para gestionar instrumentos asignados.
 *
 * Recibe los instrumentos ya agrupados por letra inicial y los IDs
 * seleccionados; el componente se limita a renderizar y emitir cambios.
 */

interface UserInstrumentsPanelProps {
  selectedUser: UserDTO
  allGroupedInstruments: InstrumentGroup[]
  selectedInstrumentIds: number[]
  instrumentsLoading: boolean
  onToggleInstrument: (instrumentId: number) => void
  onSubmit: (e: FormEvent) => void
  onCancel: () => void
  saving: boolean
}

export function UserInstrumentsPanel({
  selectedUser,
  allGroupedInstruments,
  selectedInstrumentIds,
  instrumentsLoading,
  onToggleInstrument,
  onSubmit,
  onCancel,
  saving,
}: UserInstrumentsPanelProps) {
  return (
    <form onSubmit={onSubmit} className="form-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div className="section-title" style={{ margin: 0 }}>
          Instrumentos de {selectedUser.firstName} {selectedUser.lastName}{selectedUser.secondLastName ? ` ${selectedUser.secondLastName}` : ''} ({selectedUser.username})
        </div>
        <div className="actions-container" style={{ marginLeft: 'auto' }}>
          <span className="tooltip-wrap" data-tooltip="Guardar instrumentos">
            <button type="submit" className="btn-icon btn-icon-edit"
              aria-label="Guardar instrumentos" disabled={saving}>
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

      {instrumentsLoading ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: '1rem' }}>
          Cargando instrumentos...
        </p>
      ) : (
        <div style={{ marginTop: '1rem' }}>
          {allGroupedInstruments.map(group => (
            <div key={group.letter}>
              <div className="label-text" style={{ marginTop: 'var(--space-3)' }}>{group.letter}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-2)' }}>
                {group.items.map((inst: InstrumentDTO) => (
                  <label key={inst.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedInstrumentIds.includes(inst.id)}
                      onChange={() => onToggleInstrument(inst.id)}
                    />
                    <span>
                      {inst.instrumentName}{inst.voice && ` (${inst.voice})`}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          {allGroupedInstruments.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              No hay instrumentos definidos en el sistema.
            </p>
          )}
        </div>
      )}

    </form>
  )
}