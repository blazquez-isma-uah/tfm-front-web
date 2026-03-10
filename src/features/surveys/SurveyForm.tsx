import type { FormEvent } from 'react'
import type {
    SurveyDTO,
    CreateSurveyRequestDTO,
    ResponseType,
    SurveyType,
} from '../../types/surveys'
import { useFormValidation, rules, type CrossValidateFn } from '../../hooks/useFormValidation'
import type { EventDTO } from '../../types/events'
import {
    translateResponseType,
    translateSurveyType,
} from '../../utils/surveyTranslations'
import '../../styles/common.css'

type SurveyFormFields = {
    title: string
    opensAt: string
    closesAt: string
    responseType: string
    surveyType: string
    eventId: string
}

const VALIDATION_RULES = {
    title:        [rules.required('El título es obligatorio')],
    opensAt:      [rules.required('La fecha de apertura es obligatoria')],
    closesAt:     [rules.required('La fecha de cierre es obligatoria')],
    responseType: [rules.required('Selecciona un tipo de respuesta')],
    surveyType:   [rules.required('Selecciona un tipo de encuesta')],
    eventId:      [rules.required('Selecciona un evento')],
}

const CROSS_VALIDATE: CrossValidateFn<SurveyFormFields> = (values, addError) => {
    const opens = values['opensAt'] as string
    const closes = values['closesAt'] as string
    if (opens && closes && new Date(closes) <= new Date(opens)) {
        addError('closesAt', 'La fecha de cierre debe ser posterior a la de apertura')
    }
}

interface SurveyFormProps {
    /** null → modo creación; SurveyDTO → modo edición */
    editing: SurveyDTO | null
    formPayload: CreateSurveyRequestDTO
    setFormPayload: (payload: CreateSurveyRequestDTO) => void
    formOpensAt: string
    setFormOpensAt: (v: string) => void
    formClosesAt: string
    setFormClosesAt: (v: string) => void
    responseTypes: ResponseType[]
    surveyTypes: SurveyType[]
    availableEvents: EventDTO[]
    loadingOptions: boolean
    saving: boolean
    onSave: () => void
    onCancel: () => void
}

/**
 * SurveyForm — Formulario compartido para crear y editar encuestas.
 *
 * RESPONSABILIDAD:
 * Renderiza los campos de la encuesta: tipo de respuesta, tipo de encuesta,
 * evento vinculado, título, fechas de apertura/cierre y descripción,
 * junto a la botonera de guardar/cancelar.
 *
 * POR QUÉ SE EXTRAE:
 * El bloque <form> inline en SurveysPage ocupaba ~65 líneas JSX, superando el
 * umbral de 40. Extraerlo deja SurveysPage centrado en la orquestación de
 * estado, efectos y llamadas a la API, y hace el formulario testeable de
 * forma aislada.
 *
 * DECISIONES DE DISEÑO:
 * - Un solo componente con prop `editing: SurveyDTO | null` en lugar de dos
 *   (SurveyCreateForm / SurveyEditForm). Los campos son estructuralmente
 *   idénticos; la única diferencia es que en modo edición responseType solo
 * puede cambiarse si la encuesta está en estado DRAFT, y eventId queda siempre
 * deshabilitado tras crear. Esto no justifica duplicar el JSX.
 * - Presentacional controlado: no llama a la API ni gestiona estado propio.
 *   La conversión de fechas datetime-local → ISO Instant se hace en los
 *   handlers del padre (datetimeLocalToISOInstant), manteniéndose agnóstico
 *   del formato de la API.
 * - setFormPayload recibe el objeto completo con spread para mantener la
 *   misma API que el estado del padre y evitar proliferación de callbacks.
 * - El trigger del save es type="button" onClick en lugar de form onSubmit,
 *   consistente con EventForm y con el patrón del resto de páginas.
 */
export function SurveyForm({
    editing,
    formPayload,
    setFormPayload,
    formOpensAt,
    setFormOpensAt,
    formClosesAt,
    setFormClosesAt,
    responseTypes,
    surveyTypes,
    availableEvents,
    loadingOptions,
    saving,
    onSave,
    onCancel,
}: SurveyFormProps) {
    const isEdit = editing !== null

    const { errors, validate, clearError } = useFormValidation<SurveyFormFields>(
        VALIDATION_RULES,
        CROSS_VALIDATE
    )

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        const valid = validate({
            title:        formPayload.title,
            opensAt:      formOpensAt,
            closesAt:     formClosesAt,
            responseType: formPayload.responseType,
            surveyType:   formPayload.surveyType,
            eventId:      formPayload.eventId,
        })
        if (!valid) return
        onSave()
    }

    return (
        <form className="form-card" noValidate onSubmit={handleSubmit}>
            <h2 className="section-title">
                {isEdit ? 'Editar encuesta' : 'Crear encuesta'}
            </h2>

            {/* Línea 1: Tipo de respuesta, Tipo de encuesta, Evento */}
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '0.75rem' }}>
                <div className="form-field">
                    <label className="label-text">Tipo de respuesta *</label>
                    <select
                        value={formPayload.responseType}
                        onChange={e => { clearError('responseType'); setFormPayload({ ...formPayload, responseType: e.target.value }) }}
                        disabled={(isEdit && editing?.status !== 'DRAFT') || loadingOptions}
                        className={`select-base${errors.responseType ? ' input--error' : ''}`}
                    >
                        <option value="">Selecciona tipo</option>
                        {responseTypes.map(type => (
                            <option key={type} value={type}>{translateResponseType(type)}</option>
                        ))}
                    </select>
                    {errors.responseType && <span className="field-error">{errors.responseType}</span>}
                </div>
                <div className="form-field">
                    <label className="label-text">Tipo de encuesta *</label>
                    <select
                        value={formPayload.surveyType}
                        onChange={e => { clearError('surveyType'); setFormPayload({ ...formPayload, surveyType: e.target.value }) }}
                        disabled={loadingOptions}
                        className={`select-base${errors.surveyType ? ' input--error' : ''}`}
                    >
                        <option value="">Selecciona tipo</option>
                        {surveyTypes.map(type => (
                            <option key={type} value={type}>{translateSurveyType(type)}</option>
                        ))}
                    </select>
                    {errors.surveyType && <span className="field-error">{errors.surveyType}</span>}
                </div>
                <div className="form-field">
                    <label className="label-text">Evento *</label>
                    <select
                        value={formPayload.eventId}
                        onChange={e => { clearError('eventId'); setFormPayload({ ...formPayload, eventId: e.target.value }) }}
                        disabled={isEdit || loadingOptions}
                        className={`select-base${errors.eventId ? ' input--error' : ''}`}
                    >
                        <option value="">Selecciona un evento</option>
                        {availableEvents.map(evt => (
                            <option key={evt.id} value={evt.id}>{evt.title}</option>
                        ))}
                    </select>
                    {errors.eventId && <span className="field-error">{errors.eventId}</span>}
                </div>
            </div>

            {/* Línea 2: Título (2 cols), Fecha apertura, Fecha cierre */}
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '0.75rem' }}>
                <div className="form-field" style={{ gridColumn: 'span 2' }}>
                    <label className="label-text">Título *</label>
                    <input
                        type="text"
                        value={formPayload.title}
                        onChange={e => { clearError('title'); setFormPayload({ ...formPayload, title: e.target.value }) }}
                        maxLength={200}
                        className={`input-full-width${errors.title ? ' input--error' : ''}`}
                    />
                    {errors.title && <span className="field-error">{errors.title}</span>}
                </div>
                <div className="form-field">
                    <label className="label-text">Fecha apertura *</label>
                    <input
                        type="datetime-local"
                        value={formOpensAt}
                        onChange={e => { clearError('opensAt'); setFormOpensAt(e.target.value) }}
                        className={`input-full-width${errors.opensAt ? ' input--error' : ''}`}
                    />
                    {errors.opensAt && <span className="field-error">{errors.opensAt}</span>}
                </div>
                <div className="form-field">
                    <label className="label-text">Fecha cierre *</label>
                    <input
                        type="datetime-local"
                        value={formClosesAt}
                        onChange={e => { clearError('closesAt'); setFormClosesAt(e.target.value) }}
                        className={`input-full-width${errors.closesAt ? ' input--error' : ''}`}
                    />
                    {errors.closesAt && <span className="field-error">{errors.closesAt}</span>}
                </div>
            </div>

            {/* Línea 3: Descripción */}
            <div className="form-grid">
                <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                    <label className="label-text">Descripción</label>
                    <textarea
                        value={formPayload.description}
                        onChange={e => setFormPayload({ ...formPayload, description: e.target.value })}
                        maxLength={4000}
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
