import { useEffect, useState } from 'react'
import type { EventDTO } from '../types/events'
import type { SurveyDTO } from '../types/surveys'
import { EventInfoSection } from './EventInfoSection'
import { SurveyDetailCard } from './SurveyDetailCard'
import { searchSurveysPage } from '../api/surveysApi'
import { useAuth } from '../features/auth/AuthContext'
import { Spinner } from './Spinner'
import '../styles/common.css'

interface EventDetailCardCompleteProps {
    event: EventDTO
    onBack?: () => void
    backButtonLabel?: string
}

/**
 * Componente completo para mostrar el detalle de un evento con encuestas y partituras asociadas.
 * Usado principalmente en la zona común de eventos.
 */
export function EventDetailCardComplete({
    event,
    onBack,
    backButtonLabel = 'Volver a la lista',
}: EventDetailCardCompleteProps) {
    const { token } = useAuth()
    const [surveys, setSurveys] = useState<SurveyDTO[]>([])
    const [loadingSurveys, setLoadingSurveys] = useState(false)
    const [errorSurveys, setErrorSurveys] = useState<string | null>(null)
    const [expandedSurveyId, setExpandedSurveyId] = useState<string | null>(null)
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    useEffect(() => {
        if (!token || !event.id) return

        const loadSurveys = async () => {
            try {
                setLoadingSurveys(true)
                setErrorSurveys(null)
                const response = await searchSurveysPage(
                    {
                        eventId: event.id,
                        page: 0,
                        size: 50, // Cargar todas las encuestas del evento
                    },
                    token
                )
                setSurveys(response.content)
            } catch (err) {
                console.error('Error loading surveys:', err)
                setErrorSurveys('No se pudieron cargar las encuestas')
            } finally {
                setLoadingSurveys(false)
            }
        }

        loadSurveys()
    }, [event.id, token, refreshTrigger])

    const handleResponseSubmitted = () => {
        // Refrescar la lista de encuestas después de responder
        setRefreshTrigger(prev => prev + 1)
    }

    const handleSurveyClick = (surveyId: string) => {
        setExpandedSurveyId(expandedSurveyId === surveyId ? null : surveyId)
    }

    return (
        <div className="card" style={{ marginTop: '1rem' }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--space-4)',
                }}
            >
                <div className="section-title" style={{ marginBottom: 0 }}>
                    Detalle del evento
                </div>
                {onBack && (
                    <button
                        type="button"
                        className="button-subtle"
                        onClick={onBack}
                        style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}
                    >
                        {backButtonLabel}
                    </button>
                )}
            </div>

            {/* Información básica del evento */}
            <EventInfoSection event={event} />

            {/* Sección de Encuestas */}
            <hr style={{ margin: 'var(--space-5) 0', borderColor: 'var(--border-light)' }} />
            <div className="section-title" style={{ marginBottom: 'var(--space-3)' }}>
                Encuestas asociadas
            </div>
            {loadingSurveys && <Spinner />}
            {errorSurveys && <p style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)' }}>{errorSurveys}</p>}
            {!loadingSurveys && !errorSurveys && surveys.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>No hay encuestas asociadas a este evento</p>
            )}
            {!loadingSurveys && !errorSurveys && surveys.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {surveys.map((survey) => (
                        <div key={survey.id} style={{ cursor: 'pointer' }}>
                            <div onClick={() => handleSurveyClick(survey.id)}>
                                <SurveyDetailCard
                                    survey={survey}
                                    compact={true}
                                />
                            </div>
                            {expandedSurveyId === survey.id && (
                                <div style={{ marginTop: 'var(--space-3)', marginLeft: 'var(--space-4)' }}>
                                    <SurveyDetailCard
                                        survey={survey}
                                        showResponseForm={true}
                                        onResponseSubmitted={handleResponseSubmitted}
                                        showButtons={false}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Sección de Partituras - Placeholder */}
            <hr style={{ margin: 'var(--space-5) 0', borderColor: 'var(--border-light)' }} />
            <div className="section-title" style={{ marginBottom: 'var(--space-3)' }}>
                Partituras asociadas
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', fontStyle: 'italic' }}>
                Las partituras se mostrarán aquí cuando el microservicio esté disponible
            </p>
        </div>
    )
}
