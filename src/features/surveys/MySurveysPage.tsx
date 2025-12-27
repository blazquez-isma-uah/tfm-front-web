import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { getMyNotAnsweredSurveys, getMyAnsweredSurveys, searchSurveysPage } from '../../api/surveysApi'
import type { SurveyDTO } from '../../types/surveys'
import { DataTable, type SortState } from '../../components/DataTable'
import { SurveyDetailCard } from '../../components/SurveyDetailCard'
import { PaginationBar } from '../../components/PaginationBar'
import { translateSurveyStatus, translateSurveyType, formatSurveyDateTime } from '../../utils/surveyTranslations'
import '../../styles/common.css'

type TabType = 'PENDING' | 'ACTIVE' | 'HISTORY'
type SortableField = 'title' | 'surveyType' | 'status' | 'opensAt' | 'closesAt'

function MySurveysPage() {
    const { token } = useAuth()
    const [activeTab, setActiveTab] = useState<TabType>('PENDING')
    const [surveys, setSurveys] = useState<SurveyDTO[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [page, setPage] = useState(0)
    const [size, setSize] = useState(10)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)

    const [expandedSurveyId, setExpandedSurveyId] = useState<string | null>(null)
    const [isClosing, setIsClosing] = useState(false)

    const [sortField, setSortField] = useState<SortableField | null>('closesAt')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

    const sortState: SortState<SortableField> = {
        field: sortField,
        direction: sortDirection,
    }

    // Definición de columnas
    const surveyColumns = [
        {
            key: 'title',
            header: 'Título',
            sortable: true,
            sortField: 'title' as SortableField,
            width: '30%',
        },
        {
            key: 'surveyType',
            header: 'Tipo',
            sortable: true,
            sortField: 'surveyType' as SortableField,
            width: '15%',
            render: (s: SurveyDTO) => translateSurveyType(s.surveyType),
        },
        {
            key: 'status',
            header: 'Estado',
            sortable: true,
            sortField: 'status' as SortableField,
            width: '12%',
            render: (s: SurveyDTO) => translateSurveyStatus(s.status),
        },
        {
            key: 'opensAt',
            header: 'Abre',
            sortable: true,
            sortField: 'opensAt' as SortableField,
            width: '18%',
            render: (s: SurveyDTO) => formatSurveyDateTime(s.opensAt),
        },
        {
            key: 'closesAt',
            header: 'Cierra',
            sortable: true,
            sortField: 'closesAt' as SortableField,
            width: '18%',
            render: (s: SurveyDTO) => formatSurveyDateTime(s.closesAt),
        },
    ]

    useEffect(() => {
        if (!token) return

        const loadSurveys = async () => {
            try {
                setLoading(true)
                setError(null)

                const now = new Date().toISOString()
                const sortParam = sortField ? [`${sortField},${sortDirection}`] : ['closesAt,asc']

                let response

                if (activeTab === 'PENDING') {
                    // Pendientes: Abiertas y no respondidas
                    response = await getMyNotAnsweredSurveys(
                        {
                            status: 'OPEN',
                            opensTo: now,
                            closesFrom: now,
                            page,
                            size,
                            sort: sortParam,
                        },
                        token
                    )
                } else if (activeTab === 'ACTIVE') {
                    // Activas: Todas las abiertas (respondidas o no)
                    response = await searchSurveysPage(
                        {
                            status: 'OPEN',
                            opensTo: now,
                            closesFrom: now,
                            page,
                            size,
                            sort: sortParam,
                        },
                        token
                    )
                } else {
                    // Historial: Cerradas o canceladas
                    response = await getMyAnsweredSurveys(
                        {
                            page,
                            size,
                            sort: sortParam,
                        },
                        token
                    )
                    // Filtrar solo cerradas/canceladas en el cliente
                    response.content = response.content.filter(
                        s => s.status === 'CLOSED' || s.status === 'CANCELLED'
                    )
                }

                setSurveys(response.content)
                setTotalPages(response.totalPages)
                setTotalElements(response.totalElements)
            } catch (err) {
                console.error('Error loading surveys:', err)
                setError('Error cargando encuestas')
            } finally {
                setLoading(false)
            }
        }

        loadSurveys()
    }, [token, activeTab, page, size, sortField, sortDirection])

    const handleSort = (field: SortableField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
        setPage(0)
    }

    const handleViewDetails = (survey: SurveyDTO) => {
        setExpandedSurveyId(expandedSurveyId === survey.id ? null : survey.id)
    }

    return (
        <div>
            <h1>Encuestas</h1>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '2px solid #e0e0e0' }}>
                <button
                    type="button"
                    onClick={() => {
                        setActiveTab('PENDING')
                        setPage(0)
                    }}
                    style={{
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        backgroundColor: 'transparent',
                        borderBottom: activeTab === 'PENDING' ? '3px solid #1976d2' : 'none',
                        color: activeTab === 'PENDING' ? '#1976d2' : '#666',
                        fontWeight: activeTab === 'PENDING' ? 600 : 400,
                        cursor: 'pointer',
                    }}
                >
                    🕓 Pendientes
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setActiveTab('ACTIVE')
                        setPage(0)
                    }}
                    style={{
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        backgroundColor: 'transparent',
                        borderBottom: activeTab === 'ACTIVE' ? '3px solid #1976d2' : 'none',
                        color: activeTab === 'ACTIVE' ? '#1976d2' : '#666',
                        fontWeight: activeTab === 'ACTIVE' ? 600 : 400,
                        cursor: 'pointer',
                    }}
                >
                    🟢 Activas
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setActiveTab('HISTORY')
                        setPage(0)
                    }}
                    style={{
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        backgroundColor: 'transparent',
                        borderBottom: activeTab === 'HISTORY' ? '3px solid #1976d2' : 'none',
                        color: activeTab === 'HISTORY' ? '#1976d2' : '#666',
                        fontWeight: activeTab === 'HISTORY' ? 600 : 400,
                        cursor: 'pointer',
                    }}
                >
                    📁 Historial
                </button>
            </div>

            {/* Descripción del tab activo */}
            <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
                {activeTab === 'PENDING' && (
                    <p style={{ margin: 0, color: '#666' }}>
                        Encuestas abiertas que aún no has respondido
                    </p>
                )}
                {activeTab === 'ACTIVE' && (
                    <p style={{ margin: 0, color: '#666' }}>
                        Todas las encuestas actualmente abiertas (respondidas o no)
                    </p>
                )}
                {activeTab === 'HISTORY' && (
                    <p style={{ margin: 0, color: '#666' }}>
                        Encuestas cerradas o canceladas en las que participaste
                    </p>
                )}
            </div>

            {loading && <p>Cargando encuestas...</p>}
            {error && <p className="error-message">{error}</p>}

            {!loading && !error && (
                <>
                    <div className="card">
                        <DataTable<SurveyDTO, SortableField>
                            columns={surveyColumns}
                            data={surveys}
                            sortState={sortState}
                            onSortChange={handleSort}
                            onRowClick={handleViewDetails}
                            expandedRowId={expandedSurveyId}
                            isClosing={isClosing}
                            renderExpandedContent={(survey) => (
                                <SurveyDetailCard
                                    survey={survey}
                                    onBack={() => {
                                        setIsClosing(true)
                                        setTimeout(() => {
                                            setExpandedSurveyId(null)
                                            setIsClosing(false)
                                        }, 250)
                                    }}
                                    backButtonLabel="Ocultar"
                                    showButtons={false}
                                />
                            )}
                        />
                    </div>
                    <PaginationBar
                        page={page}
                        totalPages={totalPages}
                        pageSize={size}
                        currentCount={surveys.length}
                        totalElements={totalElements}
                        onPageChange={setPage}
                        onPageSizeChange={(newSize) => {
                            setSize(newSize)
                            setPage(0)
                        }}
                    />
                </>
            )}
        </div>
    )
}

export default MySurveysPage
