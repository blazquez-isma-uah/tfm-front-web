import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { getMyNotAnsweredSurveys, getMyAnsweredSurveys, searchSurveysPage } from '../../api/surveysApi'
import type { SurveyDTO } from '../../types/surveys'
import { DataTable } from '../../components/DataTable'
import { SurveyDetailCard } from '../../components/SurveyDetailCard'
import { PaginationBar } from '../../components/PaginationBar'
import { translateSurveyStatus, translateSurveyType, formatSurveyDateTime } from '../../utils/surveyTranslations'
import { usePagination, useSorting, useRowExpansion } from '../../hooks'
import '../../styles/common.css'

/**
 * MySurveysPage — Encuestas del músico autenticado (vista no-admin).
 *
 * HOOKS APLICADOS:
 * - usePagination:   sustituye page/size/totalPages/totalElements
 * - useSorting:      sustituye sortField/sortDirection con valor inicial 'closesAt'
 * - useRowExpansion: sustituye expandedSurveyId/isClosing
 *
 * useConfirmDialog NO se usa porque esta página no tiene acciones destructivas.
 * El usuario solo puede ver y responder encuestas, no eliminarlas.
 *
 * NOTA sobre handleViewDetails:
 * El original tenía un bug sutil: al hacer click en una fila ya expandida,
 * llamaba a setExpandedSurveyId(null) directamente sin animación de cierre,
 * ignorando isClosing. El nuevo código usa rowExpansion.close() que respeta
 * la animación de 250ms consistentemente con el resto de páginas.
 */

type TabType = 'PENDING' | 'ACTIVE' | 'HISTORY'
type SortableField = 'title' | 'surveyType' | 'status' | 'opensAt' | 'closesAt'

function MySurveysPage() {
    const { token } = useAuth()

    const [activeTab, setActiveTab] = useState<TabType>('PENDING')
    const [surveys, setSurveys]     = useState<SurveyDTO[]>([])
    const [loading, setLoading]     = useState(false)
    const [error, setError]         = useState<string | null>(null)
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    // ── Hooks de estado reutilizable ──────────────────────────────────────────
    const pagination   = usePagination({ defaultSize: 10 })
    // useSorting con valor inicial 'closesAt': el campo más relevante para el usuario
    const sorting      = useSorting<SortableField>('closesAt')
    const rowExpansion = useRowExpansion<string>()

    // ── Columnas ──────────────────────────────────────────────────────────────
    const surveyColumns = [
        { key: 'title',      header: 'Título',  sortable: true, sortField: 'title'      as SortableField, width: '30%' },
        {
            key: 'surveyType', header: 'Tipo',   sortable: true, sortField: 'surveyType' as SortableField, width: '15%',
            render: (s: SurveyDTO) => translateSurveyType(s.surveyType),
        },
        {
            key: 'status',     header: 'Estado', sortable: true, sortField: 'status'     as SortableField, width: '12%',
            render: (s: SurveyDTO) => translateSurveyStatus(s.status),
        },
        {
            key: 'opensAt',    header: 'Abre',   sortable: true, sortField: 'opensAt'    as SortableField, width: '18%',
            render: (s: SurveyDTO) => formatSurveyDateTime(s.opensAt),
        },
        {
            key: 'closesAt',   header: 'Cierra', sortable: true, sortField: 'closesAt'   as SortableField, width: '18%',
            render: (s: SurveyDTO) => formatSurveyDateTime(s.closesAt),
        },
    ]

    // ── Effect: carga de encuestas ────────────────────────────────────────────
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

    // handleSort: resetea página además de cambiar ordenación
    const handleSort = (field: SortableField) => {
        pagination.goToPage(0)
        sorting.handleSortChange(field)
    }

    // handleViewDetails: usa rowExpansion.close() para respetar la animación
    // al cerrar (el original la ignoraba cuando se cerraba por segundo click en la fila)
    const handleViewDetails = (survey: SurveyDTO) => {
        if (rowExpansion.expandedId === survey.id) {
            rowExpansion.close()
        } else {
            rowExpansion.toggle(survey.id)
        }
    }

    const handleResponseSubmitted = () => {
        setRefreshTrigger(prev => prev + 1)
    }

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab)
        pagination.goToPage(0)
        rowExpansion.forceClose()
    }

    // ── Estilos de tab (función auxiliar para evitar repetición) ─────────────
    const tabStyle = (tab: TabType): React.CSSProperties => ({
        padding: '0.75rem 1.5rem',
        border: 'none',
        backgroundColor: 'transparent',
        borderBottom: activeTab === tab ? '3px solid #1976d2' : 'none',
        color:      activeTab === tab ? '#1976d2' : '#666',
        fontWeight: activeTab === tab ? 600 : 400,
        cursor: 'pointer',
    })

    const tabDescriptions: Record<TabType, string> = {
        PENDING: 'Encuestas abiertas que aún no has respondido',
        ACTIVE:  'Todas las encuestas actualmente abiertas (respondidas o no)',
        HISTORY: 'Encuestas cerradas o canceladas en las que participaste',
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="page-container">
            <h1 className="page-title">Encuestas</h1>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '2px solid #e0e0e0' }}>
                <button type="button" onClick={() => handleTabChange('PENDING')} style={tabStyle('PENDING')}>🕓 Pendientes</button>
                <button type="button" onClick={() => handleTabChange('ACTIVE')}  style={tabStyle('ACTIVE')} >🟢 Activas</button>
                <button type="button" onClick={() => handleTabChange('HISTORY')} style={tabStyle('HISTORY')}>📁 Historial</button>
            </div>

            {/* Descripción del tab activo */}
            <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
                <p style={{ margin: 0, color: '#666' }}>{tabDescriptions[activeTab]}</p>
            </div>

            {loading && <p>Cargando encuestas...</p>}
            {error   && <p className="error-message">{error}</p>}

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
                    <PaginationBar
                        {...pagination.barProps}
                        currentCount={surveys.length}
                    />
                </>
            )}
        </div>
    )
}

export default MySurveysPage