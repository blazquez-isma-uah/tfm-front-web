import { type FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import {
    searchEventsPage,
    getEventById,
    getCalendar,
    type EventSearchParams,
} from '../../api/eventsApi'
import {
    getMyAnsweredSurveys,
    getMyNotAnsweredSurveys,
} from '../../api/surveysApi'
import type {
    EventDTO,
    EventType,
    EventStatus,
    EventVisibility,
    CalendarEventItemDTO,
} from '../../types/events'
import {
    translateEventType,
    translateEventStatus,
    formatEventDateTime,
} from '../../utils/eventTranslations'
import { PaginationBar } from '../../components/PaginationBar'
import { DataTable } from '../../components/DataTable'
import { EventDetailCardComplete } from './EventDetailCardComplete'
import { EventFiltersPanel } from './EventFiltersPanel'
import { EventCalendarView } from './EventCalendarView'
import { usePagination, useSorting, useRowExpansion } from '../../hooks'
import { ErrorState } from '../../components/ErrorState'
import { useStaticData } from '../../context/StaticDataContext'
import '../../styles/common.css'

/**
 * MyEventsPage — Vista de eventos para usuarios autenticados (MUSICIAN).
 *
 * RESPONSABILIDAD ÚNICA:
 * Consulta de eventos propios con cuatro modos de visualización (tabs).
 * No contiene lógica CRUD (crear, editar, eliminar). El usuario solo puede
 * ver eventos, responder encuestas de asistencia, y consultar resultados.
 *
 * TABS DISPONIBLES:
 *   - MIS_EVENTOS: eventos futuros donde el usuario ya respondió a encuesta
 *   - PENDIENTES:  eventos futuros con encuesta abierta sin responder aún
 *   - CALENDARIO:  vista mensual de todos los eventos del mes
 *   - BUSQUEDA:    búsqueda libre con filtros avanzados
 *
 * QUÉ PUEDE HACER EL MÚSICO:
 * - Ver detalles de un evento (información básica, encuestas asociadas)
 * - Responder o actualizar su respuesta a encuestas de asistencia
 * - Cambiar el mes en el calendario
 * - Filtrar y buscar eventos por título, tipo, estado, fecha
 *
 * QUÉ NO PUEDE HACER:
 * - Crear, editar o eliminar eventos (solo ADMIN)
 * - Ver eventos con visibilidad PRIVATE (solo ADMIN y creator)
 *
 * Ruta: /events
 * Requiere: Rol MUSICIAN
 */

type TabType = 'MIS_EVENTOS' | 'PENDIENTES' | 'CALENDARIO' | 'BUSQUEDA'
type SortableField = 'title' | 'type' | 'status' | 'startAt' | 'location'

const TAB_LABELS: Record<TabType, string> = {
    MIS_EVENTOS: 'Mis eventos',
    PENDIENTES:  'Pendientes',
    CALENDARIO:  'Calendario',
    BUSQUEDA:    'Búsqueda',
}

const TAB_DESCRIPTIONS: Record<TabType, string> = {
    MIS_EVENTOS: 'Eventos futuros donde has respondido a su encuesta de asistencia',
    PENDIENTES:  'Eventos futuros con encuesta de asistencia abierta que aún no has respondido',
    CALENDARIO:  'Vista mensual de eventos',
    BUSQUEDA:    'Buscar eventos con filtros avanzados',
}

function datetimeLocalToISOInstant(datetimeLocal: string): string {
    return `${datetimeLocal}:00.000Z`
}

function MyEventsPage() {
    const { token } = useAuth()

    const [activeTab, setActiveTab] = useState<TabType>('MIS_EVENTOS')

    const [events, setEvents]                 = useState<EventDTO[]>([])
    const [calendarEvents, setCalendarEvents] = useState<CalendarEventItemDTO[]>([])
    const [loading, setLoading]               = useState(false)
    const [error, setError]                   = useState<string | null>(null)

    const pagination   = usePagination({ defaultSize: 10 })
    const sorting      = useSorting<SortableField>('startAt')
    const rowExpansion = useRowExpansion<string>()

    const [currentMonth, setCurrentMonth]   = useState(new Date())

    // Opciones de selectores para la tab BUSQUEDA
    const { eventTypes, eventStatuses, eventVisibilities, isLoading: loadingOptions } = useStaticData()

    // Filtros visibles
    const [filterTitle, setFilterTitle]             = useState('')
    const [filterLocation, setFilterLocation]       = useState('')
    const [filterType, setFilterType]               = useState<EventType | ''>('')
    const [filterStatus, setFilterStatus]           = useState<EventStatus | ''>('')
    const [filterVisibility, setFilterVisibility]   = useState<EventVisibility | ''>('')
    const [filterStartAtFrom, setFilterStartAtFrom] = useState('')
    const [filterStartAtTo, setFilterStartAtTo]     = useState('')
    const [filterEndAtFrom, setFilterEndAtFrom]     = useState('')
    const [filterEndAtTo, setFilterEndAtTo]         = useState('')

    // Filtros efectivos
    const [searchTitle, setSearchTitle]             = useState('')
    const [searchLocation, setSearchLocation]       = useState('')
    const [searchType, setSearchType]               = useState<EventType | undefined>(undefined)
    const [searchStatus, setSearchStatus]           = useState<EventStatus | undefined>(undefined)
    const [searchVisibility, setSearchVisibility]   = useState<EventVisibility | undefined>(undefined)
    const [searchStartAtFrom, setSearchStartAtFrom] = useState<string | undefined>(undefined)
    const [searchStartAtTo, setSearchStartAtTo]     = useState<string | undefined>(undefined)
    const [searchEndAtFrom, setSearchEndAtFrom]     = useState<string | undefined>(undefined)
    const [searchEndAtTo, setSearchEndAtTo]         = useState<string | undefined>(undefined)
    const [searchTrigger, setSearchTrigger]         = useState(0)

    // ── Columnas (sin acciones — usuario no tiene CRUD) ───────────────────────

    const eventColumns = [
        { key: 'title',    header: 'Título',       sortable: true, sortField: 'title'    as SortableField, width: '30%' },
        { key: 'type',     header: 'Tipo',         sortable: true, sortField: 'type'     as SortableField, width: '18%', render: (e: EventDTO) => translateEventType(e.type) },
        { key: 'status',   header: 'Estado',       sortable: true, sortField: 'status'   as SortableField, width: '15%', render: (e: EventDTO) => translateEventStatus(e.status) },
        { key: 'startAt',  header: 'Fecha inicio', sortable: true, sortField: 'startAt'  as SortableField, width: '20%', render: (e: EventDTO) => formatEventDateTime(e.startAt) },
        { key: 'location', header: 'Localización', sortable: true, sortField: 'location' as SortableField, width: '17%', render: (e: EventDTO) => e.location || '-' },
    ]

    // ── Effects ───────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!token) return
        if (activeTab === 'MIS_EVENTOS') loadMyEvents()
        else if (activeTab === 'PENDIENTES') loadPendingEvents()
        else if (activeTab === 'CALENDARIO') loadCalendarEvents()
        else if (activeTab === 'BUSQUEDA') loadSearchEvents()
    }, [
        token, activeTab,
        pagination.page, pagination.size,
        sorting.field, sorting.direction,
        searchTitle, searchLocation, searchType, searchStatus, searchVisibility,
        searchStartAtFrom, searchStartAtTo, searchEndAtFrom, searchEndAtTo,
        searchTrigger, currentMonth,
    ])

    // ── Funciones de carga ────────────────────────────────────────────────────

    const loadMyEvents = async () => {
        if (!token) return
        try {
            setLoading(true)
            setError(null)
            const now = new Date().toISOString()
            const surveySortField = sorting.field === 'title' ? 'title' : 'opensAt'
            const surveysResponse = await getMyAnsweredSurveys(
                { surveyType: 'ATTENDANCE', page: pagination.page, size: pagination.size, sort: [`${surveySortField},${sorting.direction}`] },
                token
            )
            if (surveysResponse.content.length > 0) {
                const eventIds     = [...new Set(surveysResponse.content.map(s => s.eventId))]
                const eventsData   = await Promise.all(eventIds.map(id => getEventById(id, token)))
                const futureEvents = eventsData.filter(e => new Date(e.startAt) >= new Date(now))
                setEvents(futureEvents)
                pagination.setTotals(Math.ceil(futureEvents.length / pagination.size), futureEvents.length)
            } else {
                setEvents([])
                pagination.setTotals(0, 0)
            }
        } catch (e: any) {
            console.error('Error loading my events:', e)
            setError('Error cargando mis eventos')
        } finally {
            setLoading(false)
        }
    }

    const loadPendingEvents = async () => {
        if (!token) return
        try {
            setLoading(true)
            setError(null)
            const now = new Date().toISOString()
            const surveySortField = sorting.field === 'title' ? 'title' : 'opensAt'
            // Buscar encuestas NO respondidas de tipo ATTENDANCE
            // que cierren después de ahora (pueden estar abiertas o por abrir)
            const surveysResponse = await getMyNotAnsweredSurveys(
                {
                    surveyType: 'ATTENDANCE', status: 'OPEN',
                    closesFrom: now,  // Solo incluir encuestas que cierren en el futuro
                    page: pagination.page, size: pagination.size,
                    sort: [`${surveySortField},${sorting.direction}`],
                },
                token
            )
            if (surveysResponse.content.length > 0) {
                const eventIds     = [...new Set(surveysResponse.content.map(s => s.eventId))]
                const eventsData   = await Promise.all(eventIds.map(id => getEventById(id, token)))
                const futureEvents = eventsData.filter(e => new Date(e.startAt) >= new Date(now))
                setEvents(futureEvents)
                pagination.setTotals(Math.ceil(futureEvents.length / pagination.size), futureEvents.length)
            } else {
                setEvents([])
                pagination.setTotals(0, 0)
            }
        } catch (e: any) {
            console.error('Error loading pending events:', e)
            setError('Error cargando eventos pendientes')
        } finally {
            setLoading(false)
        }
    }

    const loadSearchEvents = async () => {
        if (!token) return
        try {
            setLoading(true)
            setError(null)
            const params: EventSearchParams = {
                page:        pagination.page,
                size:        pagination.size,
                sort:        sorting.field ? [`${sorting.field},${sorting.direction}`] : ['startAt,asc'],
                title:       searchTitle    || undefined,
                location:    searchLocation || undefined,
                type:        searchType,
                status:      searchStatus,
                visibility:  searchVisibility,
                startAtFrom: searchStartAtFrom,
                startAtTo:   searchStartAtTo,
                endAtFrom:   searchEndAtFrom,
                endAtTo:     searchEndAtTo,
            }
            const data = await searchEventsPage(params, token)
            setEvents(data.content)
            pagination.setTotals(data.totalPages, data.totalElements)
        } catch (e: any) {
            console.error('Error loading events:', e)
            setError('Error cargando eventos')
        } finally {
            setLoading(false)
        }
    }

    const loadCalendarEvents = async () => {
        if (!token) return
        try {
            setLoading(true)
            setError(null)
            const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
            const lastDay  = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59)
            const response = await getCalendar(
                firstDay.toISOString(), lastDay.toISOString(), 0, 100, 'startAt,asc', token
            )
            setCalendarEvents(response.content)
        } catch (e: any) {
            console.error('Error loading calendar:', e)
            setError('Error cargando calendario')
        } finally {
            setLoading(false)
        }
    }

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab)
        pagination.goToPage(0)
        rowExpansion.forceClose()
    }

    const handleViewDetails = (event: EventDTO) => {
        if (rowExpansion.expandedId === event.id) {
            rowExpansion.close()
        } else {
            rowExpansion.toggle(event.id)
        }
    }

    const handleSort = (field: SortableField) => {
        pagination.goToPage(0)
        sorting.handleSortChange(field)
    }

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault()
        setSearchTitle(filterTitle)
        setSearchLocation(filterLocation)
        setSearchType(filterType             || undefined)
        setSearchStatus(filterStatus         || undefined)
        setSearchVisibility(filterVisibility || undefined)
        setSearchStartAtFrom(filterStartAtFrom ? datetimeLocalToISOInstant(filterStartAtFrom) : undefined)
        setSearchStartAtTo(filterStartAtTo     ? datetimeLocalToISOInstant(filterStartAtTo)   : undefined)
        setSearchEndAtFrom(filterEndAtFrom     ? datetimeLocalToISOInstant(filterEndAtFrom)   : undefined)
        setSearchEndAtTo(filterEndAtTo         ? datetimeLocalToISOInstant(filterEndAtTo)     : undefined)
        pagination.goToPage(0)
    }

    const handleResetFilters = () => {
        setFilterTitle(''); setFilterLocation(''); setFilterType('')
        setFilterStatus(''); setFilterVisibility('')
        setFilterStartAtFrom(''); setFilterStartAtTo('')
        setFilterEndAtFrom(''); setFilterEndAtTo('')
        setSearchTitle(''); setSearchLocation('')
        setSearchType(undefined); setSearchStatus(undefined); setSearchVisibility(undefined)
        setSearchStartAtFrom(undefined); setSearchStartAtTo(undefined)
        setSearchEndAtFrom(undefined); setSearchEndAtTo(undefined)
        pagination.goToPage(0)
    }

    const activeFiltersCount = [
        searchTitle, searchLocation, searchType, searchStatus, searchVisibility,
        searchStartAtFrom, searchStartAtTo, searchEndAtFrom, searchEndAtTo,
    ].filter(v => v !== '' && v !== undefined).length

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="page-container">
            <h1 className="page-title">Eventos</h1>

            {/* Navegación por tabs */}
            <nav className="tab-nav" aria-label="Vistas de eventos">
                {(Object.keys(TAB_LABELS) as TabType[]).map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        className={`tab-nav__item${activeTab === tab ? ' tab-nav__item--active' : ''}`}
                        onClick={() => handleTabChange(tab)}
                        aria-current={activeTab === tab ? 'page' : undefined}
                    >
                        {TAB_LABELS[tab]}
                    </button>
                ))}
            </nav>

            {/* Descripción contextual de la tab activa */}
            <p className="tab-description">{TAB_DESCRIPTIONS[activeTab]}</p>

            {loading && <p>Cargando eventos...</p>}
            {error   && <ErrorState message={error} onRetry={() => setSearchTrigger(prev => prev + 1)} />}

            {!loading && !error && (
                <>
                    {activeTab === 'CALENDARIO' && (
                        <EventCalendarView
                            currentMonth={currentMonth}
                            calendarEvents={calendarEvents}
                            onPrevMonth={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                            onNextMonth={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                            onMonthChange={setCurrentMonth}
                        />
                    )}

                    {activeTab === 'BUSQUEDA' && (
                        <EventFiltersPanel
                            filterTitle={filterTitle}               setFilterTitle={setFilterTitle}
                            filterLocation={filterLocation}         setFilterLocation={setFilterLocation}
                            filterType={filterType}                 setFilterType={setFilterType}
                            filterStatus={filterStatus}             setFilterStatus={setFilterStatus}
                            filterVisibility={filterVisibility}     setFilterVisibility={setFilterVisibility}
                            filterStartAtFrom={filterStartAtFrom}   setFilterStartAtFrom={setFilterStartAtFrom}
                            filterStartAtTo={filterStartAtTo}       setFilterStartAtTo={setFilterStartAtTo}
                            filterEndAtFrom={filterEndAtFrom}       setFilterEndAtFrom={setFilterEndAtFrom}
                            filterEndAtTo={filterEndAtTo}           setFilterEndAtTo={setFilterEndAtTo}
                            eventTypes={eventTypes}
                            eventStatuses={eventStatuses}
                            eventVisibilities={eventVisibilities}
                            loadingOptions={loadingOptions}
                            activeFiltersCount={activeFiltersCount}
                            onSubmit={handleSearchSubmit}
                            onReset={handleResetFilters}
                        />
                    )}

                    {activeTab !== 'CALENDARIO' && (
                        <>
                            <div className="card">
                                <DataTable<EventDTO, SortableField>
                                    columns={eventColumns}
                                    data={events}
                                    sortState={sorting.state}
                                    onSortChange={handleSort}
                                    onRowClick={handleViewDetails}
                                    expandedRowId={rowExpansion.expandedId}
                                    isClosing={rowExpansion.isClosing}
                                    renderExpandedContent={(event) => (
                                        <EventDetailCardComplete
                                            event={event}
                                            onBack={() => {
                                                rowExpansion.close()
                                            }}
                                            backButtonLabel="Ocultar"
                                        />
                                    )}
                                />
                            </div>
                            <PaginationBar {...pagination.barProps} currentCount={events.length} />
                        </>
                    )}
                </>
            )}
        </div>
    )
}

export default MyEventsPage