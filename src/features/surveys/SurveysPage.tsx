import { type FormEvent, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { extractErrorMessage } from '../../utils/errorHandler'
import {
    searchSurveysPage,
    createSurvey,
    updateSurvey,
    deleteSurvey,
    openSurvey,
    closeSurvey,
    cancelSurvey,
    resetSurvey,
    getAvailableSurveyStatuses,
    getAvailableResponseTypes,
    getAvailableSurveyTypes,
} from '../../api/surveysApi'
import { searchEventsPage } from '../../api/eventsApi'
import type { EventDTO } from '../../types/events'
import type {
    SurveyDTO,
    CreateSurveyRequestDTO,
    UpdateSurveyRequestDTO,
    SurveySortableField,
    SurveyStatus,
    SurveyType,
} from '../../types/surveys'
import { DataTable } from '../../components/DataTable'
import { PaginationBar } from '../../components/PaginationBar'
import { SurveyDetailCard } from './SurveyDetailCard'
import { SurveyResultsView } from './SurveyResultsView'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { SurveyFiltersPanel } from './SurveyFiltersPanel'
import { SurveyForm } from './SurveyForm'
import { EditIcon, TrashIcon, ChartIcon, LockIcon, LockOpenIcon, CancelIcon, ArrowPathIcon } from '../../components/Icons'
import {
    translateSurveyStatus,
    formatSurveyDateTime,
} from '../../utils/surveyTranslations'
import { usePagination, useSorting, useConfirmDialog, useRowExpansion } from '../../hooks'
import { useToast } from '../../context/ToastContext'
import { ErrorState } from '../../components/ErrorState'
import { Spinner } from '../../components/Spinner'
import '../../styles/common.css'

/**
 * SurveysPage — Administración de encuestas (solo ADMIN).
 *
 * RESPONSABILIDAD ÚNICA:
 * Interfaz de administración (CRUD completo) de encuestas. Permite crear,
 * leer, actualizar, eliminar, abrir, cerrar y cancelar encuestas.
 * Incluye filtros avanzados, ordenamiento, paginación y validación de fechas
 * (apertura debe ser anterior al cierre).
 *
 * ESTADO DE ENCUESTA:
 * - DRAFT:     Borrador, solo el admin puede editar propiedades
 * - OPEN:      Abierta, usuarios pueden responder
 * - CLOSED:    Cerrada, no se aceptan más respuestas
 * - CANCELLED: Cancelada, no se puede reaperturar
 *
 * ACCIONES DE CRUD CON DIÁLOGOS DE CONFIRMACIÓN:
 * - Eliminar: solo en estado DRAFT
 * - Abrir: transición DRAFT → OPEN
 * - Cerrar: transición OPEN → CLOSED (las respuestas quedan guardadas)
 * - Cancelar: transición DRAFT/OPEN → CANCELLED (irreversible)
 *
 * Ruta: /admin/surveys
 * Requiere: Rol ADMIN
 */

type ViewMode = 'LIST' | 'CREATE' | 'EDIT' | 'DETAIL' | 'RESULTS'

// ── Helpers de conversión de fechas ──────────────────────────────────────────
// Funciones puras a nivel de módulo para convertir entre formatos.

/**
 * Convierte el valor del input datetime-local (formato "YYYY-MM-DDTHH:MM")
 * al formato ISO 8601 que espera el backend ("YYYY-MM-DDTHH:MM:00.000Z").
 * Sin esta conversión, el servidor rechazaría la petición por formato inválido.
 */
function datetimeLocalToISOInstant(datetimeLocal: string): string {
    if (!datetimeLocal) return ''
    return `${datetimeLocal}:00.000Z`
}

/**
 * Convierte un string ISO 8601 (ej. "2025-03-15T10:30:00.000Z") al formato
 * datetime-local esperado por el input HTML5 (ej. "2025-03-15T10:30").
 * Extrae solo la parte "YYYY-MM-DDTHH:MM", ignorando segundos y zona horaria.
 */
function toDateTimeLocal(isoString?: string): string {
    if (!isoString) return ''
    const match = isoString.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/)
    return match ? match[1] : ''
}

function SurveysPage() {
    const { token, hasRole } = useAuth()
    const isAdmin = hasRole('ADMIN')
    const { showToast } = useToast()

    const [surveys, setSurveys]   = useState<SurveyDTO[]>([])
    const [loading, setLoading]   = useState(false)
    const [error, setError]       = useState<string | null>(null)
    const [saving, setSaving]     = useState(false)

    // ── Hooks de estado reutilizable ──────────────────────────────────────────
    const pagination   = usePagination({ defaultSize: 10 })
    const sorting      = useSorting<SurveySortableField>()
    const confirm      = useConfirmDialog()
    const rowExpansion = useRowExpansion<string>()

    const location   = useLocation()
    const _navState  = location.state as {
        action?: string
        preselectedEventId?: string
        filterEventId?: string
    } | null

    // ── Estado propio del componente ──────────────────────────────────────────
    const [mode, setMode]                     = useState<ViewMode>(_navState?.action === 'CREATE' ? 'CREATE' : 'LIST')
    const [selectedSurvey, setSelectedSurvey] = useState<SurveyDTO | null>(null)

    // Opciones de selectores
    const [surveyStatuses, setSurveyStatuses]   = useState<SurveyStatus[]>([])
    const [responseTypes, setResponseTypes]     = useState<ResponseType[]>([])
    const [surveyTypes, setSurveyTypes]         = useState<SurveyType[]>([])
    const [availableEvents, setAvailableEvents] = useState<EventDTO[]>([])
    const [loadingOptions, setLoadingOptions]   = useState(false)

    // Filtros visibles
    const [filterTitle, setFilterTitle]               = useState('')
    const [filterEventId, setFilterEventId]           = useState(_navState?.filterEventId ?? '')
    const [filterStatus, setFilterStatus]             = useState<SurveyStatus | ''>('')
    const [filterOpensAtFrom, setFilterOpensAtFrom]   = useState('')
    const [filterOpensAtTo, setFilterOpensAtTo]       = useState('')
    const [filterClosesAtFrom, setFilterClosesAtFrom] = useState('')
    const [filterClosesAtTo, setFilterClosesAtTo]     = useState('')

    // Filtros efectivos
    const [searchTitle, setSearchTitle]                   = useState('')
    const [searchEventId, setSearchEventId]               = useState(_navState?.filterEventId ?? '')
    const [searchStatus, setSearchStatus]                 = useState<SurveyStatus | undefined>(undefined)
    const [searchOpensAtFrom, setSearchOpensAtFrom]       = useState<string | undefined>(undefined)
    const [searchOpensAtTo, setSearchOpensAtTo]           = useState<string | undefined>(undefined)
    const [searchClosesAtFrom, setSearchClosesAtFrom]     = useState<string | undefined>(undefined)
    const [searchClosesAtTo, setSearchClosesAtTo]         = useState<string | undefined>(undefined)
    const [searchTrigger, setSearchTrigger]               = useState(0)

    // Formulario crear/editar
    const [formPayload, setFormPayload] = useState<CreateSurveyRequestDTO>({
        eventId: _navState?.preselectedEventId ?? '', title: '', description: '', responseType: '', surveyType: '', opensAt: '', closesAt: '',
    })
    const [formOpensAt, setFormOpensAt]   = useState('')
    const [formClosesAt, setFormClosesAt] = useState('')

    // ── Columnas ──────────────────────────────────────────────────────────────
    const surveyColumns = [
        { key: 'title',   header: 'Título',    sortable: true, sortField: 'title'   as SurveySortableField, width: '33%' },
        {
            key: 'status', header: 'Estado', sortable: true, sortField: 'status' as SurveySortableField, width: '11%',
            render: (s: SurveyDTO) => translateSurveyStatus(s.status),
        },
        {
            key: 'opensAt', header: 'Apertura', sortable: true, sortField: 'opensAt' as SurveySortableField, width: '16%',
            render: (s: SurveyDTO) => formatSurveyDateTime(s.opensAt),
        },
        {
            key: 'closesAt', header: 'Cierre', sortable: true, sortField: 'closesAt' as SurveySortableField, width: '16%',
            render: (s: SurveyDTO) => formatSurveyDateTime(s.closesAt),
        },
        {
            key: 'actions', header: 'Acciones', sortable: false, width: '24%',
            render: (s: SurveyDTO) => (
                <div className="actions-container">
                    <span className="tooltip-wrap" data-tooltip="Editar">
                        <button
                            type="button"
                            className="btn-icon btn-icon-edit"
                            onClick={e => { e.stopPropagation(); handleEditSurvey(s) }}
                        ><EditIcon /></button>
                    </span>
                    <span className="tooltip-wrap" data-tooltip="Ver resultados">
                        <button
                            type="button"
                            className="btn-icon btn-icon-neutral"
                            onClick={e => { e.stopPropagation(); handleViewResults(s) }}
                        ><ChartIcon /></button>
                    </span>
                    {(s.status === 'DRAFT' || s.status === 'CLOSED' || s.status === 'CANCELLED') && (
                        <span className="tooltip-wrap" data-tooltip="Abrir encuesta">
                            <button
                                type="button"
                                className="btn-icon btn-icon-success"
                                onClick={e => { e.stopPropagation(); handleOpenSurvey(s) }}
                            ><LockOpenIcon /></button>
                        </span>
                    )}
                    {s.status === 'OPEN' && (
                        <span className="tooltip-wrap" data-tooltip="Cerrar encuesta">
                            <button
                                type="button"
                                className="btn-icon btn-icon-neutral"
                                onClick={e => { e.stopPropagation(); handleCloseSurvey(s) }}
                            ><LockIcon /></button>
                        </span>
                    )}
                    {(s.status === 'DRAFT' || s.status === 'OPEN') && (
                        <span className="tooltip-wrap" data-tooltip="Cancelar encuesta">
                            <button
                                type="button"
                                className="btn-icon btn-icon-danger"
                                onClick={e => { e.stopPropagation(); handleCancelSurvey(s) }}
                            ><CancelIcon /></button>
                        </span>
                    )}
                    {(s.status === 'CLOSED' || s.status === 'CANCELLED') && (
                        <span className="tooltip-wrap" data-tooltip="Reiniciar encuesta">
                            <button
                                type="button"
                                className="btn-icon btn-icon-warning"
                                onClick={e => { e.stopPropagation(); handleResetSurvey(s) }}
                            ><ArrowPathIcon /></button>
                        </span>
                    )}
                    <span className="tooltip-wrap" data-tooltip="Eliminar">
                        <button
                            type="button"
                            className="btn-icon btn-icon-danger"
                            onClick={e => { e.stopPropagation(); handleDeleteSurvey(s) }}
                        ><TrashIcon /></button>
                    </span>
                </div>
            ),
        },
    ]

    // ── Effects ───────────────────────────────────────────────────────────────

    // Limpiar el state de navegación para que no persista en recargas
    useEffect(() => {
        if (location.state) {
            window.history.replaceState({}, '')
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Cargar opciones de selectores
    useEffect(() => {
        if (!token || !isAdmin) return
        const loadOptions = async () => {
            try {
                setLoadingOptions(true)
                const [statuses, responseTypesData, surveyTypesData, eventsData] = await Promise.all([
                    getAvailableSurveyStatuses(token),
                    getAvailableResponseTypes(token),
                    getAvailableSurveyTypes(token),
                    searchEventsPage({ page: 0, size: 1000 }, token),
                ])
                setSurveyStatuses(statuses as SurveyStatus[])
                setResponseTypes(responseTypesData as ResponseType[])
                setSurveyTypes(surveyTypesData as SurveyType[])
                setAvailableEvents(eventsData.content ?? [])
            } catch (e) {
                console.error('Error loading survey options:', e)
            } finally {
                setLoadingOptions(false)
            }
        }
        loadOptions()
    }, [token, isAdmin])

    // Auto-completar título cuando surveyType es ATTENDANCE y hay evento seleccionado
    useEffect(() => {
        if (mode === 'CREATE' && formPayload.surveyType === 'ATTENDANCE' && formPayload.eventId) {
            const selectedEvent = availableEvents.find(e => e.id === formPayload.eventId)
            if (selectedEvent) {
                setFormPayload(prev => ({ ...prev, title: `Encuesta de asistencia a "${selectedEvent.title}"` }))
            }
        }
    }, [formPayload.surveyType, formPayload.eventId, availableEvents, mode])

    // Cargar encuestas
    useEffect(() => {
        if (!token || !isAdmin) return
        const load = async () => {
            setLoading(true)
            setError(null)
            try {
                const sort = sorting.field != null
                    ? [`${sorting.field},${sorting.direction}`]
                    : undefined
                const data = await searchSurveysPage(
                    {
                        page:       pagination.page,
                        size:       pagination.size,
                        title:      searchTitle   || undefined,
                        eventId:    searchEventId || undefined,
                        status:     searchStatus,
                        opensFrom:  searchOpensAtFrom,
                        opensTo:    searchOpensAtTo,
                        closesFrom: searchClosesAtFrom,
                        closesTo:   searchClosesAtTo,
                        sort,
                    },
                    token,
                )
                setSurveys(data.content ?? [])
                pagination.setTotals(data.totalPages ?? 1, data.totalElements ?? 0)
            } catch (e: any) {
                console.error('Error loading surveys:', e)
                setError(extractErrorMessage(e, 'Error cargando encuestas'))
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [
        token, isAdmin,
        pagination.page, pagination.size,
        searchTitle, searchEventId, searchStatus,
        searchOpensAtFrom, searchOpensAtTo,
        searchClosesAtFrom, searchClosesAtTo,
        sorting.field, sorting.direction,
        searchTrigger,
    ])


    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault()
        pagination.goToPage(0)
        setSearchTitle(filterTitle.trim())
        setSearchEventId(filterEventId.trim())
        setSearchStatus(filterStatus || undefined)
        setSearchOpensAtFrom(filterOpensAtFrom   ? datetimeLocalToISOInstant(filterOpensAtFrom)   : undefined)
        setSearchOpensAtTo(filterOpensAtTo       ? datetimeLocalToISOInstant(filterOpensAtTo)     : undefined)
        setSearchClosesAtFrom(filterClosesAtFrom ? datetimeLocalToISOInstant(filterClosesAtFrom)  : undefined)
        setSearchClosesAtTo(filterClosesAtTo     ? datetimeLocalToISOInstant(filterClosesAtTo)    : undefined)
        setMode('LIST')
        setSelectedSurvey(null)
        setSearchTrigger(prev => prev + 1)
    }

    const handleResetFilters = () => {
        setFilterTitle(''); setFilterEventId(''); setFilterStatus('')
        setFilterOpensAtFrom(''); setFilterOpensAtTo('')
        setFilterClosesAtFrom(''); setFilterClosesAtTo('')
        setSearchTitle(''); setSearchEventId(''); setSearchStatus(undefined)
        setSearchOpensAtFrom(undefined); setSearchOpensAtTo(undefined)
        setSearchClosesAtFrom(undefined); setSearchClosesAtTo(undefined)
        pagination.goToPage(0)
        setMode('LIST')
        setSelectedSurvey(null)
        setSearchTrigger(prev => prev + 1)
    }

    // handleSort: resetea página además de cambiar ordenación
    const handleSort = (field: SurveySortableField) => {
        pagination.goToPage(0)
        sorting.handleSortChange(field)
    }

    const handleViewDetails = (survey: SurveyDTO) => {
        if (rowExpansion.expandedId === survey.id) {
            rowExpansion.close()
            setTimeout(() => setSelectedSurvey(null), 250)
        } else {
            rowExpansion.toggle(survey.id ?? null)
            setSelectedSurvey(survey)
        }
    }

    const handleOpenCreateSurvey = () => {
        setSelectedSurvey(null)
        setMode('CREATE')
        setFormPayload({ eventId: '', title: '', description: '', responseType: '', surveyType: '', opensAt: '', closesAt: '' })
        setFormOpensAt('')
        setFormClosesAt('')
    }

    const handleEditSurvey = (survey: SurveyDTO) => {
        setSelectedSurvey(survey)
        setMode('EDIT')
        setFormPayload({
            eventId:      survey.eventId,
            title:        survey.title,
            description:  survey.description || '',
            responseType: survey.responseType,
            surveyType:   survey.surveyType,
            opensAt:      survey.opensAt,
            closesAt:     survey.closesAt,
        })
        setFormOpensAt(toDateTimeLocal(survey.opensAt))
        setFormClosesAt(toDateTimeLocal(survey.closesAt))
    }

    const handleViewResults = (survey: SurveyDTO) => {
        setSelectedSurvey(survey)
        setMode('RESULTS')
    }

    const handleCancelForm = () => {
        setMode('LIST')
        setSelectedSurvey(null)
    }

    // ── CRUD ─────────────────────────────────────────────────────────────────

    const handleCreateSurvey = async () => {
        if (!token) return
        try {
            setSaving(true)
            setError(null)
            const payload: CreateSurveyRequestDTO = {
                ...formPayload,
                opensAt:     datetimeLocalToISOInstant(formOpensAt),
                closesAt:    datetimeLocalToISOInstant(formClosesAt),
                description: formPayload.description || undefined,
            }
            await createSurvey(payload, token)
            showToast('Encuesta creada correctamente', 'success')
            setMode('LIST')
            setSearchTrigger(prev => prev + 1)
        } catch (e: any) {
            console.error('Error creating survey:', e)
            showToast(extractErrorMessage(e, 'Error creando encuesta'), 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleUpdateSurvey = async () => {
        if (!selectedSurvey || !token) return
        try {
            setSaving(true)
            setError(null)
            const payload: UpdateSurveyRequestDTO = {
                title:        formPayload.title,
                description:  formPayload.description || undefined,
                responseType: formPayload.responseType,
                surveyType:   formPayload.surveyType,
                opensAt:      datetimeLocalToISOInstant(formOpensAt),
                closesAt:     datetimeLocalToISOInstant(formClosesAt),
            }
            const updated = await updateSurvey(selectedSurvey.id, payload, selectedSurvey.version, token)
            setSurveys(prev => prev.map(s => (s.id === updated.id ? updated : s)))
            showToast('Encuesta actualizada correctamente', 'success')
            setMode('LIST')
            rowExpansion.forceClose()
            setSelectedSurvey(null)
        } catch (e: any) {
            console.error('Error updating survey:', e)
            const status = e?.response?.status
            if (status === 412 || status === 428) {
                showToast('La encuesta ha sido modificada. Recarga los datos.', 'error')
            } else {
                showToast(extractErrorMessage(e, 'Error actualizando encuesta'), 'error')
            }
        } finally {
            setSaving(false)
        }
    }

    // ── Acciones de ciclo de vida de la encuesta ──────────────────────────────
    // Las 4 acciones (eliminar, abrir, cerrar, cancelar) siguen el mismo patrón:
    // confirm.open() con sus parámetros específicos. El hook garantiza que la
    // estructura del diálogo es siempre completa y consistente.

    const handleDeleteSurvey = (survey: SurveyDTO) => {
        if (!token) return
        confirm.open({
            title:   `Eliminar encuesta "${survey.title}"`,
            message: `¿Seguro que quieres eliminar la encuesta "${survey.title}"?\nEsta acción no se puede deshacer.`,
            variant: 'danger',
            onConfirm: async () => {
                confirm.close()
                try {
                    setError(null)
                    await deleteSurvey(survey.id, survey.version, token)
                    showToast('Encuesta eliminada correctamente', 'success')
                    setSurveys(prev => prev.filter(s => s.id !== survey.id))
                    setSearchTrigger(prev => prev + 1)
                    if (selectedSurvey?.id === survey.id) rowExpansion.forceClose()
                } catch (e: any) {
                    console.error('Error deleting survey:', e)
                    const status = e?.response?.status
                    if (status === 412 || status === 428) {
                        showToast('La encuesta ha sido modificada. Recarga los datos.', 'error')
                    } else {
                        showToast(extractErrorMessage(e, 'Error eliminando encuesta'), 'error')
                    }
                }
            },
        })
    }

    const handleOpenSurvey = (survey: SurveyDTO) => {
        if (!token) return
        confirm.open({
            title:   `Abrir encuesta "${survey.title}"`,
            message: `¿Seguro que quieres abrir la encuesta "${survey.title}"?\nUna vez abierta, los músicos podrán responderla.`,
            variant: 'warning',
            onConfirm: async () => {
                confirm.close()
                try {
                    setError(null)
                    const updated = await openSurvey(survey.id, survey.version, token)
                    setSurveys(prev => prev.map(s => (s.id === updated.id ? updated : s)))
                    showToast('Encuesta abierta correctamente', 'success')
                    setSelectedSurvey(updated)
                } catch (e: any) {
                    console.error('Error opening survey:', e)
                    showToast(extractErrorMessage(e, 'Error abriendo encuesta'), 'error')
                }
            },
        })
    }

    const handleCloseSurvey = (survey: SurveyDTO) => {
        if (!token) return
        confirm.open({
            title:   `Cerrar encuesta "${survey.title}"`,

            message: `¿Seguro que quieres cerrar la encuesta "${survey.title}"?`,
            variant: 'warning',
            onConfirm: async () => {
                confirm.close()
                try {
                    setError(null)
                    const updated = await closeSurvey(survey.id, survey.version, token)
                    setSurveys(prev => prev.map(s => (s.id === updated.id ? updated : s)))
                    showToast('Encuesta cerrada correctamente', 'success')
                    setSelectedSurvey(updated)
                } catch (e: any) {
                    console.error('Error closing survey:', e)
                    showToast(extractErrorMessage(e, 'Error cerrando encuesta'), 'error')
                }
            },
        })
    }

    const handleCancelSurvey = (survey: SurveyDTO) => {
        if (!token) return
        confirm.open({
            title:   `Cancelar encuesta "${survey.title}"`,
            message: `¿Seguro que quieres cancelar la encuesta "${survey.title}"?`,
            variant: 'danger',
            onConfirm: async () => {
                confirm.close()
                try {
                    setError(null)
                    const updated = await cancelSurvey(survey.id, survey.version, token)
                    setSurveys(prev => prev.map(s => (s.id === updated.id ? updated : s)))
                    showToast('Encuesta cancelada correctamente', 'success')
                    setSelectedSurvey(updated)
                } catch (e: any) {
                    console.error('Error cancelling survey:', e)
                    showToast(extractErrorMessage(e, 'Error cancelando encuesta'), 'error')
                }
            },
        })
    }

    const handleResetSurvey = (survey: SurveyDTO) => {
        if (!token) return
        confirm.open({
            title:   `Reiniciar encuesta "${survey.title}"`,
            message: `¿Seguro que quieres reiniciar la encuesta "${survey.title}"?\nSe eliminarán todas las respuestas asociadas. Esta acción no se puede deshacer.`,
            variant: 'danger',
            onConfirm: async () => {
                confirm.close()
                try {
                    setError(null)
                    const updated = await resetSurvey(survey.id, survey.version, token)
                    setSurveys(prev => prev.map(s => (s.id === updated.id ? updated : s)))
                    showToast('Encuesta reiniciada correctamente', 'success')
                    setSelectedSurvey(updated)
                } catch (e: any) {
                    console.error('Error resetting survey:', e)
                    showToast(extractErrorMessage(e, 'Error reiniciando encuesta'), 'error')
                }
            },
        })
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="page-container">

            {/* ── VISTA RESULTADOS ── */}
            {mode === 'RESULTS' && selectedSurvey && token && (
                <SurveyResultsView
                    survey={selectedSurvey}
                    onBack={() => { setMode('LIST'); setSelectedSurvey(null) }}
                    token={token}
                />
            )}

            {/* ── VISTAS LISTA / CREAR / EDITAR ── */}
            {mode !== 'RESULTS' && (
                <>
                    <h1 className="page-title">Gestión de encuestas</h1>

                    {/* ── Buscador ── */}
                    {!error && (
                    <SurveyFiltersPanel
                        filterTitle={filterTitle}               setFilterTitle={setFilterTitle}
                        filterEventId={filterEventId}           setFilterEventId={setFilterEventId}
                        filterStatus={filterStatus}             setFilterStatus={setFilterStatus}
                        filterOpensAtFrom={filterOpensAtFrom}   setFilterOpensAtFrom={setFilterOpensAtFrom}
                        filterOpensAtTo={filterOpensAtTo}       setFilterOpensAtTo={setFilterOpensAtTo}
                        filterClosesAtFrom={filterClosesAtFrom} setFilterClosesAtFrom={setFilterClosesAtFrom}
                        filterClosesAtTo={filterClosesAtTo}     setFilterClosesAtTo={setFilterClosesAtTo}
                        surveyStatuses={surveyStatuses}
                        availableEvents={availableEvents}
                        loadingOptions={loadingOptions}
                        activeFiltersCount={[
                            searchTitle, searchEventId, searchStatus,
                            searchOpensAtFrom, searchOpensAtTo,
                            searchClosesAtFrom, searchClosesAtTo,
                        ].filter(v => v !== '' && v !== undefined).length}
                        onSubmit={handleSearchSubmit}
                        onReset={handleResetFilters}
                        actionButton={
                            <button type="button" className="button-secondary" onClick={handleOpenCreateSurvey}>
                                + Nueva encuesta
                            </button>
                        }
                    />
                    )}

                    {loading && <Spinner />}
                    {error   && <ErrorState message={error} onRetry={() => setSearchTrigger(prev => prev + 1)} />}

                    {/* ── LISTA ── */}
                    {mode === 'LIST' && !loading && !error && (
                        <>
                            <div className="card">
                                <DataTable<SurveyDTO, SurveySortableField>
                                    columns={surveyColumns}
                                    data={surveys}
                                    sortState={sorting.state}
                                    onSortChange={handleSort}
                                    onRowClick={handleViewDetails}
                                    expandedRowId={rowExpansion.expandedId}
                                    isClosing={rowExpansion.isClosing}
                                    renderExpandedContent={(survey) => (
                                        <SurveyDetailCard
                                            survey={survey}
                                            onBack={() => {
                                                rowExpansion.close()
                                                setTimeout(() => { setSelectedSurvey(null) }, 250)
                                            }}
                                            backButtonLabel="Ocultar"
                                        />
                                    )}
                                />
                            </div>
                            <PaginationBar
                                {...pagination.barProps}
                                currentCount={surveys.length}
                            />
                        </>
                    )}

                    {/* ── FORMULARIO CREAR/EDITAR ── */}
                    {(mode === 'CREATE' || mode === 'EDIT') && (
                        <SurveyForm
                            editing={mode === 'EDIT' ? selectedSurvey : null}
                            formPayload={formPayload}
                            setFormPayload={setFormPayload}
                            formOpensAt={formOpensAt}
                            setFormOpensAt={setFormOpensAt}
                            formClosesAt={formClosesAt}
                            setFormClosesAt={setFormClosesAt}
                            responseTypes={responseTypes}
                            surveyTypes={surveyTypes}
                            availableEvents={availableEvents}
                            loadingOptions={loadingOptions}
                            saving={saving}
                            onSave={mode === 'CREATE' ? handleCreateSurvey : handleUpdateSurvey}
                            onCancel={handleCancelForm}
                        />
                    )}
                </>
            )}

            <ConfirmDialog {...confirm.dialogProps} />
        </div>
    )
}

export default SurveysPage