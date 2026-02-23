import { type FormEvent, useEffect, useState } from 'react'
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
import { SurveyDetailCard } from '../../components/SurveyDetailCard'
import { SurveyResultsModal } from '../../components/SurveyResultsModal'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { SurveyFiltersPanel } from '../../components/SurveyFiltersPanel'
import { SurveyForm } from '../../components/SurveyForm'
import { EditIcon, TrashIcon } from '../../components/Icons'
import {
    translateSurveyStatus,
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
                    <span className="tooltip-wrap" data-tooltip="Editar">
                        <button
                            type="button"
                            className="btn-icon btn-icon-edit"
                            onClick={e => { e.stopPropagation(); handleEditSurvey(s) }}
                        ><EditIcon /></button>
                    </span>
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