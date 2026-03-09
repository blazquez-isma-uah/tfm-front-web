import { useEffect, useState } from 'react'
import type { SurveyDTO, SurveyResponseDTO, YesNoMaybeAnswer } from '../types/surveys'
import type { InstrumentDTO } from '../types/instruments'
import {
  getYesNoMaybeResults,
  getCompleteResults,
} from '../api/surveysApi'
import { getUserByIamId } from '../api/usersApi'
import { getInstrumentById } from '../api/instrumentsApi'
import { useAuth } from '../features/auth/AuthContext'
import {
  translateYesNoMaybeAnswer,
  formatSurveyDateTime,
} from '../utils/surveyTranslations'
import { extractErrorMessage } from '../utils/errorHandler'
import '../styles/common.css'

interface SurveyResultsModalProps {
  survey: SurveyDTO
  onClose: () => void
}

interface ResponseWithUserAndInstrument extends SurveyResponseDTO {
  username?: string
  loadingUsername?: boolean
  instrument?: InstrumentDTO
  loadingInstrument?: boolean
}

export function SurveyResultsModal({ survey, onClose }: SurveyResultsModalProps) {
  const { token } = useAuth()
  
  // Resumen Si/No/Quizás
  const [summary, setSummary] = useState<Record<YesNoMaybeAnswer, number> | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  // Resultados completos
  const [responses, setResponses] = useState<ResponseWithUserAndInstrument[]>([])
  const [loadingResponses, setLoadingResponses] = useState(false)
  const [responsesError, setResponsesError] = useState<string | null>(null)
  
  const [page, setPage] = useState(0)
  const [size] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  // Ordenamiento local
  const [sortField, setSortField] = useState<'username' | 'answerYesNoMaybe' | 'instrument' | 'answeredAt' | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  
  // Mostrar respuestas detalladas
  const [showDetailedResponses, setShowDetailedResponses] = useState(false)
  // Mostrar resumen de instrumentos
  const [showInstrumentSummary, setShowInstrumentSummary] = useState(false)

  const hasInstrument = survey.responseType === 'YES_NO_MAYBE_WITH_INSTRUMENT'

  // Función de ordenamiento
  const handleSort = (field: 'username' | 'answerYesNoMaybe' | 'instrument' | 'answeredAt') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Calcular resumen por instrumentos (solo YES y MAYBE)
  const instrumentSummary = () => {
    if (!hasInstrument) return { yes: {}, maybe: {} }
    
    const yesSummary: Record<string, number> = {}
    const maybeSummary: Record<string, number> = {}
    
    responses.forEach(response => {
      if (response.instrument) {
        const instrumentKey = `${response.instrument.instrumentName} ${response.instrument.voice}`
        
        if (response.answerYesNoMaybe === 'YES') {
          yesSummary[instrumentKey] = (yesSummary[instrumentKey] || 0) + 1
        } else if (response.answerYesNoMaybe === 'MAYBE') {
          maybeSummary[instrumentKey] = (maybeSummary[instrumentKey] || 0) + 1
        }
      }
    })
    
    // Obtener todos los instrumentos únicos
    const allInstruments = new Set([
      ...Object.keys(yesSummary),
      ...Object.keys(maybeSummary)
    ])
    
    // Ordenar por nombre de instrumento
    const sortedInstruments = Array.from(allInstruments).sort((a, b) => a.localeCompare(b))
    
    // Crear objetos ordenados
    const sortedYes: Record<string, number> = {}
    const sortedMaybe: Record<string, number> = {}
    
    sortedInstruments.forEach(instrument => {
      sortedYes[instrument] = yesSummary[instrument] || 0
      sortedMaybe[instrument] = maybeSummary[instrument] || 0
    })
    
    return { yes: sortedYes, maybe: sortedMaybe }
  }

  // Ordenar respuestas localmente
  const sortedResponses = [...responses].sort((a, b) => {
    if (!sortField) return 0

    let aValue: any
    let bValue: any

    switch (sortField) {
      case 'username':
        aValue = a.username || a.userIamId
        bValue = b.username || b.userIamId
        break
      case 'answerYesNoMaybe':
        aValue = a.answerYesNoMaybe
        bValue = b.answerYesNoMaybe
        break
      case 'instrument':
        aValue = a.instrument ? `${a.instrument.instrumentName} ${a.instrument.voice}` : ''
        bValue = b.instrument ? `${b.instrument.instrumentName} ${b.instrument.voice}` : ''
        break
      case 'answeredAt':
        aValue = a.answeredAt
        bValue = b.answeredAt
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  // Cargar resumen
  useEffect(() => {
    if (!token) return

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

  // Cargar resultados completos
  useEffect(() => {
    if (!token) return

    const loadResponses = async () => {
      try {
        setLoadingResponses(true)
        setResponsesError(null)
        const data = await getCompleteResults(survey.id, page, size, token)
        
        const responsesWithUserAndInstrument: ResponseWithUserAndInstrument[] = (data.content ?? []).map(r => ({
          ...r,
          loadingUsername: true,
          loadingInstrument: hasInstrument && !!r.instrumentId,
        }))
        
        setResponses(responsesWithUserAndInstrument)
        setTotalPages(data.totalPages ?? 1)
        setTotalElements(data.totalElements ?? 0)

        // Cargar usernames e instrumentos en paralelo
        responsesWithUserAndInstrument.forEach(async (response, index) => {
          // Cargar usuario
          try {
            const user = await getUserByIamId(response.userIamId, token)
            setResponses(prev => {
              const updated = [...prev]
              updated[index] = { ...updated[index], username: user.username, loadingUsername: false }
              return updated
            })
          } catch (e) {
            console.error(`Error loading user ${response.userIamId}:`, e)
            setResponses(prev => {
              const updated = [...prev]
              updated[index] = { ...updated[index], username: response.userIamId, loadingUsername: false }
              return updated
            })
          }

          // Cargar instrumento si es necesario
          if (hasInstrument && response.instrumentId && token) {
            try {
              const instrumentId = parseInt(response.instrumentId)
              if (isNaN(instrumentId)) {
                console.error(`Invalid instrument ID: ${response.instrumentId}`)
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
            } catch (e) {
              console.error(`Error loading instrument ${response.instrumentId}:`, e)
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: hasInstrument ? '1100px' : '900px', maxHeight: '90vh', overflow: 'auto' }}
      >
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="modal-title">Resultados: {survey.title}</h2>
          <button
            type="button"
            className="button-subtle"
            onClick={onClose}
            style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}
          >
            Cerrar
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: 'calc(90vh - 80px)', overflowY: 'auto' }}>
          {/* Resumen Si/No/Quizás */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 className="section-title">Resumen de respuestas</h3>
            
            {loadingSummary && <p>Cargando resumen...</p>}
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

          {/* Botón para mostrar resumen de instrumentos */}
          {hasInstrument && !loadingResponses && !responsesError && responses.length > 0 && (() => {
            const summary = instrumentSummary()
            const hasData = Object.keys(summary.yes).length > 0 || Object.keys(summary.maybe).length > 0
            
            return hasData ? (
              <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setShowInstrumentSummary(!showInstrumentSummary)}
                >
                  {showInstrumentSummary ? 'Ocultar' : 'Mostrar'} resumen por instrumentos
                </button>
              </div>
            ) : null
          })()}

          {/* Resumen por instrumentos (solo para encuestas con instrumento) */}
          {showInstrumentSummary && hasInstrument && !loadingResponses && !responsesError && responses.length > 0 && (() => {
            const summary = instrumentSummary()
            const hasData = Object.keys(summary.yes).length > 0 || Object.keys(summary.maybe).length > 0
            
            return hasData ? (
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 className="section-title">Resumen por instrumentos</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {Array.from(new Set([...Object.keys(summary.yes), ...Object.keys(summary.maybe)]))
                    .sort((a, b) => a.localeCompare(b))
                    .map(instrument => (
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
                          paddingBottom: '0.5rem'
                        }}>
                          {instrument}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-around', gap: '1rem' }}>
                          <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '500' }}>
                              Sí
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>
                              {summary.yes[instrument] || 0}
                            </div>
                          </div>
                          <div style={{ width: '1px', backgroundColor: '#e5e7eb' }}></div>
                          <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '500' }}>
                              Quizás
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                              {summary.maybe[instrument] || 0}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : null
          })()}

          {/* Botón para mostrar respuestas detalladas */}
          {!loadingResponses && !responsesError && responses.length > 0 && (
            <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
              <button
                type="button"
                className="button-secondary"
                onClick={() => setShowDetailedResponses(!showDetailedResponses)}
              >
                {showDetailedResponses ? 'Ocultar' : 'Mostrar'} respuestas detalladas
              </button>
            </div>
          )}

          {/* Resultados completos */}
          {showDetailedResponses && (
          <div className="card">
            <h3 className="section-title">Respuestas detalladas</h3>
            
            <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th 
                          style={{ 
                            width: hasInstrument ? '15%' : '20%', 
                            cursor: 'pointer',
                            userSelect: 'none',
                            textAlign: 'center'
                          }}
                          onClick={() => handleSort('username')}
                        >
                          Usuario {sortField === 'username' && (sortDirection === 'asc' ? '▲' : '▼')}
                        </th>
                        <th 
                          style={{ 
                            width: hasInstrument ? '10%' : '12%', 
                            cursor: 'pointer',
                            userSelect: 'none',
                            textAlign: 'center'
                          }}
                          onClick={() => handleSort('answerYesNoMaybe')}
                        >
                          Respuesta {sortField === 'answerYesNoMaybe' && (sortDirection === 'asc' ? '▲' : '▼')}
                        </th>
                        {hasInstrument && (
                          <th 
                            style={{ 
                              width: '18%', 
                              cursor: 'pointer',
                              userSelect: 'none',
                              textAlign: 'center'
                            }}
                            onClick={() => handleSort('instrument')}
                          >
                            Instrumento {sortField === 'instrument' && (sortDirection === 'asc' ? '▲' : '▼')}
                          </th>
                        )}
                        <th style={{ width: hasInstrument ? '38%' : '48%', textAlign: 'center' }}>
                          Comentario
                        </th>
                        <th 
                          style={{ 
                            width: hasInstrument ? '19%' : '20%', 
                            cursor: 'pointer',
                            userSelect: 'none',
                            textAlign: 'center'
                          }}
                          onClick={() => handleSort('answeredAt')}
                        >
                          Fecha respuesta {sortField === 'answeredAt' && (sortDirection === 'asc' ? '▲' : '▼')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedResponses.map((response) => (
                        <tr key={response.id}>
                          <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                            {response.loadingUsername
                              ? 'Cargando...'
                              : response.username || response.userIamId}
                          </td>
                          <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                            {translateYesNoMaybeAnswer(response.answerYesNoMaybe)}
                          </td>
                          {hasInstrument && (
                            <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                              {response.instrumentId ? (
                                response.loadingInstrument
                                  ? 'Cargando...'
                                  : response.instrument 
                                    ? `${response.instrument.instrumentName} ${response.instrument.voice}`
                                    : response.instrumentId
                              ) : (
                                '-'
                              )}
                            </td>
                          )}
                          <td style={{ whiteSpace: 'pre-wrap', textAlign: 'center', padding: '0.5rem' }}>
                            {response.comment || '-'}
                          </td>
                          <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                            {formatSurveyDateTime(response.answeredAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                  <div style={{ 
                    marginTop: '1rem', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    gap: '1rem' 
                  }}>
                    <button
                      type="button"
                      className="button-secondary"
                      disabled={page === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                      Anterior
                    </button>
                    <span style={{ fontSize: '0.9rem' }}>
                      Página {page + 1} de {totalPages} ({totalElements} respuestas)
                    </span>
                    <button
                      type="button"
                      className="button-secondary"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    >
                      Siguiente
                    </button>
                  </div>
                )}
          </div>
          )}
        </div>
      </div>
    </div>
  )
}
