import { type FormEvent, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { extractErrorMessage } from '../../utils/errorHandler'
import {
    searchEventsPage,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    getAvailableEventTypes,
    getAvailableEventStatuses,
    getAvailableEventVisibilities,
    getCalendar,
    type EventSearchParams,
} from '../../api/eventsApi'
import {
    getMyAnsweredSurveys,
    getMyNotAnsweredSurveys,
} from '../../api/surveysApi'
import type {
    EventDTO,
    EventCreateRequestDTO,
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
import { EventDetailCard } from '../../components/EventDetailCard'
import { EventDetailCardComplete } from '../../components/EventDetailCardComplete'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EventFiltersPanel } from '../../components/EventFiltersPanel'
import { EventCalendarView } from '../../components/EventCalendarView'
import { EventForm } from '../../components/EventForm'
import { EditIcon, TrashIcon } from '../../components/Icons'
import { usePagination, useSorting, useConfirmDialog, useRowExpansion } from '../../hooks'
import { useToast } from '../../context/toast/ToastContext'
import { ErrorState } from '../../components/ErrorState'
import '../../styles/common.css'

/**
 * EventsPage — Lista de eventos para usuarios y administración de eventos para admins.
 *
 * Un mismo componente sirve dos contextos dependiendo de la ruta:
 *   - /events       → vista de usuario (tabs: MIS_EVENTOS, PENDIENTES, CALENDARIO, BUSQUEDA)
 *   - /admin/events → vista admin (solo BUSQUEDA + acciones CRUD)
 *
 * HOOKS APLICADOS:
 * - usePagination:    sustituye page/size/totalPages/totalElements
 * - useSorting:       sustituye sortField/sortDirection/sortState con valor inicial 'startAt'
 * - useConfirmDialog: sustituye el estado confirmDialog inline
 * - useRowExpansion:  sustituye expandedEventId/isClosing
 *
 * NOTA SOBRE handleViewDetails:
 * A diferencia de InstrumentsPage, aquí no hay efecto secundario asíncrono al expandir
 * (el evento ya está en memoria). Sin embargo, el componente mantiene 'selectedEvent'
 * como referencia al evento activo para el flujo de edición. Por eso se combina
 * rowExpansion.toggle/close con setSelectedEvent manualmente.
 */

type ViewMode = 'LIST' | 'DETAIL' | 'EDIT' | 'CREATE'
type TabType  = 'MIS_EVENTOS' | 'PENDIENTES' | 'CALENDARIO' | 'BUSQUEDA'
type SortableField = 'title' | 'type' | 'status' | 'startAt' | 'location'

// ── Helpers de conversión de fechas ──────────────────────────────────────────
// Se definen a nivel de módulo para poder usarlas tanto en handlers como en effects
// sin depender del orden de declaración dentro del componente.

/** Convierte un valor datetime-local (YYYY-MM-DDTHH:mm) a ISO Instant UTC */
function datetimeLocalToISOInstant(datetimeLocal: string): string {
    return `${datetimeLocal}:00.000Z`
}

/** Convierte un ISO Instant a formato datetime-local (YYYY-MM-DDTHH:mm) */
function toDateTimeLocal(isoString: string): string {
    try {
        const match = isoString.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/)
        return match ? match[1] : ''
    } catch {
        return ''
    }
}

function EventsPage() {
    const location = useLocation()
    const { token } = useAuth()
    const { showToast } = useToast()

    const isAdminView = location.pathname.startsWith('/admin/events')

    const [activeTab, setActiveTab] = useState<TabType>(isAdminView ? 'BUSQUEDA' : 'MIS_EVENTOS')

    const [events, setEvents]               = useState<EventDTO[]>([])
    const [calendarEvents, setCalendarEvents] = useState<CalendarEventItemDTO[]>([])
    const [loading, setLoading]             = useState(false)
    const [error, setError]                 = useState<string | null>(null)
    const [saving, setSaving]               = useState(false)

    // ── Hooks de estado reutilizable ──────────────────────────────────────────
    const pagination   = usePagination({ defaultSize: 10 })
    // useSorting con valor inicial 'startAt': el primer click en esa columna
    // invertirá a DESC en lugar de establecerlo desde null.
    const sorting      = useSorting<SortableField>('startAt')
    const confirm      = useConfirmDialog()
    const rowExpansion = useRowExpansion<string>()

    // ── Estado propio del componente (no genérico) ────────────────────────────
    const [mode, setMode]                 = useState<ViewMode>('LIST')
    const [selectedEvent, setSelectedEvent] = useState<EventDTO | null>(null)

    // Opciones de los selectores (cargadas de la API una sola vez)
    const [eventTypes, setEventTypes]           = useState<EventType[]>([])
    const [eventStatuses, setEventStatuses]     = useState<EventStatus[]>([])
    const [eventVisibilities, setEventVisibilities] = useState<EventVisibility[]>([])
    const [loadingOptions, setLoadingOptions]   = useState(false)

    // Filtros visibles (lo que el usuario ve en el formulario)
    const [filterTitle, setFilterTitle]             = useState('')
    const [filterLocation, setFilterLocation]       = useState('')
    const [filterType, setFilterType]               = useState<EventType | ''>('')
    const [filterStatus, setFilterStatus]           = useState<EventStatus | ''>('')
    const [filterVisibility, setFilterVisibility]   = useState<EventVisibility | ''>('')
    const [filterStartAtFrom, setFilterStartAtFrom] = useState('')
    const [filterStartAtTo, setFilterStartAtTo]     = useState('')
    const [filterEndAtFrom, setFilterEndAtFrom]     = useState('')
    const [filterEndAtTo, setFilterEndAtTo]         = useState('')

    // Filtros efectivos (los que disparan la búsqueda al cambiar)
    const [searchTitle, setSearchTitle]                 = useState('')
    const [searchLocation, setSearchLocation]           = useState('')
    const [searchType, setSearchType]                   = useState<EventType | undefined>(undefined)
    const [searchStatus, setSearchStatus]               = useState<EventStatus | undefined>(undefined)
    const [searchVisibility, setSearchVisibility]       = useState<EventVisibility | undefined>(undefined)
    const [searchStartAtFrom, setSearchStartAtFrom]     = useState<string | undefined>(undefined)
    const [searchStartAtTo, setSearchStartAtTo]         = useState<string | undefined>(undefined)
    const [searchEndAtFrom, setSearchEndAtFrom]         = useState<string | undefined>(undefined)
    const [searchEndAtTo, setSearchEndAtTo]             = useState<string | undefined>(undefined)
    const [searchTrigger, setSearchTrigger]             = useState(0)

    // Estado del calendario
    const [currentMonth, setCurrentMonth] = useState(new Date())

    // Formulario crear/editar
    const [formStartAt, setFormStartAt] = useState('')
    const [formEndAt, setFormEndAt]     = useState('')
    const [formPayload, setFormPayload] = useState<Omit<EventCreateRequestDTO, 'startAt' | 'endAt'>>({
        title: '',
        description: '',
        location: '',
        type: '',
        status: '',
        visibility: '',
    })

    // ── Columnas de la tabla ──────────────────────────────────────────────────
    const baseColumns = [
        {
            key: 'title',
            header: 'Título',
            sortable: true,
            sortField: 'title' as SortableField,
            width: isAdminView ? '25%' : '30%',
        },
        {
            key: 'type',
            header: 'Tipo',
            sortable: true,
            sortField: 'type' as SortableField,
            width: isAdminView ? '15%' : '18%',
            render: (e: EventDTO) => translateEventType(e.type),
        },
        {
            key: 'status',
            header: 'Estado',
            sortable: true,
            sortField: 'status' as SortableField,
            width: isAdminView ? '12%' : '15%',
            render: (e: EventDTO) => translateEventStatus(e.status),
        },
        {
            key: 'startAt',
            header: 'Fecha inicio',
            sortable: true,
            sortField: 'startAt' as SortableField,
            width: isAdminView ? '18%' : '20%',
            render: (e: EventDTO) => formatEventDateTime(e.startAt),
        },
        {
            key: 'location',
            header: 'Localización',
            sortable: true,
            sortField: 'location' as SortableField,
            width: isAdminView ? '15%' : '17%',
            render: (e: EventDTO) => e.location || '-',
        },
    ]

    const actionsColumn = {
        key: 'actions',
        header: 'Acciones',
        sortable: false,
        width: '15%',
        render: (e: EventDTO) => (
            <div className="actions-container">
                <span className="tooltip-wrap" data-tooltip="Editar">
                    <button
                        type="button"
                        className="btn-icon btn-icon-edit"
                        onClick={(ev) => { ev.stopPropagation(); handleEditEvent(e) }}
                    ><EditIcon /></button>
                </span>
                <span className="tooltip-wrap" data-tooltip="Eliminar">
                    <button
                        type="button"
                        className="btn-icon btn-icon-danger"
                        onClick={(ev) => { ev.stopPropagation(); handleDeleteEvent(e) }}
                    ><TrashIcon /></button>
                </span>
            </div>
        ),
    }

    const eventColumns = isAdminView ? [...baseColumns, actionsColumn] : baseColumns

    // ── Effects ───────────────────────────────────────────────────────────────

    // Cargar opciones de selectores (una sola vez al montar)
    useEffect(() => {
        if (!token) return

        const loadOptions = async () => {
            try {
                setLoadingOptions(true)
                const [types, statuses, visibilities] = await Promise.all([
                    getAvailableEventTypes(token),
                    getAvailableEventStatuses(token),
                    getAvailableEventVisibilities(token),
                ])
                setEventTypes(types)
                setEventStatuses(statuses)
                setEventVisibilities(visibilities)
            } catch (e) {
                console.error('Error loading options', e)
            } finally {
                setLoadingOptions(false)
            }
        }

        loadOptions()
    }, [token])

    // Cargar eventos cuando cambien tab, paginación, ordenación, filtros o trigger
    useEffect(() => {
        if (!token) return
        if (isAdminView || activeTab === 'BUSQUEDA') {
            loadSearchEvents()
        } else if (activeTab === 'MIS_EVENTOS') {
            loadMyEvents()
        } else if (activeTab === 'PENDIENTES') {
            loadPendingEvents()
        } else if (activeTab === 'CALENDARIO') {
            loadCalendarEvents()
        }
    }, [
        token,
        activeTab,
        pagination.page,
        pagination.size,
        sorting.field,
        sorting.direction,
        searchTitle,
        searchLocation,
        searchType,
        searchStatus,
        searchVisibility,
        searchStartAtFrom,
        searchStartAtTo,
        searchEndAtFrom,
        searchEndAtTo,
        searchTrigger,
        currentMonth,
    ])

    // ── Funciones de carga ────────────────────────────────────────────────────

    const loadSearchEvents = async () => {
        if (!token) return
        try {
            setLoading(true)
            setError(null)

            const sortParam = sorting.field
                ? [`${sorting.field},${sorting.direction}`]
                : ['startAt,asc']

            const params: EventSearchParams = {
                page:       pagination.page,
                size:       pagination.size,
                sort:       sortParam,
                title:      searchTitle    || undefined,
                location:   searchLocation || undefined,
                type:       searchType,
                status:     searchStatus,
                visibility: searchVisibility,
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

    const loadMyEvents = async () => {
        if (!token) return
        try {
            setLoading(true)
            setError(null)

            const now = new Date().toISOString()
            const surveySortField = sorting.field === 'startAt' ? 'opensAt'
                                  : sorting.field === 'title'   ? 'title'
                                  : 'opensAt'
            const sortParam = [`${surveySortField},${sorting.direction}`]

            const surveysResponse = await getMyAnsweredSurveys(
                { surveyType: 'ATTENDANCE', page: pagination.page, size: pagination.size, sort: sortParam },
                token
            )

            if (surveysResponse.content.length > 0) {
                const eventIds      = [...new Set(surveysResponse.content.map(s => s.eventId))]
                const eventsData    = await Promise.all(eventIds.map(id => getEventById(id, token)))
                const futureEvents  = eventsData.filter(e => new Date(e.startAt) >= new Date(now))
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
            const surveySortField = sorting.field === 'startAt' ? 'opensAt'
                                  : sorting.field === 'title'   ? 'title'
                                  : 'opensAt'
            const sortParam = [`${surveySortField},${sorting.direction}`]

            const surveysResponse = await getMyNotAnsweredSurveys(
                {
                    surveyType: 'ATTENDANCE',
                    status:     'OPEN',
                    opensTo:    now,
                    closesFrom: now,
                    page:       pagination.page,
                    size:       pagination.size,
                    sort:       sortParam,
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
            console.error('Error loading calendar events:', e)
            setError('Error cargando calendario')
        } finally {
            setLoading(false)
        }
    }

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault()
        setSearchTitle(filterTitle)
        setSearchLocation(filterLocation)
        setSearchType(filterType       || undefined)
        setSearchStatus(filterStatus   || undefined)
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

    // handleSort: resetea página además de cambiar ordenación (mismo patrón que InstrumentsPage)
    const handleSort = (field: SortableField) => {
        pagination.goToPage(0)
        sorting.handleSortChange(field)
    }

    // handleViewDetails: la expansión no tiene efecto secundario asíncrono en esta página
    // (el evento ya está en el array 'events'), pero mantenemos 'selectedEvent' como
    // referencia para el flujo de edición.
    const handleViewDetails = (event: EventDTO) => {
        if (rowExpansion.expandedId === event.id) {
            rowExpansion.close()
            setTimeout(() => setSelectedEvent(null), 250)
        } else {
            rowExpansion.toggle(event.id)
            setSelectedEvent(event)
        }
    }

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab)
        pagination.goToPage(0)
        rowExpansion.forceClose()
        setSelectedEvent(null)
    }

    const handleOpenCreateEvent = () => {
        setFormPayload({
            title: '',
            description: '',
            location: '',
            type:       eventTypes[0]       || '',
            status:     eventStatuses[0]    || '',
            visibility: eventVisibilities[0] || '',
        })
        setFormStartAt('')
        setFormEndAt('')
        setMode('CREATE')
    }

    const handleEditEvent = (event: EventDTO) => {
        setFormPayload({
            title:       event.title,
            description: event.description || '',
            location:    event.location    || '',
            type:        event.type,
            status:      event.status,
            visibility:  event.visibility,
        })
        setFormStartAt(toDateTimeLocal(event.startAt))
        setFormEndAt(toDateTimeLocal(event.endAt))
        setSelectedEvent(event)
        setMode('EDIT')
    }

    const handleCancelForm = () => {
        setMode('LIST')
        setSelectedEvent(null)
    }

    const handleCreateEvent = async () => {
        if (!token) return
        try {
            setSaving(true)
            setError(null)
            const payload: EventCreateRequestDTO = {
                ...formPayload,
                startAt: datetimeLocalToISOInstant(formStartAt),
                endAt:   datetimeLocalToISOInstant(formEndAt),
            }
            await createEvent(payload, token)
            showToast('Evento creado correctamente', 'success')
            setMode('LIST')
            setSearchTrigger(prev => prev + 1)
        } catch (e: any) {
            console.error('Error creating event:', e)
            showToast(extractErrorMessage(e, 'Error creando evento'), 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleUpdateEvent = async () => {
        if (!token || !selectedEvent) return
        try {
            setSaving(true)
            setError(null)
            const payload: EventCreateRequestDTO = {
                ...formPayload,
                startAt: datetimeLocalToISOInstant(formStartAt),
                endAt:   datetimeLocalToISOInstant(formEndAt),
            }
            await updateEvent(selectedEvent.id, selectedEvent.version, payload, token)
            showToast('Evento actualizado correctamente', 'success')
            setMode('LIST')
            setSearchTrigger(prev => prev + 1)
            // Cerrar la fila expandida del evento editado sin animación
            rowExpansion.forceClose()
            setSelectedEvent(null)
        } catch (e: any) {
            console.error('Error updating event:', e)
            const status = e?.response?.status
            if (status === 412 || status === 428) {
                showToast('El evento ha sido modificado. Recarga los datos.', 'error')
            } else {
                showToast(extractErrorMessage(e, 'Error actualizando evento'), 'error')
            }
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteEvent = (event: EventDTO) => {
        if (!token) return

        confirm.open({
            title:   'Eliminar evento',
            message: `¿Seguro que quieres eliminar el evento: "${event.title}"?\nEsta acción no se puede deshacer.`,
            variant: 'danger',
            onConfirm: async () => {
                confirm.close()
                try {
                    setError(null)
                    await deleteEvent(event.id, event.version, token)
                    showToast('Evento eliminado correctamente', 'success')
                    pagination.goToPage(0)
                    setSearchTrigger(prev => prev + 1)
                    if (selectedEvent?.id === event.id) {
                        rowExpansion.forceClose()
                        setSelectedEvent(null)
                    }
                } catch (e: any) {
                    console.error('Error deleting event:', e)
                    const status = e?.response?.status
                    if (status === 412 || status === 428) {
                        showToast('El evento ha sido modificado. Recarga los datos.', 'error')
                    } else {
                        showToast(extractErrorMessage(e, 'Error eliminando evento'), 'error')
                    }
                }
            },
        })
    }

    const handlePreviousMonth = () =>
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))

    const handleNextMonth = () =>
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))

    // ── Render helpers ────────────────────────────────────────────────────────

    const renderTabs = () => {
        if (isAdminView) return null

        const tabStyle = (tab: TabType): React.CSSProperties => ({
            padding: '0.75rem 1.5rem',
            border: 'none',
            backgroundColor: 'transparent',
            borderBottom: activeTab === tab ? '3px solid #1976d2' : 'none',
            color:      activeTab === tab ? '#1976d2' : '#666',
            fontWeight: activeTab === tab ? 600 : 400,
            cursor: 'pointer',
        })

        return (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '2px solid #e0e0e0' }}>
                <button type="button" onClick={() => handleTabChange('MIS_EVENTOS')}  style={tabStyle('MIS_EVENTOS')} >✅ Mis Eventos</button>
                <button type="button" onClick={() => handleTabChange('PENDIENTES')}   style={tabStyle('PENDIENTES')} >🕓 Eventos Pendientes</button>
                <button type="button" onClick={() => handleTabChange('CALENDARIO')}   style={tabStyle('CALENDARIO')} >📅 Calendario</button>
                <button type="button" onClick={() => handleTabChange('BUSQUEDA')}     style={tabStyle('BUSQUEDA')}   >🔍 Búsqueda</button>
            </div>
        )
    }

    const renderTabDescription = () => {
        if (isAdminView) return null

        const descriptions: Record<TabType, string> = {
            MIS_EVENTOS: 'Eventos futuros donde has respondido a su encuesta de asistencia',
            PENDIENTES:  'Eventos futuros con encuesta de asistencia abierta que aún no has respondido',
            CALENDARIO:  'Vista mensual de eventos',
            BUSQUEDA:    'Buscar eventos con filtros avanzados',
        }

        return (
            <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
                <p style={{ margin: 0, color: '#666' }}>{descriptions[activeTab]}</p>
            </div>
        )
    }

    const renderCalendarView = () => (
        <EventCalendarView
            currentMonth={currentMonth}
            calendarEvents={calendarEvents}
            onPrevMonth={handlePreviousMonth}
            onNextMonth={handleNextMonth}
        />
    )

    const renderSearchFilters = () => {
        if (!isAdminView && activeTab !== 'BUSQUEDA') return null

        const activeFiltersCount = [
            searchTitle, searchLocation, searchType, searchStatus, searchVisibility,
            searchStartAtFrom, searchStartAtTo, searchEndAtFrom, searchEndAtTo,
        ].filter(v => v !== '' && v !== undefined).length

        return (
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
                actionButton={isAdminView ? (
                    <button type="button" className="button-secondary" onClick={handleOpenCreateEvent}>
                        + Nuevo evento
                    </button>
                ) : undefined}
            />
        )
    }

    const renderEventsList = () => {
        if (activeTab === 'CALENDARIO') return null

        return (
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
                        renderExpandedContent={(event) =>
                            isAdminView ? (
                                <EventDetailCard
                                    event={event}
                                    onBack={() => {
                                        rowExpansion.close()
                                        setTimeout(() => setSelectedEvent(null), 250)
                                    }}
                                    backButtonLabel="Ocultar"
                                />
                            ) : (
                                <EventDetailCardComplete
                                    event={event}
                                    onBack={() => {
                                        rowExpansion.close()
                                        setTimeout(() => setSelectedEvent(null), 250)
                                    }}
                                    backButtonLabel="Ocultar"
                                />
                            )
                        }
                    />
                </div>
                <PaginationBar
                    {...pagination.barProps}
                    currentCount={events.length}
                />
            </>
        )
    }

    // ── Render principal ──────────────────────────────────────────────────────
    return (
        <div className="page-container">
            <h1 className="page-title">{isAdminView ? 'Administración de eventos' : 'Eventos'}</h1>

            {renderTabs()}
            {renderTabDescription()}

            {loading && <p>Cargando eventos...</p>}
            {error   && <ErrorState message={error} onRetry={() => setSearchTrigger(prev => prev + 1)} />}

            {!loading && !error && (
                <>
                    {activeTab === 'CALENDARIO' ? (
                        renderCalendarView()
                    ) : (
                        <>
                            {renderSearchFilters()}
                            {mode === 'LIST' && renderEventsList()}
                        </>
                    )}
                </>
            )}

            {/* FORMULARIO CREAR/EDITAR — solo para admin */}
            {isAdminView && (mode === 'CREATE' || mode === 'EDIT') && (
                <EventForm
                    editing={mode === 'EDIT' ? selectedEvent : null}
                    formPayload={formPayload}
                    setFormPayload={setFormPayload}
                    formStartAt={formStartAt}
                    setFormStartAt={setFormStartAt}
                    formEndAt={formEndAt}
                    setFormEndAt={setFormEndAt}
                    eventTypes={eventTypes}
                    eventStatuses={eventStatuses}
                    eventVisibilities={eventVisibilities}
                    saving={saving}
                    onSave={mode === 'CREATE' ? handleCreateEvent : handleUpdateEvent}
                    onCancel={handleCancelForm}
                />
            )}

            <ConfirmDialog {...confirm.dialogProps} />
        </div>
    )
}

export default EventsPage