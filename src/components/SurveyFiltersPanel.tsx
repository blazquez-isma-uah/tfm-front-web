import type { FormEvent, ReactNode } from 'react'
import type { SurveyStatus } from '../types/surveys'
import type { EventDTO } from '../types/events'
import { SearchFiltersPanel } from './Searchfilterspanel'
import { translateSurveyStatus } from '../utils/surveyTranslations'
import '../styles/common.css'

interface SurveyFiltersPanelProps {
    // Valores del formulario (lo que el usuario ve mientras edita)
    filterTitle: string
    setFilterTitle: (v: string) => void
    filterEventId: string
    setFilterEventId: (v: string) => void
    filterStatus: SurveyStatus | ''
    setFilterStatus: (v: SurveyStatus | '') => void
    filterOpensAtFrom: string
    setFilterOpensAtFrom: (v: string) => void
    filterOpensAtTo: string
    setFilterOpensAtTo: (v: string) => void
    filterClosesAtFrom: string
    setFilterClosesAtFrom: (v: string) => void
    filterClosesAtTo: string
    setFilterClosesAtTo: (v: string) => void
    // Opciones de los selectores (cargadas de la API en SurveysPage)
    surveyStatuses: SurveyStatus[]
    availableEvents: EventDTO[]
    loadingOptions: boolean
    // Metadatos del panel
    activeFiltersCount: number
    onSubmit: (e: FormEvent) => void
    onReset: () => void
    actionButton?: ReactNode
}

/**
 * SurveyFiltersPanel — Formulario de filtros de búsqueda para encuestas.
 *
 * RESPONSABILIDAD:
 * Renderiza el formulario de filtros de encuestas (título, evento, estado
 * y cuatro rangos de fechas de apertura/cierre) envuelto en SearchFiltersPanel
 * para comportamiento colapsable y badge de filtros activos.
 *
 * POR QUÉ SE EXTRAE:
 * El bloque de búsqueda inline en SurveysPage ocupaba ~55 líneas JSX,
 * superando el umbral de 40. Mezclaba la presentación de filtros con
 * la lógica de orquestación de SurveysPage. Extraerlo deja SurveysPage
 * centrado en estado, efectos y ciclo de vida de encuestas.
 *
 * DECISIONES DE DISEÑO:
 * - Presentacional controlado: todo el estado viene del padre; este componente
 *   no gestiona estado propio ni llama a la API.
 * - activeFiltersCount lo calcula el padre sobre los search* (filtros aplicados),
 *   no sobre los filter* (lo que el usuario está editando en el formulario).
 *   Así el badge refleja la búsqueda activa real, no el estado del formulario.
 * - El selector de Evento usa el array `availableEvents` precargado por SurveysPage
 *   (lista completa de eventos, tamaño ~1000). El componente no hace fetch propio.
 * - Las fechas usan datetime-local; la conversión a ISO Instant se delega al
 *   handler del padre (datetimeLocalToISOInstant).
 */
export function SurveyFiltersPanel({
    filterTitle,        setFilterTitle,
    filterEventId,      setFilterEventId,
    filterStatus,       setFilterStatus,
    filterOpensAtFrom,  setFilterOpensAtFrom,
    filterOpensAtTo,    setFilterOpensAtTo,
    filterClosesAtFrom, setFilterClosesAtFrom,
    filterClosesAtTo,   setFilterClosesAtTo,
    surveyStatuses,
    availableEvents,
    loadingOptions,
    activeFiltersCount,
    onSubmit,
    onReset,
    actionButton,
}: SurveyFiltersPanelProps) {
    return (
        <SearchFiltersPanel
            activeFiltersCount={activeFiltersCount}
            onSubmit={onSubmit}
            actionButton={actionButton}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                {/* Grupo 1: Título, Evento, Estado */}
                <div className="search-grid">
                    <div className="form-field">
                        <span className="label-text">Título</span>
                        <input
                            type="text"
                            placeholder="Buscar por título"
                            value={filterTitle}
                            onChange={e => setFilterTitle(e.target.value)}
                            className="input-full-width"
                        />
                    </div>
                    <div className="form-field">
                        <span className="label-text">Evento</span>
                        <select
                            value={filterEventId}
                            onChange={e => setFilterEventId(e.target.value)}
                            className="select-base"
                            disabled={loadingOptions}
                        >
                            <option value="">Todos</option>
                            {availableEvents.map(evt => (
                                <option key={evt.id} value={evt.id}>{evt.title}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-field">
                        <span className="label-text">Estado</span>
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value as SurveyStatus | '')}
                            className="select-base"
                            disabled={loadingOptions}
                        >
                            <option value="">Todos</option>
                            {surveyStatuses.map(s => (
                                <option key={s} value={s}>{translateSurveyStatus(s)}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Grupo 2: Rangos de fechas de apertura y cierre */}
                <div className="search-grid">
                    <div className="form-field">
                        <span className="label-text">Fecha apertura (desde)</span>
                        <input
                            type="datetime-local"
                            value={filterOpensAtFrom}
                            onChange={e => setFilterOpensAtFrom(e.target.value)}
                            className="input-full-width"
                        />
                    </div>
                    <div className="form-field">
                        <span className="label-text">Fecha apertura (hasta)</span>
                        <input
                            type="datetime-local"
                            value={filterOpensAtTo}
                            onChange={e => setFilterOpensAtTo(e.target.value)}
                            className="input-full-width"
                        />
                    </div>
                    <div className="form-field">
                        <span className="label-text">Fecha cierre (desde)</span>
                        <input
                            type="datetime-local"
                            value={filterClosesAtFrom}
                            onChange={e => setFilterClosesAtFrom(e.target.value)}
                            className="input-full-width"
                        />
                    </div>
                    <div className="form-field">
                        <span className="label-text">Fecha cierre (hasta)</span>
                        <input
                            type="datetime-local"
                            value={filterClosesAtTo}
                            onChange={e => setFilterClosesAtTo(e.target.value)}
                            className="input-full-width"
                        />
                    </div>
                </div>
            </div>

            <div className="search-actions-row" style={{ justifyContent: 'space-between' }}>
                <button type="submit" className="button-primary">Buscar</button>
                <button
                    type="button"
                    className="button-subtle"
                    onClick={onReset}
                    style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}
                >
                    Resetear filtros
                </button>
            </div>
        </SearchFiltersPanel>
    )
}
