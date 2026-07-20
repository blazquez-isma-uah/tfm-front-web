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
import { EventSelectOptions } from '../../components/EventSelectOptions'
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
 * evento vinculado, título, fechas de apertura/cierre, descripción, y botonera
 * de guardar/cancelar. Adaptado automáticamente a modo creación o edición
 * según la prop `editing`.
 *
 * POR QUÉ UN SOLO COMPONENTE:
 * Los campos son estructuralmente idénticos en ambos modos (create/edit).
 * Solo cambia que en modo edición el campo responseType es de solo lectura si
 * el estado es CLOSED/CANCELLED, y eventId siempre es de solo lectura tras crear.\n * Esto no justifica duplicar el JSX en dos componentes (SurveyCreateForm / SurveyEditForm).
 *
 * VALIDACIÓN DE FECHAS:
 * La validación cruzada usa crossValidate (del hook useFormValidation), no
 * lógica manual con showToast. Ventaja: el error aparece inline bajo el campo
 * (field-error), no como notificación flotante. Así el usuario tiene feedback
 * inmediato y contextualizado.
 *
 * DECISIONES DE DISEÑO:
 * - Presentacional controlado: no llama a la API ni gestiona estado propio.
 *   El flujo de error/saving viene del padre (SurveysPage) para mantener
 *   los mensajes de error en la misma posición.
 * - setFormPayload recibe el objeto completo (con spread) en lugar de setters
 *   individuales, para mantener la misma API que el estado del padre.
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

    /**
     * Maneja el envío del formulario. Realiza dos pasos de validación:
     * 1. Validación de campos individuales (requeridos, formato)
     * 2. Validación cruzada de fechas (opensAt < closesAt) mediante crossValidate
     * Si pasa ambas, llama onSave(). Si falla, los errores aparecen inline.
     */
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
        // noValidate desactiva la validación nativa del navegador (HTML5 constraint validation).
        // Usamos nuestra propia validación con useFormValidation para tener control total
        // sobre los mensajes de error, su posición (inline bajo el campo), y el momento
        // de mostrarlos (al hacer submit, no al perder el foco).
        <form className="form-card" noValidate onSubmit={handleSubmit}>
            <h2 className="section-title">
                {isEdit ? 'Editar encuesta' : 'Crear encuesta'}
            </h2>

            {/* Línea 1: Tipo de respuesta, Tipo de encuesta, Evento */}
            <div className="form-grid form-grid--survey-line1" style={{ marginBottom: '0.75rem' }}>
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
                        <EventSelectOptions events={availableEvents} />
                    </select>
                    {errors.eventId && <span className="field-error">{errors.eventId}</span>}
                </div>
            </div>

            {/* Línea 2: Título (2 cols), Fecha apertura, Fecha cierre */}
            <div className="form-grid form-grid--survey-line2" style={{ marginBottom: '0.75rem' }}>
                <div className="form-field form-grid--survey-title-field">
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
