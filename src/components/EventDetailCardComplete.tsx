import { useEffect, useState } from 'react'
import type { EventDTO } from '../types/events'
import type { SurveyDTO } from '../types/surveys'
import { EventInfoSection } from './EventInfoSection'
import { SurveyDetailCard } from './SurveyDetailCard'
import { searchSurveysPage } from '../api/surveysApi'
import { useAuth } from '../features/auth/AuthContext'
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
                    marginBottom: '0.75rem',
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
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
                <h3 style={{ marginBottom: '0.75rem', fontSize: '1.1rem', fontWeight: 600 }}>
                    Encuestas asociadas
                </h3>
                {loadingSurveys && <p>Cargando encuestas...</p>}
                {errorSurveys && <p style={{ color: 'red' }}>{errorSurveys}</p>}
                {!loadingSurveys && !errorSurveys && surveys.length === 0 && (
                    <p style={{ color: '#666' }}>No hay encuestas asociadas a este evento</p>
                )}
                {!loadingSurveys && !errorSurveys && surveys.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {surveys.map((survey) => (
                            <div key={survey.id} style={{ cursor: 'pointer' }}>
                                <div onClick={() => handleSurveyClick(survey.id)}>
                                    <SurveyDetailCard 
                                        survey={survey}
                                        compact={true}
                                    />
                                </div>
                                {expandedSurveyId === survey.id && (
                                    <div style={{ marginTop: '0.75rem', marginLeft: '1rem' }}>
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
            </div>

            {/* Sección de Partituras - Placeholder */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
                <h3 style={{ marginBottom: '0.75rem', fontSize: '1.1rem', fontWeight: 600 }}>
                    Partituras asociadas
                </h3>
                <p style={{ color: '#666', fontStyle: 'italic' }}>
                    Las partituras se mostrarán aquí cuando el microservicio esté disponible
                </p>
            </div>
        </div>
    )
}
