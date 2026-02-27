import { useEffect, useState } from 'react'
import type { SurveyDTO, SurveyResponseDTO, YesNoMaybeAnswer } from '../types/surveys'
import type { InstrumentDTO } from '../types/instruments'
import {
  getYesNoMaybeResults,
  getCompleteResults,
} from '../api/surveysApi'
import { getUserByIamId } from '../api/usersApi'
import { getInstrumentById } from '../api/instrumentsApi'
import {
  translateYesNoMaybeAnswer,
  formatSurveyDateTime,
} from '../utils/surveyTranslations'
import { extractErrorMessage } from '../utils/errorHandler'
import { DataTable } from './DataTable'
import type { ColumnDef, SortState } from './DataTable'
import { PaginationBar } from './PaginationBar'
import { Spinner } from './Spinner'
import '../styles/common.css'

// ── Props ─────────────────────────────────────────────────────────────────────

interface SurveyResultsViewProps {
  survey: SurveyDTO
  onBack: () => void
  token: string
}

// ── Tipos internos ────────────────────────────────────────────────────────────

type ResultsTab = 'SUMMARY' | 'INSTRUMENTS' | 'DETAILED'

type ResponseSortField = 'username' | 'answerYesNoMaybe' | 'instrument' | 'answeredAt'

interface ResponseWithUserAndInstrument extends SurveyResponseDTO {
  username?: string
  loadingUsername?: boolean
  instrument?: InstrumentDTO
  loadingInstrument?: boolean
}

const TAB_LABELS: Record<ResultsTab, string> = {
  SUMMARY:     'Resumen',
  INSTRUMENTS: 'Por instrumentos',
  DETAILED:    'Respuestas detalladas',
}

// ── Componente ────────────────────────────────────────────────────────────────

export function SurveyResultsView({ survey, onBack, token }: SurveyResultsViewProps) {
  const hasInstrument = survey.responseType === 'YES_NO_MAYBE_WITH_INSTRUMENT'

  const [activeTab, setActiveTab] = useState<ResultsTab>('SUMMARY')

  // Resumen Sí/No/Quizás
  const [summary, setSummary]             = useState<Record<YesNoMaybeAnswer, number> | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [summaryError, setSummaryError]   = useState<string | null>(null)

  // Resultados completos
  const [responses, setResponses]                 = useState<ResponseWithUserAndInstrument[]>([])
  const [loadingResponses, setLoadingResponses]   = useState(false)
  const [responsesError, setResponsesError]       = useState<string | null>(null)

  // Paginación de respuestas
  const [page, setPage]               = useState(0)
  const [size]                        = useState(10)
  const [totalPages, setTotalPages]   = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  // Ordenamiento local en la tabla de respuestas
  const [sortState, setSortState] = useState<SortState<ResponseSortField>>({
    field:     null,
    direction: 'asc',
  })

  // ── Cargar resumen ────────────────────────────────────────────────────────

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setLoadingSummary(true)
        setSummaryError(null)
        const data = await getYesNoMaybeResults(survey.id, token)
        setSummary(data)
      } catch (e: any) {
        console.error('Error loading survey summary:', e)
        setSummaryError(extractErrorMessage(e, 'Error cargando resumen'))
      } finally {
        setLoadingSummary(false)
      }
    }
    loadSummary()
  }, [survey.id, token])

  // ── Cargar respuestas completas ───────────────────────────────────────────

  useEffect(() => {
    const loadResponses = async () => {
      try {
        setLoadingResponses(true)
        setResponsesError(null)
        const data = await getCompleteResults(survey.id, page, size, token)

        const enriched: ResponseWithUserAndInstrument[] = (data.content ?? []).map(r => ({
          ...r,
          loadingUsername:   true,
          loadingInstrument: hasInstrument && !!r.instrumentId,
        }))

        setResponses(enriched)
        setTotalPages(data.totalPages ?? 1)
        setTotalElements(data.totalElements ?? 0)

        // Enriquecer con usuario e instrumento en paralelo
        enriched.forEach(async (response, index) => {
          // Usuario
          try {
            const user = await getUserByIamId(response.userIamId, token)
            setResponses(prev => {
              const updated = [...prev]
              updated[index] = { ...updated[index], username: user.username, loadingUsername: false }
              return updated
            })
          } catch {
            setResponses(prev => {
              const updated = [...prev]
              updated[index] = { ...updated[index], username: response.userIamId, loadingUsername: false }
              return updated
            })
          }

          // Instrumento
          if (hasInstrument && response.instrumentId) {
            try {
              const instrumentId = parseInt(response.instrumentId)
              if (isNaN(instrumentId)) {
                setResponses(prev => {
                  const updated = [...prev]
                  updated[index] = { ...updated[index], instrument: undefined, loadingInstrument: false }
                  return updated
                })
                return
              }
              const instrument = await getInstrumentById(instrumentId, token)
              setResponses(prev => {
                const updated = [...prev]
                updated[index] = { ...updated[index], instrument, loadingInstrument: false }
                return updated
              })
            } catch {
              setResponses(prev => {
                const updated = [...prev]
                updated[index] = { ...updated[index], instrument: undefined, loadingInstrument: false }
                return updated
              })
            }
          }
        })
      } catch (e: any) {
        console.error('Error loading complete results:', e)
        setResponsesError(extractErrorMessage(e, 'Error cargando resultados'))
      } finally {
        setLoadingResponses(false)
      }
    }
    loadResponses()
  }, [survey.id, page, size, token, hasInstrument])

  // ── Resumen por instrumentos ──────────────────────────────────────────────

  const computeInstrumentSummary = () => {
    const yesSummary:   Record<string, number> = {}
    const maybeSummary: Record<string, number> = {}

    responses.forEach(r => {
      if (!r.instrument) return
      const key = `${r.instrument.instrumentName} ${r.instrument.voice}`
      if (r.answerYesNoMaybe === 'YES') {
        yesSummary[key] = (yesSummary[key] || 0) + 1
      } else if (r.answerYesNoMaybe === 'MAYBE') {
        maybeSummary[key] = (maybeSummary[key] || 0) + 1
      }
    })

    const allInstruments = Array.from(
      new Set([...Object.keys(yesSummary), ...Object.keys(maybeSummary)])
    ).sort((a, b) => a.localeCompare(b))

    const sortedYes:   Record<string, number> = {}
    const sortedMaybe: Record<string, number> = {}
    allInstruments.forEach(k => {
      sortedYes[k]   = yesSummary[k]   || 0
      sortedMaybe[k] = maybeSummary[k] || 0
    })

    return { yes: sortedYes, maybe: sortedMaybe, instruments: allInstruments }
  }

  // ── Ordenamiento local ────────────────────────────────────────────────────

  const handleSortChange = (field: ResponseSortField) => {
    setSortState(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const sortedResponses = [...responses].sort((a, b) => {
    if (!sortState.field) return 0

    let aVal: string
    let bVal: string

    switch (sortState.field) {
      case 'username':
        aVal = a.username || a.userIamId
        bVal = b.username || b.userIamId
        break
      case 'answerYesNoMaybe':
        aVal = a.answerYesNoMaybe
        bVal = b.answerYesNoMaybe
        break
      case 'instrument':
        aVal = a.instrument ? `${a.instrument.instrumentName} ${a.instrument.voice}` : ''
        bVal = b.instrument ? `${b.instrument.instrumentName} ${b.instrument.voice}` : ''
        break
      case 'answeredAt':
        aVal = a.answeredAt
        bVal = b.answeredAt
        break
      default:
        return 0
    }

    if (aVal < bVal) return sortState.direction === 'asc' ? -1 : 1
    if (aVal > bVal) return sortState.direction === 'asc' ? 1 : -1
    return 0
  })

  // ── Columnas DataTable para Tab "Respuestas detalladas" ───────────────────

  const responseColumns: ColumnDef<ResponseWithUserAndInstrument, ResponseSortField>[] = [
    {
      key:       'username',
      header:    'Usuario',
      sortable:  true,
      sortField: 'username',
      width:     hasInstrument ? '15%' : '20%',
      render:    r => r.loadingUsername ? 'Cargando...' : (r.username || r.userIamId),
    },
    {
      key:       'answerYesNoMaybe',
      header:    'Respuesta',
      sortable:  true,
      sortField: 'answerYesNoMaybe',
      width:     hasInstrument ? '10%' : '12%',
      render:    r => translateYesNoMaybeAnswer(r.answerYesNoMaybe),
    },
    ...(hasInstrument
      ? [{
          key:       'instrument',
          header:    'Instrumento',
          sortable:  true,
          sortField: 'instrument' as ResponseSortField,
          width:     '18%',
          render:    (r: ResponseWithUserAndInstrument) =>
            r.instrumentId
              ? (r.loadingInstrument
                  ? 'Cargando...'
                  : r.instrument
                    ? `${r.instrument.instrumentName} ${r.instrument.voice}`
                    : r.instrumentId)
              : '-',
        }]
      : []),
    {
      key:      'comment',
      header:   'Comentario',
      sortable: false,
      width:    hasInstrument ? '38%' : '48%',
      render:   r => r.comment || '-',
    },
    {
      key:       'answeredAt',
      header:    'Fecha respuesta',
      sortable:  true,
      sortField: 'answeredAt',
      width:     hasInstrument ? '19%' : '20%',
      render:    r => formatSurveyDateTime(r.answeredAt),
    },
  ]

  // ── Tabs visibles ─────────────────────────────────────────────────────────

  const visibleTabs = (Object.keys(TAB_LABELS) as ResultsTab[]).filter(
    tab => tab !== 'INSTRUMENTS' || hasInstrument
  )

  // ── Render ────────────────────────────────────────────────────────────────

  const instSummary = computeInstrumentSummary()
  const hasInstData = instSummary.instruments.length > 0

  return (
    <div>
      {/* Cabecera con título y botón volver */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Resultados: {survey.title}</h1>
        <button type="button" className="button-secondary" onClick={onBack}>
          Volver al listado
        </button>
      </div>

      {/* Navegación por tabs */}
      <nav className="tab-nav" aria-label="Secciones de resultados">
        {visibleTabs.map(tab => (
          <button
            key={tab}
            type="button"
            className={`tab-nav__item${activeTab === tab ? ' tab-nav__item--active' : ''}`}
            onClick={() => setActiveTab(tab)}
            aria-current={activeTab === tab ? 'page' : undefined}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </nav>

      {/* ── Tab: Resumen ── */}
      {activeTab === 'SUMMARY' && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3 className="section-title">Resumen de respuestas</h3>

          {loadingSummary && <Spinner />}
          {summaryError && <p className="error-message">{summaryError}</p>}

          {summary && !loadingSummary && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {Object.entries(summary).map(([answer, count]) => (
                <div
                  key={answer}
                  className="detail-item"
                  style={{
                    padding: '1rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '0.5rem',
                    textAlign: 'center',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#111827' }}>
                    {count}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                    {translateYesNoMaybeAnswer(answer as YesNoMaybeAnswer)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Por instrumentos ── */}
      {activeTab === 'INSTRUMENTS' && hasInstrument && (
        <div style={{ marginTop: '1rem' }}>
          {loadingResponses && <Spinner />}
          {responsesError && <p className="error-message">{responsesError}</p>}

          {!loadingResponses && !responsesError && (
            hasInstData ? (
              <div className="card">
                <h3 className="section-title">Resumen por instrumentos</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {instSummary.instruments.map(instrument => (
                    <div
                      key={instrument}
                      style={{
                        padding: '1rem',
                        backgroundColor: '#f9fafb',
                        borderRadius: '0.5rem',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      <div style={{
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        marginBottom: '0.75rem',
                        color: '#111827',
                        borderBottom: '2px solid #e5e7eb',
                        paddingBottom: '0.5rem',
                      }}>
                        {instrument}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-around', gap: '1rem' }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '500' }}>
                            Sí
                          </div>
                          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>
                            {instSummary.yes[instrument] || 0}
                          </div>
                        </div>
                        <div style={{ width: '1px', backgroundColor: '#e5e7eb' }} />
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '500' }}>
                            Quizás
                          </div>
                          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                            {instSummary.maybe[instrument] || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card">
                <p>No hay datos de instrumentos disponibles.</p>
              </div>
            )
          )}
        </div>
      )}

      {/* ── Tab: Respuestas detalladas ── */}
      {activeTab === 'DETAILED' && (
        <div style={{ marginTop: '1rem' }}>
          {loadingResponses && <Spinner />}
          {responsesError && <p className="error-message">{responsesError}</p>}

          {!loadingResponses && !responsesError && (
            <div className="card">
              <h3 className="section-title">Respuestas detalladas</h3>
              <DataTable<ResponseWithUserAndInstrument, ResponseSortField>
                columns={responseColumns}
                data={sortedResponses}
                sortState={sortState}
                onSortChange={handleSortChange}
                getRowId={r => r.id}
              />
              {totalPages > 1 && (
                <PaginationBar
                  page={page}
                  totalPages={totalPages}
                  pageSize={size}
                  totalElements={totalElements}
                  currentCount={sortedResponses.length}
                  onPageChange={setPage}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
