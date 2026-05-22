import type { EventDTO } from '../types/events'
import { getDateOnly } from '../utils/date'

interface EventSelectOptionsProps {
    events: EventDTO[]
}

/**
 * EventSelectOptions — Renderiza opciones de evento para un select.
 *
 * Componente presentacional que renderiza un conjunto de opciones `<option>`
 * para un dropdown de eventos. Muestra título + fecha para identificar
 * claramente cada evento.
 *
 * PROPÓSITO:
 * Centralizar la lógica de renderización de opciones de eventos para
 * evitar duplicación en SurveyForm y SurveyFiltersPanel.
 *
 * USO:
 * <select value={...} onChange={...}>
 *     <option value="">Selecciona un evento</option>
 *     <EventSelectOptions events={availableEvents} />
 * </select>
 */
export function EventSelectOptions({ events }: EventSelectOptionsProps) {
    return (
        <>
            {events.map(evt => (
                <option key={evt.id} value={evt.id}>
                    {evt.title} ({getDateOnly(evt.startAt)})
                </option>
            ))}
        </>
    )
}
