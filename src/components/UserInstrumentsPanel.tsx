import type { FormEvent } from 'react'
import type { UserDTO } from '../types/users'
import type { InstrumentDTO } from '../types/instruments'
import type { InstrumentGroup } from '../utils/instrumentUtils'
import '../styles/common.css'

/**
 * UserInstrumentsPanel — Panel para gestionar los instrumentos asignados
 * a un usuario.
 *
 * DIFERENCIA RESPECTO A UserRolesPanel:
 * Los instrumentos SÍ se cargan al abrir el panel (en openManageInstruments
 * dentro de UsersPage) porque la lista de instrumentos puede ser larga y
 * no tendría sentido cargarla al iniciar la página si el admin puede que
 * nunca abra este panel. Es un caso clásico de "lazy loading" de datos.
 *
 * Los instrumentos vienen agrupados por letra inicial (InstrumentGroup[])
 * por la función groupInstrumentsByInitial del utils. Esta agrupación
 * se hace en UsersPage y se pasa ya procesada para que el componente
 * solo se ocupe del renderizado.
 *
 * TIPADO DE inst:
 * El campo instruments del DTO puede devolver objetos con distintas
 * formas según la versión del backend (número, {id}, {instrumentId}).
 * La normalización se hace en UsersPage al calcular selectedInstrumentIds,
 * así que este componente trabaja siempre con number[].
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
      <div className="section-title">
        Gestionar instrumentos de {selectedUser.username}
      </div>

      {instrumentsLoading ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: '1rem' }}>
          Cargando instrumentos...
        </p>
      ) : (
        <div className="instruments-grid" style={{ marginTop: '1rem' }}>
          {allGroupedInstruments.map(group => (
            <div key={group.letter} className="instrument-group">
              <div className="instrument-group-title">{group.letter}</div>
              {group.items.map((inst: InstrumentDTO) => (
                <label key={inst.id} className="instrument-item">
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
          ))}
          {allGroupedInstruments.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              No hay instrumentos definidos en el sistema.
            </p>
          )}
        </div>
      )}

      <div className="button-row">
        <button type="submit" className="button-primary" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar instrumentos'}
        </button>
        <button type="button" className="button-secondary" onClick={onCancel} disabled={saving}>
          Cancelar
        </button>
      </div>
    </form>
  )
}