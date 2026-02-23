import type {
    EventDTO,
    EventCreateRequestDTO,
    EventType,
    EventStatus,
    EventVisibility,
} from '../types/events'
import {
    translateEventType,
    translateEventStatus,
    translateEventVisibility,
} from '../utils/eventTranslations'
import '../styles/common.css'

interface EventFormProps {
    /** null → modo creación; EventDTO → modo edición */
    editing: EventDTO | null
    formPayload: Omit<EventCreateRequestDTO, 'startAt' | 'endAt'>
    setFormPayload: (payload: Omit<EventCreateRequestDTO, 'startAt' | 'endAt'>) => void
    formStartAt: string
    setFormStartAt: (v: string) => void
    formEndAt: string
    setFormEndAt: (v: string) => void
    eventTypes: EventType[]
    eventStatuses: EventStatus[]
    eventVisibilities: EventVisibility[]
    saving: boolean
    onSave: () => void
    onCancel: () => void
}

/**
 * EventForm — Formulario compartido para crear y editar eventos.
 *
 * RESPONSABILIDAD:
 * Renderiza los 6 campos del evento (título, localización, tipo, estado,
 * visibilidad, descripción) más las dos fechas (inicio y fin) con su botonera
 * de guardar/cancelar. Adaptado a modo creación o edición según la prop editing.
 *
 * POR QUÉ SE EXTRAE:
 * El bloque inline del formulario en EventsPage ocupaba ~72 líneas JSX.
 * Extraerlo reduce EventsPage a su responsabilidad de orquestación (estado,
 * efectos, handlers de API) y hace el formulario testeable de forma aislada.
 *
 * DECISIONES DE DISEÑO:
 * - Un solo componente con prop `editing: EventDTO | null` en lugar de dos
 *   componentes separados (EventCreateForm / EventEditForm). Los campos son
 *   estructuralmente idénticos en ambos modos; solo cambia el título y el
 *   texto del botón de guardar, lo que no justifica duplicar el JSX.
 * - Presentacional controlado: no llama a la API ni gestiona estado propio.
 *   El flujo de error/saving está centralizado en EventsPage para que el
 *   mensaje de error aparezca siempre en la misma posición en la página.
 * - setFormPayload recibe el objeto completo (con spread) en lugar de un setter
 *   por campo, para mantener la misma API que el estado original del padre y
 *   evitar proliferación de callbacks.
 */
export function EventForm({
    editing,
    formPayload,
    setFormPayload,
    formStartAt,
    setFormStartAt,
    formEndAt,
    setFormEndAt,
    eventTypes,
    eventStatuses,
    eventVisibilities,
    saving,
    onSave,
    onCancel,
}: EventFormProps) {
    const isEdit = editing !== null

    return (
        <div className="form-card">
            <h2 className="section-title">
                {isEdit ? 'Editar evento' : 'Crear evento'}
            </h2>

            {/* Línea 1: Título, Localización */}
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '0.75rem' }}>
                <div className="form-field">
                    <label className="label-text">Título *</label>
                    <input
                        type="text"
                        value={formPayload.title}
                        onChange={e => setFormPayload({ ...formPayload, title: e.target.value })}
                        required
                        className="input-full-width"
                    />
                </div>
                <div className="form-field">
                    <label className="label-text">Localización</label>
                    <input
                        type="text"
                        value={formPayload.location}
                        onChange={e => setFormPayload({ ...formPayload, location: e.target.value })}
                        className="input-full-width"
                    />
                </div>
            </div>

            {/* Línea 2: Tipo, Estado, Visibilidad */}
            <div className="form-grid" style={{ marginBottom: '0.75rem' }}>
                <div className="form-field">
                    <label className="label-text">Tipo *</label>
                    <select
                        value={formPayload.type}
                        onChange={e => setFormPayload({ ...formPayload, type: e.target.value as EventType })}
                        className="select-base"
                        required
                    >
                        {eventTypes.map(t => (
                            <option key={t} value={t}>{translateEventType(t)}</option>
                        ))}
                    </select>
                </div>
                <div className="form-field">
                    <label className="label-text">Estado</label>
                    <select
                        value={formPayload.status || eventStatuses[0] || ''}
                        onChange={e => setFormPayload({ ...formPayload, status: e.target.value as EventStatus })}
                        className="select-base"
                    >
                        {eventStatuses.map(s => (
                            <option key={s} value={s}>{translateEventStatus(s)}</option>
                        ))}
                    </select>
                </div>
                <div className="form-field">
                    <label className="label-text">Visibilidad *</label>
                    <select
                        value={formPayload.visibility}
                        onChange={e => setFormPayload({ ...formPayload, visibility: e.target.value as EventVisibility })}
                        className="select-base"
                        required
                    >
                        {eventVisibilities.map(v => (
                            <option key={v} value={v}>{translateEventVisibility(v)}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Línea 3: Fecha inicio, Fecha fin */}
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '0.75rem' }}>
                <div className="form-field">
                    <label className="label-text">Fecha inicio *</label>
                    <input
                        type="datetime-local"
                        value={formStartAt}
                        onChange={e => setFormStartAt(e.target.value)}
                        className="input-full-width"
                        required
                    />
                </div>
                <div className="form-field">
                    <label className="label-text">Fecha fin *</label>
                    <input
                        type="datetime-local"
                        value={formEndAt}
                        onChange={e => setFormEndAt(e.target.value)}
                        className="input-full-width"
                        required
                    />
                </div>
            </div>

            {/* Línea 4: Descripción */}
            <div className="form-grid">
                <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                    <label className="label-text">Descripción</label>
                    <textarea
                        value={formPayload.description}
                        onChange={e => setFormPayload({ ...formPayload, description: e.target.value })}
                        className="textarea-base"
                        rows={4}
                    />
                </div>
            </div>

            <div className="button-row-1rem">
                <button
                    type="button"
                    className="button-primary"
                    onClick={onSave}
                    disabled={saving}
                >
                    {saving ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear'}
                </button>
                <button
                    type="button"
                    className="button-secondary"
                    onClick={onCancel}
                    disabled={saving}
                >
                    Cancelar
                </button>
            </div>
        </div>
    )
}
