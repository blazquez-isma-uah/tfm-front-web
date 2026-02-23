import { type FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { extractErrorMessage } from '../../utils/errorHandler'
import {
    searchSurveysPage,
    getSurveyById,
    createSurvey,
    updateSurvey,
    deleteSurvey,
    openSurvey,
    closeSurvey,
    cancelSurvey,
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
import { DataTable, type SortState } from '../../components/DataTable'
import { PaginationBar } from '../../components/PaginationBar'
import { SurveyDetailCard } from '../../components/SurveyDetailCard'
import { SurveyResultsModal } from '../../components/SurveyResultsModal'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import {
    translateSurveyStatus,
    translateResponseType,
    translateSurveyType,
    formatSurveyDateTime,
} from '../../utils/surveyTranslations'
import { usePagination, useSorting, useConfirmDialog, useRowExpansion } from '../../hooks'
import '../../styles/common.css'

/**
 * SurveysPage — Administración de encuestas (solo ADMIN).
 *
 * HOOKS APLICADOS:
 * - usePagination:    sustituye page/size/totalPages/totalElements
 * - useSorting:       sustituye sortField/sortDirection/sortState
 * - useConfirmDialog: sustituye el estado confirmDialog inline.
 *   NOTA: Esta página es la que más veces llama a confirm.open() (4 acciones:
 *   eliminar, abrir, cerrar, cancelar). Con el hook, cada llamada es uniforme
 *   y no hay riesgo de olvidar campos al construir el objeto manualmente.
 * - useRowExpansion:  sustituye expandedSurveyId/isClosing
 */

type ViewMode = 'LIST' | 'CREATE' | 'EDIT' | 'DETAIL'

// ── Helpers de conversión de fechas (a nivel de módulo, son funciones puras) ─
function datetimeLocalToISOInstant(datetimeLocal: string): string {
    if (!datetimeLocal) return ''
    return `${datetimeLocal}:00.000Z`
}

function toDateTimeLocal(isoString?: string): string {
    if (!isoString) return ''
    const match = isoString.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/)
    return match ? match[1] : ''
}

function SurveysPage() {
    const { token, hasRole } = useAuth()
    const isAdmin = hasRole('ADMIN')

    const [surveys, setSurveys]   = useState<SurveyDTO[]>([])
    const [loading, setLoading]   = useState(false)
    const [error, setError]       = useState<string | null>(null)
    const [saving, setSaving]     = useState(false)

    // ── Hooks de estado reutilizable ──────────────────────────────────────────
    const pagination   = usePagination({ defaultSize: 10 })
    const sorting      = useSorting<SurveySortableField>()
    const confirm      = useConfirmDialog()
    const rowExpansion = useRowExpansion<string>()

    // ── Estado propio del componente ──────────────────────────────────────────
    const [mode, setMode]                         = useState<ViewMode>('LIST')
    const [selectedSurvey, setSelectedSurvey]     = useState<SurveyDTO | null>(null)
    const [showResultsModal, setShowResultsModal] = useState(false)
    const [resultsModalSurvey, setResultsModalSurvey] = useState<SurveyDTO | null>(null)

    // Opciones de selectores
    const [surveyStatuses, setSurveyStatuses]   = useState<SurveyStatus[]>([])
    const [responseTypes, setResponseTypes]     = useState<ResponseType[]>([])
    const [surveyTypes, setSurveyTypes]         = useState<SurveyType[]>([])
    const [availableEvents, setAvailableEvents] = useState<EventDTO[]>([])
    const [loadingOptions, setLoadingOptions]   = useState(false)

    // Filtros visibles
    const [filterTitle, setFilterTitle]               = useState('')
    const [filterEventId, setFilterEventId]           = useState('')
    const [filterStatus, setFilterStatus]             = useState<SurveyStatus | ''>('')
    const [filterOpensAtFrom, setFilterOpensAtFrom]   = useState('')
    const [filterOpensAtTo, setFilterOpensAtTo]       = useState('')
    const [filterClosesAtFrom, setFilterClosesAtFrom] = useState('')
    const [filterClosesAtTo, setFilterClosesAtTo]     = useState('')

    // Filtros efectivos
    const [searchTitle, setSearchTitle]                   = useState('')
    const [searchEventId, setSearchEventId]               = useState('')
    const [searchStatus, setSearchStatus]                 = useState<SurveyStatus | undefined>(undefined)
    const [searchOpensAtFrom, setSearchOpensAtFrom]       = useState<string | undefined>(undefined)
    const [searchOpensAtTo, setSearchOpensAtTo]           = useState<string | undefined>(undefined)
    const [searchClosesAtFrom, setSearchClosesAtFrom]     = useState<string | undefined>(undefined)
    const [searchClosesAtTo, setSearchClosesAtTo]         = useState<string | undefined>(undefined)
    const [searchTrigger, setSearchTrigger]               = useState(0)

    // Formulario crear/editar
    const [formPayload, setFormPayload] = useState<CreateSurveyRequestDTO>({
        eventId: '', title: '', description: '', responseType: '', surveyType: '', opensAt: '', closesAt: '',
    })
    const [formOpensAt, setFormOpensAt]   = useState('')
    const [formClosesAt, setFormClosesAt] = useState('')

    // ── Columnas ──────────────────────────────────────────────────────────────
    const surveyColumns = [
        { key: 'title',   header: 'Título',    sortable: true, sortField: 'title'   as SurveySortableField, width: '30%' },
        {
            key: 'status', header: 'Estado', sortable: true, sortField: 'status' as SurveySortableField, width: '15%',
            render: (s: SurveyDTO) => translateSurveyStatus(s.status),
        },
        {
            key: 'opensAt', header: 'Apertura', sortable: true, sortField: 'opensAt' as SurveySortableField, width: '15%',
            render: (s: SurveyDTO) => formatSurveyDateTime(s.opensAt),
        },
        {
            key: 'closesAt', header: 'Cierre', sortable: true, sortField: 'closesAt' as SurveySortableField, width: '15%',
            render: (s: SurveyDTO) => formatSurveyDateTime(s.closesAt),
        },
        {
            key: 'actions', header: 'Acciones', sortable: false, width: '20%',
            render: (s: SurveyDTO) => (
                <div className="actions-container">
                    <button type="button" className="button-secondary" onClick={e => { e.stopPropagation(); handleEditSurvey(s) }}>Editar</button>
                    <button type="button" className="button-danger"    onClick={e => { e.stopPropagation(); handleDeleteSurvey(s) }}>Eliminar</button>
                </div>
            ),
        },
    ]

    // ── Effects ───────────────────────────────────────────────────────────────

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

    // ── Guard de permisos ─────────────────────────────────────────────────────
    if (!isAdmin) {
        return (
            <div className="page-container">
                <h1 className="page-title">Gestión de encuestas</h1>
                <p>No tienes permisos para ver esta sección.</p>
            </div>
        )
    }

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
        setResultsModalSurvey(survey)
        setShowResultsModal(true)
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
            setMode('LIST')
            setSearchTrigger(prev => prev + 1)
        } catch (e: any) {
            console.error('Error creating survey:', e)
            setError(extractErrorMessage(e, 'Error creando encuesta'))
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
                title:       formPayload.title,
                description: formPayload.description || undefined,
                surveyType:  formPayload.surveyType,
                opensAt:     datetimeLocalToISOInstant(formOpensAt),
                closesAt:    datetimeLocalToISOInstant(formClosesAt),
            }
            const updated = await updateSurvey(selectedSurvey.id, payload, selectedSurvey.version, token)
            setSurveys(prev => prev.map(s => (s.id === updated.id ? updated : s)))
            setMode('LIST')
            rowExpansion.forceClose()
            setSelectedSurvey(null)
        } catch (e: any) {
            console.error('Error updating survey:', e)
            const status = e?.response?.status
            if (status === 412 || status === 428) {
                setError('La encuesta ha sido modificada. Recarga los datos.')
            } else {
                setError(extractErrorMessage(e, 'Error actualizando encuesta'))
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
                    setSurveys(prev => prev.filter(s => s.id !== survey.id))
                    setSearchTrigger(prev => prev + 1)
                    if (selectedSurvey?.id === survey.id) rowExpansion.forceClose()
                } catch (e: any) {
                    console.error('Error deleting survey:', e)
                    const status = e?.response?.status
                    if (status === 412 || status === 428) {
                        setError('La encuesta ha sido modificada. Recarga los datos.')
                    } else {
                        setError(extractErrorMessage(e, 'Error eliminando encuesta'))
                    }
                }
            },
        })
    }

    const handleOpenSurvey = (survey: SurveyDTO) => {
        if (!token) return
        confirm.open({
            title:   `Abrir encuesta "${survey.title}"`,
            message: `¿Seguro que quieres abrir la encuesta "${survey.title}"?`,
            variant: 'info',
            onConfirm: async () => {
                confirm.close()
                try {
                    setError(null)
                    const updated = await openSurvey(survey.id, survey.version, token)
                    setSurveys(prev => prev.map(s => (s.id === updated.id ? updated : s)))
                    setSelectedSurvey(updated)
                } catch (e: any) {
                    console.error('Error opening survey:', e)
                    setError(extractErrorMessage(e, 'Error abriendo encuesta'))
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
                    setSelectedSurvey(updated)
                } catch (e: any) {
                    console.error('Error closing survey:', e)
                    setError(extractErrorMessage(e, 'Error cerrando encuesta'))
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
                    setSelectedSurvey(updated)
                } catch (e: any) {
                    console.error('Error cancelling survey:', e)
                    setError(extractErrorMessage(e, 'Error cancelando encuesta'))
                }
            },
        })
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="page-container">
            <h1 className="page-title">Gestión de encuestas</h1>

            {/* ── Buscador ── */}
            <form onSubmit={handleSearchSubmit} className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div className="section-title" style={{ marginBottom: 0 }}>Filtros de búsqueda</div>
                    <button type="button" className="button-secondary" onClick={handleOpenCreateSurvey}>
                        + Nueva encuesta
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                    {/* Grupo 1: Título, Evento, Estado */}
                    <div className="search-grid">
                        <div className="form-field">
                            <span className="label-text">Título</span>
                            <input type="text" placeholder="Buscar por título" value={filterTitle} onChange={e => setFilterTitle(e.target.value)} className="input-full-width" />
                        </div>
                        <div className="form-field">
                            <span className="label-text">Evento</span>
                            <select value={filterEventId} onChange={e => setFilterEventId(e.target.value)} className="select-base" disabled={loadingOptions}>
                                <option value="">Todos</option>
                                {availableEvents.map(evt => <option key={evt.id} value={evt.id}>{evt.title}</option>)}
                            </select>
                        </div>
                        <div className="form-field">
                            <span className="label-text">Estado</span>
                            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as SurveyStatus | '')} className="select-base" disabled={loadingOptions}>
                                <option value="">Todos</option>
                                {surveyStatuses.map(s => <option key={s} value={s}>{translateSurveyStatus(s)}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Grupo 2: Fechas de apertura y cierre */}
                    <div className="search-grid">
                        <div className="form-field">
                            <span className="label-text">Fecha apertura (desde)</span>
                            <input type="datetime-local" value={filterOpensAtFrom} onChange={e => setFilterOpensAtFrom(e.target.value)} className="input-full-width" />
                        </div>
                        <div className="form-field">
                            <span className="label-text">Fecha apertura (hasta)</span>
                            <input type="datetime-local" value={filterOpensAtTo} onChange={e => setFilterOpensAtTo(e.target.value)} className="input-full-width" />
                        </div>
                        <div className="form-field">
                            <span className="label-text">Fecha cierre (desde)</span>
                            <input type="datetime-local" value={filterClosesAtFrom} onChange={e => setFilterClosesAtFrom(e.target.value)} className="input-full-width" />
                        </div>
                        <div className="form-field">
                            <span className="label-text">Fecha cierre (hasta)</span>
                            <input type="datetime-local" value={filterClosesAtTo} onChange={e => setFilterClosesAtTo(e.target.value)} className="input-full-width" />
                        </div>
                    </div>
                </div>

                <div className="search-actions-row" style={{ justifyContent: 'space-between' }}>
                    <button type="submit" className="button-primary">Buscar</button>
                    <button type="button" className="button-subtle" onClick={handleResetFilters} style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>
                        Resetear filtros
                    </button>
                </div>
            </form>

            {loading && <p>Cargando encuestas...</p>}
            {error   && <p className="error-message">{error}</p>}

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
                                    onEdit={handleEditSurvey}
                                    onViewResults={handleViewResults}
                                    onOpen={handleOpenSurvey}
                                    onClose={handleCloseSurvey}
                                    onCancel={handleCancelSurvey}
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
                <form
                    className="form-card"
                    onSubmit={e => { e.preventDefault(); mode === 'CREATE' ? handleCreateSurvey() : handleUpdateSurvey() }}
                >
                    <h2 className="section-title">
                        {mode === 'CREATE' ? 'Crear encuesta' : 'Editar encuesta'}
                    </h2>

                    {/* Línea 1: Tipo de respuesta, Tipo de encuesta, Evento */}
                    <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '0.75rem' }}>
                        <div className="form-field">
                            <label className="label-text">Tipo de respuesta *</label>
                            <select value={formPayload.responseType} onChange={e => setFormPayload({ ...formPayload, responseType: e.target.value })} required disabled={mode === 'EDIT' || loadingOptions} className="select-base">
                                <option value="">Selecciona tipo</option>
                                {responseTypes.map(type => <option key={type} value={type}>{translateResponseType(type)}</option>)}
                            </select>
                        </div>
                        <div className="form-field">
                            <label className="label-text">Tipo de encuesta *</label>
                            <select value={formPayload.surveyType} onChange={e => setFormPayload({ ...formPayload, surveyType: e.target.value })} required disabled={loadingOptions} className="select-base">
                                <option value="">Selecciona tipo</option>
                                {surveyTypes.map(type => <option key={type} value={type}>{translateSurveyType(type)}</option>)}
                            </select>
                        </div>
                        <div className="form-field">
                            <label className="label-text">Evento *</label>
                            <select value={formPayload.eventId} onChange={e => setFormPayload({ ...formPayload, eventId: e.target.value })} required disabled={mode === 'EDIT' || loadingOptions} className="select-base">
                                <option value="">Selecciona un evento</option>
                                {availableEvents.map(evt => <option key={evt.id} value={evt.id}>{evt.title}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Línea 2: Título (2 cols), Fecha apertura, Fecha cierre */}
                    <div className="form-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '0.75rem' }}>
                        <div className="form-field" style={{ gridColumn: 'span 2' }}>
                            <label className="label-text">Título *</label>
                            <input type="text" value={formPayload.title} onChange={e => setFormPayload({ ...formPayload, title: e.target.value })} required maxLength={200} className="input-full-width" />
                        </div>
                        <div className="form-field">
                            <label className="label-text">Fecha apertura *</label>
                            <input type="datetime-local" value={formOpensAt} onChange={e => setFormOpensAt(e.target.value)} required className="input-full-width" />
                        </div>
                        <div className="form-field">
                            <label className="label-text">Fecha cierre *</label>
                            <input type="datetime-local" value={formClosesAt} onChange={e => setFormClosesAt(e.target.value)} required className="input-full-width" />
                        </div>
                    </div>

                    {/* Línea 3: Descripción */}
                    <div className="form-grid">
                        <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                            <label className="label-text">Descripción</label>
                            <textarea value={formPayload.description} onChange={e => setFormPayload({ ...formPayload, description: e.target.value })} maxLength={4000} className="textarea-base" rows={4} />
                        </div>
                    </div>

                    <div className="button-row-1rem">
                        <button type="submit" className="button-primary" disabled={saving}>
                            {saving ? 'Guardando...' : mode === 'CREATE' ? 'Crear' : 'Guardar'}
                        </button>
                        <button type="button" className="button-secondary" onClick={handleCancelForm} disabled={saving}>
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            <ConfirmDialog {...confirm.dialogProps} />

            {showResultsModal && resultsModalSurvey && (
                <SurveyResultsModal
                    survey={resultsModalSurvey}
                    onClose={() => { setShowResultsModal(false); setResultsModalSurvey(null) }}
                />
            )}
        </div>
    )
}

export default SurveysPage