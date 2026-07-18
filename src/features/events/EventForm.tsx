import type { FormEvent } from 'react'
import type {
    EventDTO,
    EventCreateRequestDTO,
    EventType,
    EventStatus,
    EventVisibility,
} from '../../types/events'
import { useFormValidation, rules, type CrossValidateFn } from '../../hooks/useFormValidation'
import {
    translateEventType,
    translateEventStatus,
    translateEventVisibility,
} from '../../utils/eventTranslations'
import '../../styles/common.css'

type EventFormFields = {
    title: string
    startAt: string
    endAt: string
    type: string
    status: string
    visibility: string
}

const VALIDATION_RULES = {
    title:      [rules.required()],
    startAt:    [rules.required('La fecha de inicio es obligatoria')],
    endAt:      [rules.required('La fecha de fin es obligatoria')],
    type:       [rules.required('Selecciona un tipo')],
    status:     [rules.required('Selecciona un estado')],
    visibility: [rules.required('Selecciona la visibilidad')],
}

const CROSS_VALIDATE: CrossValidateFn<EventFormFields> = (values, addError) => {
    const start = values['startAt'] as string
    const end = values['endAt'] as string
    if (start && end && new Date(end) <= new Date(start)) {
        addError('endAt', 'La fecha de fin debe ser posterior a la de inicio')
    }
}

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
 * Renderiza los campos del evento (título, localización, tipo, estado,
 * visibilidad, descripción) más las dos fechas (inicio y fin) con su botonera
 * de guardar/cancelar. Adaptado automáticamente a modo creación o edición
 * según la prop `editing`.
 *
 * POR QUÉ UN SOLO COMPONENTE:
 * Los campos son estructuralmente idénticos en ambos modos (create/edit).
 * Solo el título y el texto del botón cambian, lo que no justifica duplicar
 * el JSX en dos componentes (EventCreateForm / EventEditForm).
 *
 * VALIDACIÓN DE FECHAS:
 * La validación cruzada de fechas usa crossValidate (del hook useFormValidation),
 * no lógica manual con showToast. Ventaja: el error aparece inline bajo el campo
 * (field-error), no como notificación flotante. Así el usuario tiene feedback
 * inmediato y contextualizado.\n *
 * DECISIONES DE DISEÑO:
 * - Presentacional controlado: no llama a la API ni gestiona estado propio.
 *   El flujo de error/saving viene del padre (EventsPage) para que el mensaje
 *   de error aparezca siempre en la misma posición en la página.
 * - setFormPayload recibe el objeto completo (con spread) en lugar de un setter
 *   por campo, para mantener la misma API que el estado original del padre.
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

    const { errors, validate, clearError } = useFormValidation<EventFormFields>(
        VALIDATION_RULES,
        CROSS_VALIDATE
    )

    /**
     * Maneja el envío del formulario. Realiza dos pasos de validación:
     * 1. Validación de campos individuales (requeridos, formato)
     * 2. Validación cruzada de fechas (start < end) mediante crossValidate
     * Si pasa ambas, llama onSave(). Si falla, los errores aparecen inline.
     */
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        const valid = validate({
            title:      formPayload.title,
            startAt:    formStartAt,
            endAt:      formEndAt,
            type:       formPayload.type,
            status:     formPayload.status ?? '',
            visibility: formPayload.visibility,
        })
        if (!valid) return
        onSave()
    }

    return (
        // noValidate desactiva la validación nativa del navegador (HTML5 constraint validation).
        // Usamos nuestra propia validación con useFormValidation para tener control total
        // sobre los mensajes de error, su posición (inline bajo el campo), y el momento
        // de mostrarlos (al hacer submit, no al perder el foco).
        <form className="form-card" noValidate onSubmit={handleSubmit}>
            <h2 className="section-title">
                {isEdit ? 'Editar evento' : 'Crear evento'}
            </h2>

            {/* Línea 1: Título, Localización */}
            <div className="form-grid form-grid--event-2col" style={{ marginBottom: '0.75rem' }}>
                <div className="form-field">
                    <label className="label-text">Título *</label>
                    <input
                        type="text"
                        value={formPayload.title}
                        onChange={e => { clearError('title'); setFormPayload({ ...formPayload, title: e.target.value }) }}
                        className={`input-full-width${errors.title ? ' input--error' : ''}`}
                    />
                    {errors.title && <span className="field-error">{errors.title}</span>}
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
                        onChange={e => { clearError('type'); setFormPayload({ ...formPayload, type: e.target.value as EventType }) }}
                        className={`select-base${errors.type ? ' input--error' : ''}`}
                    >
                        {eventTypes.map(t => (
                            <option key={t} value={t}>{translateEventType(t)}</option>
                        ))}
                    </select>
                    {errors.type && <span className="field-error">{errors.type}</span>}
                </div>
                <div className="form-field">
                    <label className="label-text">Estado</label>
                    <select
                        value={formPayload.status || eventStatuses[0] || ''}
                        onChange={e => { clearError('status'); setFormPayload({ ...formPayload, status: e.target.value as EventStatus }) }}
                        className={`select-base${errors.status ? ' input--error' : ''}`}
                    >
                        {eventStatuses.map(s => (
                            <option key={s} value={s}>{translateEventStatus(s)}</option>
                        ))}
                    </select>
                    {errors.status && <span className="field-error">{errors.status}</span>}
                </div>
                <div className="form-field">
                    <label className="label-text">Visibilidad *</label>
                    <select
                        value={formPayload.visibility}
                        onChange={e => { clearError('visibility'); setFormPayload({ ...formPayload, visibility: e.target.value as EventVisibility }) }}
                        className={`select-base${errors.visibility ? ' input--error' : ''}`}
                    >
                        {eventVisibilities.map(v => (
                            <option key={v} value={v}>{translateEventVisibility(v)}</option>
                        ))}
                    </select>
                    {errors.visibility && <span className="field-error">{errors.visibility}</span>}
                </div>
            </div>

            {/* Línea 3: Fecha inicio, Fecha fin */}
            <div className="form-grid form-grid--event-2col" style={{ marginBottom: '0.75rem' }}>
                <div className="form-field">
                    <label className="label-text">Fecha inicio *</label>
                    <input
                        type="datetime-local"
                        value={formStartAt}
                        onChange={e => { clearError('startAt'); setFormStartAt(e.target.value) }}
                        className={`input-full-width${errors.startAt ? ' input--error' : ''}`}
                    />
                    {errors.startAt && <span className="field-error">{errors.startAt}</span>}
                </div>
                <div className="form-field">
                    <label className="label-text">Fecha fin *</label>
                    <input
                        type="datetime-local"
                        value={formEndAt}
                        onChange={e => { clearError('endAt'); setFormEndAt(e.target.value) }}
                        className={`input-full-width${errors.endAt ? ' input--error' : ''}`}
                    />
                    {errors.endAt && <span className="field-error">{errors.endAt}</span>}
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
                    type="submit"
                    className="button-primary"
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
        </form>
    )
}
