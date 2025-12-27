import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { getUpcomingEvents } from '../../api/eventsApi'
import { getMyNotAnsweredSurveys } from '../../api/surveysApi'
import type { CalendarEventItemDTO } from '../../types/events'
import type { SurveyDTO } from '../../types/surveys'
import { formatDateTime } from '../../utils/date'
import { translateEventType, translateEventStatus } from '../../utils/eventTranslations'
import { translateSurveyStatus, translateSurveyType, formatSurveyDateTime } from '../../utils/surveyTranslations'

function DashboardPage() {
    const { token } = useAuth()
    const [upcomingEvents, setUpcomingEvents] = useState<CalendarEventItemDTO[]>([])
    const [pendingSurveys, setPendingSurveys] = useState<SurveyDTO[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [loadingSurveys, setLoadingSurveys] = useState(true)
    const [errorSurveys, setErrorSurveys] = useState<string | null>(null)

    useEffect(() => {
        const fetchUpcomingEvents = async () => {
            try {
                setLoading(true)
                setError(null)
                const events = await getUpcomingEvents(5, 120, token)
                setUpcomingEvents(events)
            } catch (err) {
                console.error('Error fetching upcoming events:', err)
                setError('No se pudieron cargar los próximos eventos')
            } finally {
                setLoading(false)
            }
        }

        fetchUpcomingEvents()
    }, [token])

    useEffect(() => {
        const fetchPendingSurveys = async () => {
            if (!token) return
            
            try {
                setLoadingSurveys(true)
                setErrorSurveys(null)
                const now = new Date().toISOString()
                const response = await getMyNotAnsweredSurveys(
                    {
                        status: 'OPEN',
                        opensTo: now, // Ya abierta
                        closesFrom: now, // Todavía no cerrada
                        page: 0,
                        size: 10,
                        sort: ['closesAt,asc'],
                    },
                    token
                )
                setPendingSurveys(response.content)
            } catch (err) {
                console.error('Error fetching pending surveys:', err)
                setErrorSurveys('No se pudieron cargar las encuestas pendientes')
            } finally {
                setLoadingSurveys(false)
            }
        }

        fetchPendingSurveys()
    }, [token])

    return (
        <div>
            <h1>Dashboard</h1>
            
            {/* Sección de Próximos Eventos */}
            <section style={{ marginTop: '2rem' }}>
                <h2>Próximos Eventos</h2>
                {loading && <p>Cargando eventos...</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {!loading && !error && upcomingEvents.length === 0 && (
                    <p>No hay eventos próximos programados</p>
                )}
                {!loading && !error && upcomingEvents.length > 0 && (
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                        gap: '1rem' 
                    }}>
                        {upcomingEvents.map((event) => (
                            <div
                                key={event.id}
                                style={{
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    backgroundColor: '#f9f9f9',
                                }}
                            >
                                <h3 style={{ margin: '0 0 0.5rem 0' }}>{event.title}</h3>
                                <p style={{ margin: '0.25rem 0' }}>
                                    <strong>Fecha:</strong> {formatDateTime(event.startAt)}
                                </p>
                                {event.location && (
                                    <p style={{ margin: '0.25rem 0' }}>
                                        <strong>Lugar:</strong> {event.location}
                                    </p>
                                )}
                                <p style={{ margin: '0.25rem 0' }}>
                                    <strong>Tipo:</strong> {translateEventType(event.type)}
                                </p>
                                <p style={{ margin: '0.25rem 0' }}>
                                    <strong>Estado:</strong> {translateEventStatus(event.status)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Sección de Encuestas Pendientes */}
            <section style={{ marginTop: '2rem' }}>
                <h2>Encuestas Pendientes</h2>
                {loadingSurveys && <p>Cargando encuestas...</p>}
                {errorSurveys && <p style={{ color: 'red' }}>{errorSurveys}</p>}
                {!loadingSurveys && !errorSurveys && pendingSurveys.length === 0 && (
                    <p style={{ color: '#666' }}>No tienes encuestas pendientes por responder</p>
                )}
                {!loadingSurveys && !errorSurveys && pendingSurveys.length > 0 && (
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                        gap: '1rem' 
                    }}>
                        {pendingSurveys.map((survey) => (
                            <div
                                key={survey.id}
                                style={{
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    backgroundColor: '#fff8e1',
                                }}
                            >
                                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>{survey.title}</h3>
                                <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                                    <strong>Tipo:</strong> {translateSurveyType(survey.surveyType)}
                                </p>
                                <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                                    <strong>Cierra:</strong> {formatSurveyDateTime(survey.closesAt)}
                                </p>
                                {survey.description && (
                                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', fontStyle: 'italic', color: '#666' }}>
                                        {survey.description}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}

export default DashboardPage
