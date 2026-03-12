import { type FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { extractErrorMessage } from '../../utils/errorHandler'
import {
    searchEventsPage,
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
    formatEventDateTime,
} from '../../utils/eventTranslations'
import { PaginationBar } from '../../components/PaginationBar'
import { DataTable } from '../../components/DataTable'
import { EventDetailCard } from './EventDetailCard'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EventFiltersPanel } from './EventFiltersPanel'
import { EventForm } from './EventForm'
import { EditIcon, TrashIcon } from '../../components/Icons'
import { usePagination, useSorting, useConfirmDialog, useRowExpansion } from '../../hooks'
import { useToast } from '../../context/ToastContext'
import { ErrorState } from '../../components/ErrorState'
import { Spinner } from '../../components/Spinner'
import '../../styles/common.css'

/**
 * EventsPage — Administración de eventos (solo ADMIN).
 *
 * RESPONSABILIDAD ÚNICA:
 * Interfaz de administración (CRUD completo) de eventos. Permite crear, leer,
 * actualizar y eliminar eventos. Incluye filtros avanzados, ordenamiento,
 * paginación y validación de fechas (la de fin debe ser posterior a la inicio).
 *
 * SEPARACIÓN DE RESPONSABILIDADES:
 * - EventsPage: administración completa (ADMIN)
 * - MyEventsPage: vista del músico (lectura, consulta de encuestas, respuestas)
 *
 * Ruta: /admin/events
 * Requiere: Rol ADMIN
 */

type ViewMode = 'LIST' | 'EDIT' | 'CREATE'
type SortableField = 'title' | 'type' | 'status' | 'startAt' | 'location'

/**
 * Convierte el valor del input datetime-local (formato "YYYY-MM-DDTHH:MM")
 * al formato ISO 8601 que espera el backend ("YYYY-MM-DDTHH:MM:00.000Z").
 * Sin esta conversión, el servidor rechazaría la petición por formato inválido.
 */
function datetimeLocalToISOInstant(datetimeLocal: string): string {
    return `${datetimeLocal}:00.000Z`
}

function toDateTimeLocal(isoString: string): string {
    try {
        const match = isoString.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/)
        return match ? match[1] : ''
    } catch {
        return ''
    }
}

function EventsPage() {
    const { token } = useAuth()
    const { showToast } = useToast()

    const [events, setEvents]   = useState<EventDTO[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError]     = useState<string | null>(null)
    const [saving, setSaving]   = useState(false)

    const pagination   = usePagination({ defaultSize: 10 })
    const sorting      = useSorting<SortableField>('startAt')
    const confirm      = useConfirmDialog()
    const rowExpansion = useRowExpansion<string>()

    const [mode, setMode]                   = useState<ViewMode>('LIST')
    const [selectedEvent, setSelectedEvent] = useState<EventDTO | null>(null)

    const [eventTypes, setEventTypes]               = useState<EventType[]>([])
    const [eventStatuses, setEventStatuses]         = useState<EventStatus[]>([])
    const [eventVisibilities, setEventVisibilities] = useState<EventVisibility[]>([])
    const [loadingOptions, setLoadingOptions]       = useState(false)

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

    // Formulario
    const [formStartAt, setFormStartAt] = useState('')
    const [formEndAt, setFormEndAt]     = useState('')
    const [formPayload, setFormPayload] = useState<Omit<EventCreateRequestDTO, 'startAt' | 'endAt'>>({
        title: '', description: '', location: '', type: '', status: '', visibility: '',
    })

    // ── Columnas ──────────────────────────────────────────────────────────────

    const eventColumns = [
        { key: 'title',   header: 'Título',       sortable: true, sortField: 'title'   as SortableField, width: '30%' },
        { key: 'type',    header: 'Tipo',         sortable: true, sortField: 'type'    as SortableField, width: '16%', render: (e: EventDTO) => translateEventType(e.type) },
        { key: 'status',  header: 'Estado',       sortable: true, sortField: 'status'  as SortableField, width: '15%', render: (e: EventDTO) => translateEventStatus(e.status) },
        { key: 'startAt', header: 'Fecha inicio', sortable: true, sortField: 'startAt' as SortableField, width: '22%', render: (e: EventDTO) => formatEventDateTime(e.startAt) },
        {
            key: 'actions', header: 'Acciones', sortable: false, width: '17%',
            render: (e: EventDTO) => (
                <div className="actions-container">
                    <span className="tooltip-wrap" data-tooltip="Editar">
                        <button type="button" className="btn-icon btn-icon-edit"
                            onClick={(ev) => { ev.stopPropagation(); handleEditEvent(e) }}>
                            <EditIcon />
                        </button>
                    </span>
                    <span className="tooltip-wrap" data-tooltip="Eliminar">
                        <button type="button" className="btn-icon btn-icon-danger"
                            onClick={(ev) => { ev.stopPropagation(); handleDeleteEvent(e) }}>
                            <TrashIcon />
                        </button>
                    </span>
                </div>
            ),
        },
    ]

    // ── Effects ───────────────────────────────────────────────────────────────

    // Cargar opciones de tipos, estados y visibilidades al montar el componente.
    // Se hace una única vez por token. Las opciones son necesarias para los
    // selectores de filtros y para el formulario de creación/edición.
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

    useEffect(() => {
        if (!token) return
        loadEvents()
    }, [
        token, pagination.page, pagination.size,
        sorting.field, sorting.direction,
        searchTitle, searchLocation, searchType, searchStatus, searchVisibility,
        searchStartAtFrom, searchStartAtTo, searchEndAtFrom, searchEndAtTo,
        searchTrigger,
    ])

    // ── Carga ─────────────────────────────────────────────────────────────────

    /**
     * Carga la página de eventos con filtros, ordenamiento y paginación actuales.
     * Realiza una solicitud GET a searchEventsPage() con los parámetros de búsqueda,
     * actualiza el estado de eventos, y maneja errores. Se llama automáticamente
     * siempre que cambien los filtros, página, tamaño o campo de ordenamiento.
     */
    const loadEvents = async () => {
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

    // ── Handlers ──────────────────────────────────────────────────────────────

    /**
     * Maneja el envío del formulario de filtros. Traslada los valores del
     * formulario (filter*) a los filtros efectivos (search*), convierte las
     * fechas datetime-local a ISO Instant, resetea la paginación a página 0
     * para mostrar resultados desde el principio, y dispara una nueva carga.
     */
    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault()
        setSearchTitle(filterTitle)
        setSearchLocation(filterLocation)
        setSearchType(filterType           || undefined)
        setSearchStatus(filterStatus       || undefined)
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

    const handleSort = (field: SortableField) => {
        pagination.goToPage(0)
        sorting.handleSortChange(field)
    }

    const handleViewDetails = (event: EventDTO) => {
        if (rowExpansion.expandedId === event.id) {
            rowExpansion.close()
            setTimeout(() => setSelectedEvent(null), 250)
        } else {
            rowExpansion.toggle(event.id)
            setSelectedEvent(event)
        }
    }

    const handleOpenCreateEvent = () => {
        setFormPayload({
            title: '', description: '', location: '',
            type:       eventTypes[0]        || '',
            status:     eventStatuses[0]     || '',
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

    /**
     * Crea un evento nuevo. Valida que los campos obligatorios estén rellenos,
     * convierte las fechas datetime-local a ISO Instant, envía la solicitud POST
     * a createEvent(), muestra un toast de éxito, y resetea la vista a LIST.
     * Si falla, muestra un toast con el mensaje de error.
     */
    const handleCreateEvent = async () => {
        if (!token) return
        try {
            setSaving(true)
            await createEvent({
                ...formPayload,
                startAt: datetimeLocalToISOInstant(formStartAt),
                endAt:   datetimeLocalToISOInstant(formEndAt),
            }, token)
            showToast('Evento creado correctamente', 'success')
            setMode('LIST')
            setSearchTrigger(prev => prev + 1)
        } catch (e: any) {
            showToast(extractErrorMessage(e, 'Error creando evento'), 'error')
        } finally {
            setSaving(false)
        }
    }

    /**
     * Actualiza un evento existente. Similar a handleCreateEvent pero usa PUT
     * updateEvent() con el ID y versión del evento actual (control de concurrencia
     * optimista). Detecta conflictos (status 412/428) y muestra mensaje específico.
     * Cierra la fila expandida y resetea el formulario tras guardar.
     */
    const handleUpdateEvent = async () => {
        if (!token || !selectedEvent) return
        try {
            setSaving(true)
            await updateEvent(selectedEvent.id, selectedEvent.version, {
                ...formPayload,
                startAt: datetimeLocalToISOInstant(formStartAt),
                endAt:   datetimeLocalToISOInstant(formEndAt),
            }, token)
            showToast('Evento actualizado correctamente', 'success')
            setMode('LIST')
            setSearchTrigger(prev => prev + 1)
            rowExpansion.forceClose()
            setSelectedEvent(null)
        } catch (e: any) {
            // Manejo específico de errores de concurrencia optimista (412/428).
            // El servidor rechaza la actualización porque otro cliente modificó
            // el evento. Se pide al usuario que recargue los datos.
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

    /**
     * Abre un diálogo de confirmación para eliminar un evento. Si el usuario
     * confirma, envía DELETE con el ID y versión (control de concurrencia).
     * Si la operación falla por conflicto (412/428), muestra el mensaje específico.
     * Tras el borrado, recarga la lista de eventos y cierra la fila expandida
     * si era el evento que estaba expandido.
     */
    const handleDeleteEvent = (event: EventDTO) => {
        if (!token) return
        confirm.open({
            title:   'Eliminar evento',
            message: `¿Seguro que quieres eliminar "${event.title}"?\nEsta acción no se puede deshacer.`,
            variant: 'danger',
            onConfirm: async () => {
                confirm.close()
                try {
                    await deleteEvent(event.id, event.version, token)
                    showToast('Evento eliminado correctamente', 'success')
                    pagination.goToPage(0)
                    setSearchTrigger(prev => prev + 1)
                    if (selectedEvent?.id === event.id) {
                        rowExpansion.forceClose()
                        setSelectedEvent(null)
                    }
                } catch (e: any) {
                    // Manejo específico de errores de concurrencia optimista (412/428).
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

    const activeFiltersCount = [
        searchTitle, searchLocation, searchType, searchStatus, searchVisibility,
        searchStartAtFrom, searchStartAtTo, searchEndAtFrom, searchEndAtTo,
    ].filter(v => v !== '' && v !== undefined).length

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="page-container">
            <h1 className="page-title">Administración de eventos</h1>

            {loading && <Spinner />}
            {error   && <ErrorState message={error} onRetry={() => setSearchTrigger(prev => prev + 1)} />}

            {!loading && !error && (
                <>
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
                        actionButton={
                            <button type="button" className="button-secondary" onClick={handleOpenCreateEvent}>
                                + Nuevo evento
                            </button>
                        }
                    />

                    {mode === 'LIST' && (
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
                                        <EventDetailCard
                                            event={event}
                                            onBack={() => {
                                                rowExpansion.close()
                                                setTimeout(() => setSelectedEvent(null), 250)
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

            {(mode === 'CREATE' || mode === 'EDIT') && (
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