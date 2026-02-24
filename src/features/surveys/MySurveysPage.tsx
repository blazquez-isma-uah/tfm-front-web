import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { getMyNotAnsweredSurveys, getMyAnsweredSurveys, searchSurveysPage } from '../../api/surveysApi'
import type { SurveyDTO } from '../../types/surveys'
import { DataTable } from '../../components/DataTable'
import { SurveyDetailCard } from '../../components/SurveyDetailCard'
import { PaginationBar } from '../../components/PaginationBar'
import { ErrorState } from '../../components/ErrorState'
import { Spinner } from '../../components/Spinner'
import { translateSurveyStatus, translateSurveyType, formatSurveyDateTime } from '../../utils/surveyTranslations'
import { usePagination, useSorting, useRowExpansion } from '../../hooks'
import '../../styles/common.css'

/**
 * MySurveysPage — Encuestas del músico autenticado (vista no-admin).
 *
 * Ruta: /surveys
 *
 * Tabs:
 *   - PENDING: encuestas abiertas sin responder
 *   - ACTIVE:  todas las encuestas actualmente abiertas
 *   - HISTORY: encuestas cerradas o canceladas en las que participó el usuario
 *
 * useConfirmDialog NO se usa: esta página no tiene acciones destructivas.
 * El usuario solo puede ver y responder encuestas.
 */

type TabType = 'PENDING' | 'ACTIVE' | 'HISTORY'
type SortableField = 'title' | 'surveyType' | 'status' | 'opensAt' | 'closesAt'

const TAB_LABELS: Record<TabType, string> = {
    PENDING: 'Pendientes',
    ACTIVE:  'Activas',
    HISTORY: 'Historial',
}

const TAB_DESCRIPTIONS: Record<TabType, string> = {
    PENDING: 'Encuestas abiertas que aún no has respondido',
    ACTIVE:  'Todas las encuestas actualmente abiertas (respondidas o no)',
    HISTORY: 'Encuestas cerradas o canceladas en las que participaste',
}

function MySurveysPage() {
    const { token } = useAuth()

    const [activeTab, setActiveTab]           = useState<TabType>('PENDING')
    const [surveys, setSurveys]               = useState<SurveyDTO[]>([])
    const [loading, setLoading]               = useState(false)
    const [error, setError]                   = useState<string | null>(null)
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    const pagination   = usePagination({ defaultSize: 10 })
    const sorting      = useSorting<SortableField>('closesAt')
    const rowExpansion = useRowExpansion<string>()

    // ── Columnas ──────────────────────────────────────────────────────────────

    const surveyColumns = [
        { key: 'title',      header: 'Título',  sortable: true, sortField: 'title'      as SortableField, width: '30%' },
        { key: 'surveyType', header: 'Tipo',    sortable: true, sortField: 'surveyType' as SortableField, width: '15%', render: (s: SurveyDTO) => translateSurveyType(s.surveyType) },
        { key: 'status',     header: 'Estado',  sortable: true, sortField: 'status'     as SortableField, width: '12%', render: (s: SurveyDTO) => translateSurveyStatus(s.status) },
        { key: 'opensAt',    header: 'Abre',    sortable: true, sortField: 'opensAt'    as SortableField, width: '18%', render: (s: SurveyDTO) => formatSurveyDateTime(s.opensAt) },
        { key: 'closesAt',   header: 'Cierra',  sortable: true, sortField: 'closesAt'   as SortableField, width: '18%', render: (s: SurveyDTO) => formatSurveyDateTime(s.closesAt) },
    ]

    // ── Effect ────────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!token) return

        const loadSurveys = async () => {
            try {
                setLoading(true)
                setError(null)

                const now       = new Date().toISOString()
                const sortParam = sorting.field
                    ? [`${sorting.field},${sorting.direction}`]
                    : ['closesAt,asc']

                let response

                if (activeTab === 'PENDING') {
                    response = await getMyNotAnsweredSurveys(
                        { status: 'OPEN', opensTo: now, closesFrom: now, page: pagination.page, size: pagination.size, sort: sortParam },
                        token
                    )
                } else if (activeTab === 'ACTIVE') {
                    response = await searchSurveysPage(
                        { status: 'OPEN', opensTo: now, closesFrom: now, page: pagination.page, size: pagination.size, sort: sortParam },
                        token
                    )
                } else {
                    // HISTORY: encuestas respondidas → filtrar cerradas/canceladas en cliente
                    response = await getMyAnsweredSurveys(
                        { page: pagination.page, size: pagination.size, sort: sortParam },
                        token
                    )
                    response.content = response.content.filter(
                        s => s.status === 'CLOSED' || s.status === 'CANCELLED'
                    )
                }

                setSurveys(response.content)
                pagination.setTotals(response.totalPages, response.totalElements)
            } catch (err) {
                console.error('Error loading surveys:', err)
                setError('Error cargando encuestas')
            } finally {
                setLoading(false)
            }
        }

        loadSurveys()
    }, [token, activeTab, pagination.page, pagination.size, sorting.field, sorting.direction, refreshTrigger])

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleSort = (field: SortableField) => {
        pagination.goToPage(0)
        sorting.handleSortChange(field)
    }

    const handleViewDetails = (survey: SurveyDTO) => {
        if (rowExpansion.expandedId === survey.id) {
            rowExpansion.close()
        } else {
            rowExpansion.toggle(survey.id)
        }
    }

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab)
        pagination.goToPage(0)
        rowExpansion.forceClose()
    }

    const handleResponseSubmitted = () => {
        setRefreshTrigger(prev => prev + 1)
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="page-container">
            <h1 className="page-title">Encuestas</h1>

            <nav className="tab-nav" aria-label="Vistas de encuestas">
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

            <p className="tab-description">{TAB_DESCRIPTIONS[activeTab]}</p>

            {loading && <Spinner />}
            {error   && <ErrorState message={error} onRetry={() => setRefreshTrigger(prev => prev + 1)} />}

            {!loading && !error && (
                <>
                    <div className="card">
                        <DataTable<SurveyDTO, SortableField>
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
                                    onBack={() => rowExpansion.close()}
                                    backButtonLabel="Ocultar"
                                    showResponseForm={true}
                                    onResponseSubmitted={handleResponseSubmitted}
                                    showButtons={false}
                                />
                            )}
                        />
                    </div>
                    <PaginationBar {...pagination.barProps} currentCount={surveys.length} />
                </>
            )}
        </div>
    )
}

export default MySurveysPage