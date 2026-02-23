import type { FormEvent, ReactNode } from 'react'
import type { EventType, EventStatus, EventVisibility } from '../types/events'
import { SearchFiltersPanel } from './Searchfilterspanel'
import {
    translateEventType,
    translateEventStatus,
    translateEventVisibility,
} from '../utils/eventTranslations'
import '../styles/common.css'

interface EventFiltersPanelProps {
    // Valores del formulario (lo que el usuario ve mientras edita)
    filterTitle: string
    setFilterTitle: (v: string) => void
    filterLocation: string
    setFilterLocation: (v: string) => void
    filterType: EventType | ''
    setFilterType: (v: EventType | '') => void
    filterStatus: EventStatus | ''
    setFilterStatus: (v: EventStatus | '') => void
    filterVisibility: EventVisibility | ''
    setFilterVisibility: (v: EventVisibility | '') => void
    filterStartAtFrom: string
    setFilterStartAtFrom: (v: string) => void
    filterStartAtTo: string
    setFilterStartAtTo: (v: string) => void
    filterEndAtFrom: string
    setFilterEndAtFrom: (v: string) => void
    filterEndAtTo: string
    setFilterEndAtTo: (v: string) => void
    // Opciones de los selectores (cargadas de la API en EventsPage)
    eventTypes: EventType[]
    eventStatuses: EventStatus[]
    eventVisibilities: EventVisibility[]
    loadingOptions: boolean
    // Metadatos del panel
    activeFiltersCount: number
    onSubmit: (e: FormEvent) => void
    onReset: () => void
    actionButton?: ReactNode
}

/**
 * EventFiltersPanel — Formulario de filtros de búsqueda para eventos.
 *
 * RESPONSABILIDAD:
 * Renderiza el formulario completo de filtros de eventos (título, localización,
 * tipo, estado, visibilidad y cuatro rangos de fechas) envuelto en
 * SearchFiltersPanel para obtener comportamiento colapsable y badge de activos.
 *
 * POR QUÉ SE EXTRAE:
 * El bloque renderSearchFilters() original tenía ~75 líneas JSX, superando
 * el umbral de 40. Mezclaba la presentación de los filtros con la lógica de
 * orquestación de EventsPage. Extraerlo deja EventsPage centrado en estado,
 * efectos y navegación entre modos (LIST/CREATE/EDIT).
 *
 * DECISIONES DE DISEÑO:
 * - Presentacional controlado: todo el estado viene del padre; este componente
 *   no gestiona estado propio ni llama a la API.
 * - activeFiltersCount lo calcula el padre sobre los search* (filtros aplicados),
 *   no sobre los filter* (lo que el usuario está editando). Así el badge refleja
 *   la búsqueda activa, no el formulario en edición.
 * - Los campos de fecha usan datetime-local; la conversión a ISO Instant se
 *   hace en el handler del padre (datetimeLocalToISOInstant), manteniendo este
 *   componente agnóstico del formato de la API.
 */
export function EventFiltersPanel({
    filterTitle,        setFilterTitle,
    filterLocation,     setFilterLocation,
    filterType,         setFilterType,
    filterStatus,       setFilterStatus,
    filterVisibility,   setFilterVisibility,
    filterStartAtFrom,  setFilterStartAtFrom,
    filterStartAtTo,    setFilterStartAtTo,
    filterEndAtFrom,    setFilterEndAtFrom,
    filterEndAtTo,      setFilterEndAtTo,
    eventTypes,
    eventStatuses,
    eventVisibilities,
    loadingOptions,
    activeFiltersCount,
    onSubmit,
    onReset,
    actionButton,
}: EventFiltersPanelProps) {
    return (
        <SearchFiltersPanel
            activeFiltersCount={activeFiltersCount}
            onSubmit={onSubmit}
            actionButton={actionButton}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                {/* Grupo 1: Título, Localización, Tipo, Estado, Visibilidad */}
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
                        <span className="label-text">Localización</span>
                        <input
                            type="text"
                            placeholder="Buscar por localización"
                            value={filterLocation}
                            onChange={e => setFilterLocation(e.target.value)}
                            className="input-full-width"
                        />
                    </div>
                    <div className="form-field">
                        <span className="label-text">Tipo</span>
                        <select
                            value={filterType}
                            onChange={e => setFilterType(e.target.value as EventType | '')}
                            className="select-base"
                            disabled={loadingOptions}
                        >
                            <option value="">Todos</option>
                            {eventTypes.map(t => (
                                <option key={t} value={t}>{translateEventType(t)}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-field">
                        <span className="label-text">Estado</span>
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value as EventStatus | '')}
                            className="select-base"
                            disabled={loadingOptions}
                        >
                            <option value="">Todos</option>
                            {eventStatuses.map(s => (
                                <option key={s} value={s}>{translateEventStatus(s)}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-field">
                        <span className="label-text">Visibilidad</span>
                        <select
                            value={filterVisibility}
                            onChange={e => setFilterVisibility(e.target.value as EventVisibility | '')}
                            className="select-base"
                            disabled={loadingOptions}
                        >
                            <option value="">Todas</option>
                            {eventVisibilities.map(v => (
                                <option key={v} value={v}>{translateEventVisibility(v)}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Grupo 2: Rangos de fechas de inicio y fin */}
                <div className="search-grid">
                    <div className="form-field">
                        <span className="label-text">Fecha inicio (desde)</span>
                        <input
                            type="datetime-local"
                            value={filterStartAtFrom}
                            onChange={e => setFilterStartAtFrom(e.target.value)}
                            className="input-full-width"
                        />
                    </div>
                    <div className="form-field">
                        <span className="label-text">Fecha inicio (hasta)</span>
                        <input
                            type="datetime-local"
                            value={filterStartAtTo}
                            onChange={e => setFilterStartAtTo(e.target.value)}
                            className="input-full-width"
                        />
                    </div>
                    <div className="form-field">
                        <span className="label-text">Fecha fin (desde)</span>
                        <input
                            type="datetime-local"
                            value={filterEndAtFrom}
                            onChange={e => setFilterEndAtFrom(e.target.value)}
                            className="input-full-width"
                        />
                    </div>
                    <div className="form-field">
                        <span className="label-text">Fecha fin (hasta)</span>
                        <input
                            type="datetime-local"
                            value={filterEndAtTo}
                            onChange={e => setFilterEndAtTo(e.target.value)}
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
