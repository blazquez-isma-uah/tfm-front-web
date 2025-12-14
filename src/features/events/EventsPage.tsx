import { type FormEvent, useEffect, useState } from 'react'
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
    type EventSearchParams,
} from '../../api/eventsApi'
import type {
    EventDTO,
    EventCreateRequestDTO,
    EventType,
    EventStatus,
    EventVisibility,
} from '../../types/events'
import {
    translateEventType,
    translateEventStatus,
    translateEventVisibility,
    formatEventDateTime,
} from '../../utils/eventTranslations'
import { PaginationBar } from '../../components/PaginationBar'
import { DataTable, type SortState } from '../../components/DataTable'
import { EventDetailCard } from '../../components/EventDetailCard'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import '../../styles/common.css'

type ViewMode = 'LIST' | 'DETAIL' | 'EDIT' | 'CREATE'

type SortableField = 'title' | 'type' | 'status' | 'startAt' | 'location'

function EventsPage() {
    const { token, hasRole } = useAuth()
    const isAdmin = hasRole('ADMIN')

    const [events, setEvents] = useState<EventDTO[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [page, setPage] = useState(0)
    const [size, setSize] = useState(10)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)

    const [mode, setMode] = useState<ViewMode>('LIST')
    const [selectedEvent, setSelectedEvent] = useState<EventDTO | null>(null)
    const [saving, setSaving] = useState(false)
    const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
    const [isClosing, setIsClosing] = useState(false)

    // Tipos, estados y visibilidades disponibles
    const [eventTypes, setEventTypes] = useState<EventType[]>([])
    const [eventStatuses, setEventStatuses] = useState<EventStatus[]>([])
    const [eventVisibilities, setEventVisibilities] = useState<EventVisibility[]>([])
    const [loadingOptions, setLoadingOptions] = useState(false)

    // Modal de confirmación
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean
        title: string
        message: string
        variant: 'danger' | 'warning' | 'info'
        onConfirm: () => void
    }>({
        isOpen: false,
        title: '',
        message: '',
        variant: 'danger',
        onConfirm: () => {},
    })

    // Filtros visibles
    const [filterTitle, setFilterTitle] = useState('')
    const [filterLocation, setFilterLocation] = useState('')
    const [filterType, setFilterType] = useState<EventType | ''>('')
    const [filterStatus, setFilterStatus] = useState<EventStatus | ''>('')
    const [filterVisibility, setFilterVisibility] = useState<EventVisibility | ''>('')
    const [filterStartAtFrom, setFilterStartAtFrom] = useState('')
    const [filterStartAtTo, setFilterStartAtTo] = useState('')
    const [filterEndAtFrom, setFilterEndAtFrom] = useState('')
    const [filterEndAtTo, setFilterEndAtTo] = useState('')

    // Filtros efectivos
    const [searchTitle, setSearchTitle] = useState('')
    const [searchLocation, setSearchLocation] = useState('')
    const [searchType, setSearchType] = useState<EventType | undefined>(undefined)
    const [searchStatus, setSearchStatus] = useState<EventStatus | undefined>(undefined)
    const [searchVisibility, setSearchVisibility] = useState<EventVisibility | undefined>(undefined)
    const [searchStartAtFrom, setSearchStartAtFrom] = useState<string | undefined>(undefined)
    const [searchStartAtTo, setSearchStartAtTo] = useState<string | undefined>(undefined)
    const [searchEndAtFrom, setSearchEndAtFrom] = useState<string | undefined>(undefined)
    const [searchEndAtTo, setSearchEndAtTo] = useState<string | undefined>(undefined)

    const [searchTrigger, setSearchTrigger] = useState(0)

    // Ordenación
    const [sortField, setSortField] = useState<SortableField | null>('startAt')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

    const sortState: SortState<SortableField> = {
        field: sortField,
        direction: sortDirection,
    }

    // Formulario creación/edición (usamos datetime-local internamente, se convertirá a Instant)
    const [formStartAt, setFormStartAt] = useState('') // datetime-local format
    const [formEndAt, setFormEndAt] = useState('') // datetime-local format
    const [formPayload, setFormPayload] = useState<Omit<EventCreateRequestDTO, 'startAt' | 'endAt'>>({
        title: '',
        description: '',
        location: '',
        type: '',
        status: '',
        visibility: '',
    })

    // Columnas tabla
    const eventColumns = [
        {
            key: 'title',
            header: 'Título',
            sortable: true,
            sortField: 'title' as SortableField,
            width: '25%',
        },
        {
            key: 'type',
            header: 'Tipo',
            sortable: true,
            sortField: 'type' as SortableField,
            width: '15%',
            render: (e: EventDTO) => translateEventType(e.type),
        },
        {
            key: 'status',
            header: 'Estado',
            sortable: true,
            sortField: 'status' as SortableField,
            width: '12%',
            render: (e: EventDTO) => translateEventStatus(e.status),
        },
        {
            key: 'startAt',
            header: 'Fecha inicio',
            sortable: true,
            sortField: 'startAt' as SortableField,
            width: '18%',
            render: (e: EventDTO) => formatEventDateTime(e.startAt),
        },
        {
            key: 'location',
            header: 'Localización',
            sortable: true,
            sortField: 'location' as SortableField,
            width: '15%',
            render: (e: EventDTO) => e.location || '-',
        },
        {
            key: 'actions',
            header: 'Acciones',
            sortable: false,
            width: '15%',
            render: (e: EventDTO) => (
                <div className="actions-container">
                    {isAdmin && (
                        <>
                            <button
                                type="button"
                                className="button-secondary"
                                onClick={(ev) => {
                                    ev.stopPropagation()
                                    handleEditEvent(e)
                                }}
                            >
                                Editar
                            </button>
                            <button
                                type="button"
                                className="button-danger"
                                onClick={(ev) => {
                                    ev.stopPropagation()
                                    handleDeleteEvent(e)
                                }}
                            >
                                Eliminar
                            </button>
                        </>
                    )}
                </div>
            ),
        },
    ]

    // ===== EFECTOS =====

    // Cargar tipos, estados y visibilidades
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

    // Buscar eventos
    useEffect(() => {
        if (!token) return

        const loadEvents = async () => {
            try {
                setLoading(true)
                setError(null)

                const sortParam = sortField
                    ? `${sortField},${sortDirection}`
                    : 'startAt,asc'

                const params: EventSearchParams = {
                    page,
                    size,
                    sort: [sortParam],
                    title: searchTitle || undefined,
                    location: searchLocation || undefined,
                    type: searchType,
                    status: searchStatus,
                    visibility: searchVisibility,
                    startAtFrom: searchStartAtFrom,
                    startAtTo: searchStartAtTo,
                    endAtFrom: searchEndAtFrom,
                    endAtTo: searchEndAtTo,
                }

                const data = await searchEventsPage(params, token)
                setEvents(data.content)
                setTotalPages(data.totalPages)
                setTotalElements(data.totalElements)
            } catch (e: any) {
                console.error('Error loading events:', e)
                setError('Error cargando eventos')
            } finally {
                setLoading(false)
            }
        }

        loadEvents()
    }, [
        token,
        page,
        size,
        sortField,
        sortDirection,
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
    ])

    // ===== HANDLERS =====

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault()
        setSearchTitle(filterTitle)
        setSearchLocation(filterLocation)
        setSearchType(filterType || undefined)
        setSearchStatus(filterStatus || undefined)
        setSearchVisibility(filterVisibility || undefined)
        setSearchStartAtFrom(filterStartAtFrom || undefined)
        setSearchStartAtTo(filterStartAtTo || undefined)
        setSearchEndAtFrom(filterEndAtFrom || undefined)
        setSearchEndAtTo(filterEndAtTo || undefined)
        setPage(0)
    }

    const handleResetFilters = () => {
        setFilterTitle('')
        setFilterLocation('')
        setFilterType('')
        setFilterStatus('')
        setFilterVisibility('')
        setFilterStartAtFrom('')
        setFilterStartAtTo('')
        setFilterEndAtFrom('')
        setFilterEndAtTo('')
        setSearchTitle('')
        setSearchLocation('')
        setSearchType(undefined)
        setSearchStatus(undefined)
        setSearchVisibility(undefined)
        setSearchStartAtFrom(undefined)
        setSearchStartAtTo(undefined)
        setSearchEndAtFrom(undefined)
        setSearchEndAtTo(undefined)
        setPage(0)
    }

    const handleSort = (field: SortableField) => {
        setPage(0)
        if (sortField === field) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    const handleViewDetails = (event: EventDTO) => {
        if (expandedEventId === event.id) {
            setIsClosing(true)
            setTimeout(() => {
                setExpandedEventId(null)
                setSelectedEvent(null)
                setIsClosing(false)
            }, 250)
        } else {
            setExpandedEventId(event.id)
            setSelectedEvent(event)
        }
    }

    // Convertir datetime-local a ISO Instant sin aplicar offset de zona horaria
    const datetimeLocalToISOInstant = (datetimeLocal: string): string => {
        // datetime-local está en formato YYYY-MM-DDTHH:mm
        // Lo convertimos a ISO añadiendo segundos y Z (UTC)
        return `${datetimeLocal}:00.000Z`
    }

    const handleOpenCreateEvent = () => {
        // Usar los primeros valores disponibles de las APIs
        setFormPayload({
            title: '',
            description: '',
            location: '',
            type: eventTypes[0] || '',
            status: eventStatuses[0] || '',
            visibility: eventVisibilities[0] || '',
        })
        setFormStartAt('')
        setFormEndAt('')
        setMode('CREATE')
    }

    const handleEditEvent = (event: EventDTO) => {
        // Convertir ISO Instant a datetime-local (YYYY-MM-DDTHH:mm) sin conversión de zona horaria
        const toDateTimeLocal = (isoString: string) => {
            try {
                // Parsear directamente sin conversión: 2025-09-27T19:00:00Z -> 2025-09-27T19:00
                const match = isoString.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/)
                return match ? match[1] : ''
            } catch {
                return ''
            }
        }

        setFormPayload({
            title: event.title,
            description: event.description || '',
            location: event.location || '',
            type: event.type,
            status: event.status,
            visibility: event.visibility,
        })
        setFormStartAt(toDateTimeLocal(event.startAt))
        setFormEndAt(toDateTimeLocal(event.endAt))
        setSelectedEvent(event)
        setMode('EDIT')
    }

    const handleCreateEvent = async () => {
        if (!token) return

        try {
            setSaving(true)
            setError(null)
            
            // Convertir datetime-local a ISO Instant sin offset
            const payload: EventCreateRequestDTO = {
                ...formPayload,
                startAt: datetimeLocalToISOInstant(formStartAt),
                endAt: datetimeLocalToISOInstant(formEndAt),
            }
            
            await createEvent(payload, token)
            setMode('LIST')
            setSearchTrigger((prev) => prev + 1)
        } catch (e: any) {
            console.error('Error creating event:', e)
            setError(extractErrorMessage(e, 'Error creando evento'))
        } finally {
            setSaving(false)
        }
    }

    const handleUpdateEvent = async () => {
        if (!token || !selectedEvent) return

        try {
            setSaving(true)
            setError(null)
            
            // Convertir datetime-local a ISO Instant sin offset
            const payload: EventCreateRequestDTO = {
                ...formPayload,
                startAt: datetimeLocalToISOInstant(formStartAt),
                endAt: datetimeLocalToISOInstant(formEndAt),
            }
            
            await updateEvent(selectedEvent.id, selectedEvent.version, payload, token)
            setMode('LIST')
            setSearchTrigger((prev) => prev + 1)
            setExpandedEventId(null)
            setSelectedEvent(null)
        } catch (e: any) {
            console.error('Error updating event:', e)
            const status = e?.response?.status
            
            if (status === 412 || status === 428) {
                setError('El evento ha sido modificado. Recarga los datos.')
            } else {
                setError(extractErrorMessage(e, 'Error actualizando evento'))
            }
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteEvent = (event: EventDTO) => {
        if (!token) return

        setConfirmDialog({
            isOpen: true,
            title: `Eliminar evento "${event.title}"`,
            message: `¿Seguro que quieres eliminar el evento "${event.title}"?\n\nEsta acción no se puede deshacer.`,
            variant: 'danger',
            onConfirm: async () => {
                setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
                try {
                    setError(null)
                    await deleteEvent(event.id, event.version, token)
                    setPage(0)
                    setSearchTrigger((prev) => prev + 1)
                    if (selectedEvent && selectedEvent.id === event.id) {
                        setSelectedEvent(null)
                        setExpandedEventId(null)
                    }
                } catch (e: any) {
                    console.error('Error deleting event:', e)
                    const status = e?.response?.status
                    
                    if (status === 412 || status === 428) {
                        setError('El evento ha sido modificado. Recarga los datos.')
                    } else {
                        setError(extractErrorMessage(e, 'Error eliminando evento'))
                    }
                }
            },
        })
    }

    const handleCancelForm = () => {
        setMode('LIST')
        setSelectedEvent(null)
    }

    // ===== RENDER =====

    return (
        <div className="page-container">
            <h1 className="page-title">Gestión de eventos</h1>

            {/* Buscador */}
            <form
                onSubmit={handleSearchSubmit}
                className="card"
                style={{ marginBottom: '1rem' }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.75rem',
                    }}
                >
                    <div className="section-title" style={{ marginBottom: 0 }}>
                        Filtros de búsqueda
                    </div>
                    {isAdmin && (
                        <button
                            type="button"
                            className="button-secondary"
                            onClick={handleOpenCreateEvent}
                        >
                            + Nuevo evento
                        </button>
                    )}
                </div>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        width: '100%',
                    }}
                >
                    {/* Grupo 1: Título, Localización, Tipo, Estado, Visibilidad */}
                    <div className="search-grid">
                        <div className="form-field">
                            <span className="label-text">Título</span>
                            <input
                                type="text"
                                placeholder="Buscar por título"
                                value={filterTitle}
                                onChange={(e) => setFilterTitle(e.target.value)}
                                className="input-full-width"
                            />
                        </div>
                        <div className="form-field">
                            <span className="label-text">Localización</span>
                            <input
                                type="text"
                                placeholder="Buscar por localización"
                                value={filterLocation}
                                onChange={(e) => setFilterLocation(e.target.value)}
                                className="input-full-width"
                            />
                        </div>
                        <div className="form-field">
                            <span className="label-text">Tipo</span>
                            <select
                                value={filterType}
                                onChange={(e) =>
                                    setFilterType(e.target.value as EventType | '')
                                }
                                className="select-base"
                                disabled={loadingOptions}
                            >
                                <option value="">Todos</option>
                                {eventTypes.map((t) => (
                                    <option key={t} value={t}>
                                        {translateEventType(t)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-field">
                            <span className="label-text">Estado</span>
                            <select
                                value={filterStatus}
                                onChange={(e) =>
                                    setFilterStatus(e.target.value as EventStatus | '')
                                }
                                className="select-base"
                                disabled={loadingOptions}
                            >
                                <option value="">Todos</option>
                                {eventStatuses.map((s) => (
                                    <option key={s} value={s}>
                                        {translateEventStatus(s)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-field">
                            <span className="label-text">Visibilidad</span>
                            <select
                                value={filterVisibility}
                                onChange={(e) =>
                                    setFilterVisibility(e.target.value as EventVisibility | '')
                                }
                                className="select-base"
                                disabled={loadingOptions}
                            >
                                <option value="">Todas</option>
                                {eventVisibilities.map((v) => (
                                    <option key={v} value={v}>
                                        {translateEventVisibility(v)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Grupo 2: Fechas de inicio y fin */}
                    <div className="search-grid">
                        <div className="form-field">
                            <span className="label-text">Fecha inicio (desde)</span>
                            <input
                                type="datetime-local"
                                value={filterStartAtFrom}
                                onChange={(e) => setFilterStartAtFrom(e.target.value)}
                                className="input-full-width"
                            />
                        </div>
                        <div className="form-field">
                            <span className="label-text">Fecha inicio (hasta)</span>
                            <input
                                type="datetime-local"
                                value={filterStartAtTo}
                                onChange={(e) => setFilterStartAtTo(e.target.value)}
                                className="input-full-width"
                            />
                        </div>
                        <div className="form-field">
                            <span className="label-text">Fecha fin (desde)</span>
                            <input
                                type="datetime-local"
                                value={filterEndAtFrom}
                                onChange={(e) => setFilterEndAtFrom(e.target.value)}
                                className="input-full-width"
                            />
                        </div>
                        <div className="form-field">
                            <span className="label-text">Fecha fin (hasta)</span>
                            <input
                                type="datetime-local"
                                value={filterEndAtTo}
                                onChange={(e) => setFilterEndAtTo(e.target.value)}
                                className="input-full-width"
                            />
                        </div>
                    </div>
                </div>
                <div
                    className="search-actions-row"
                    style={{ justifyContent: 'space-between' }}
                >
                    <button type="submit" className="button-primary">
                        Buscar
                    </button>

                    <button
                        type="button"
                        className="button-subtle"
                        onClick={handleResetFilters}
                        style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}
                    >
                        Resetear filtros
                    </button>
                </div>
            </form>

            {loading && <p>Cargando eventos...</p>}
            {error && <p className="error-message">{error}</p>}

            {/* LISTA */}
            {mode === 'LIST' && !loading && !error && (
                <>
                    <div className="card">
                        <DataTable<EventDTO, SortableField>
                            columns={eventColumns}
                            data={events}
                            sortState={sortState}
                            onSortChange={handleSort}
                            onRowClick={handleViewDetails}
                            expandedRowId={expandedEventId}
                            isClosing={isClosing}
                            renderExpandedContent={(event) => (
                                <EventDetailCard
                                    event={event}
                                    onBack={() => {
                                        setIsClosing(true)
                                        setTimeout(() => {
                                            setExpandedEventId(null)
                                            setSelectedEvent(null)
                                            setIsClosing(false)
                                        }, 250)
                                    }}
                                    backButtonLabel="Ocultar"
                                />
                            )}
                        />
                    </div>
                    <PaginationBar
                        page={page}
                        totalPages={totalPages}
                        pageSize={size}
                        currentCount={events.length}
                        totalElements={totalElements}
                        onPageChange={setPage}
                        onPageSizeChange={(newSize) => {
                            setSize(newSize)
                            setPage(0)
                        }}
                    />
                </>
            )}

            {/* FORMULARIO CREAR/EDITAR */}
            {(mode === 'CREATE' || mode === 'EDIT') && (
                <div className="form-card">
                    <h2 className="section-title">
                        {mode === 'CREATE' ? 'Crear evento' : 'Editar evento'}
                    </h2>
                    
                    {/* Línea 1: Título, Localización (2 columnas) */}
                    <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '0.75rem' }}>
                        <div className="form-field">
                            <label className="label-text">Título *</label>
                            <input
                                type="text"
                                value={formPayload.title}
                                onChange={(e) =>
                                    setFormPayload({ ...formPayload, title: e.target.value })
                                }
                                required
                                className="input-full-width"
                            />
                        </div>
                        <div className="form-field">
                            <label className="label-text">Localización</label>
                            <input
                                type="text"
                                value={formPayload.location}
                                onChange={(e) =>
                                    setFormPayload({ ...formPayload, location: e.target.value })
                                }
                                className="input-full-width"
                            />
                        </div>
                    </div>

                    {/* Línea 2: Tipo, Estado, Visibilidad (3 columnas) */}
                    <div className="form-grid" style={{ marginBottom: '0.75rem' }}>
                        <div className="form-field">
                            <label className="label-text">Tipo *</label>
                            <select
                                value={formPayload.type}
                                onChange={(e) =>
                                    setFormPayload({
                                        ...formPayload,
                                        type: e.target.value as EventType,
                                    })
                                }
                                className="select-base"
                                required
                            >
                                {eventTypes.map((t) => (
                                    <option key={t} value={t}>
                                        {translateEventType(t)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-field">
                            <label className="label-text">Estado</label>
                            <select
                                value={formPayload.status || eventStatuses[0] || ''}
                                onChange={(e) =>
                                    setFormPayload({
                                        ...formPayload,
                                        status: e.target.value as EventStatus,
                                    })
                                }
                                className="select-base"
                            >
                                {eventStatuses.map((s) => (
                                    <option key={s} value={s}>
                                        {translateEventStatus(s)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-field">
                            <label className="label-text">Visibilidad *</label>
                            <select
                                value={formPayload.visibility}
                                onChange={(e) =>
                                    setFormPayload({
                                        ...formPayload,
                                        visibility: e.target.value as EventVisibility,
                                    })
                                }
                                className="select-base"
                                required
                            >
                                {eventVisibilities.map((v) => (
                                    <option key={v} value={v}>
                                        {translateEventVisibility(v)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Línea 3: Fecha inicio, Fecha fin (2 columnas) */}
                    <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '0.75rem' }}>
                        <div className="form-field">
                            <label className="label-text">Fecha inicio *</label>
                            <input
                                type="datetime-local"
                                value={formStartAt}
                                onChange={(e) => setFormStartAt(e.target.value)}
                                className="input-full-width"
                                required
                            />
                        </div>
                        <div className="form-field">
                            <label className="label-text">Fecha fin *</label>
                            <input
                                type="datetime-local"
                                value={formEndAt}
                                onChange={(e) => setFormEndAt(e.target.value)}
                                className="input-full-width"
                                required
                            />
                        </div>
                    </div>

                    {/* Línea 4: Descripción (ancho completo) */}
                    <div className="form-grid">
                        <div
                            className="form-field"
                            style={{ gridColumn: '1 / -1' }}
                        >
                            <label className="label-text">Descripción</label>
                            <textarea
                                value={formPayload.description}
                                onChange={(e) =>
                                    setFormPayload({
                                        ...formPayload,
                                        description: e.target.value,
                                    })
                                }
                                className="textarea-base"
                                rows={4}
                            />
                        </div>
                    </div>
                    <div className="button-row-1rem">
                        <button
                            type="button"
                            className="button-primary"
                            onClick={mode === 'CREATE' ? handleCreateEvent : handleUpdateEvent}
                            disabled={saving}
                        >
                            {saving ? 'Guardando...' : mode === 'CREATE' ? 'Crear' : 'Guardar'}
                        </button>
                        <button
                            type="button"
                            className="button-secondary"
                            onClick={handleCancelForm}
                            disabled={saving}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                variant={confirmDialog.variant}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() =>
                    setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
                }
            />
        </div>
    )
}

export default EventsPage
