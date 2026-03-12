import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { EventDTO } from '../../types/events'
import type { SurveyDTO } from '../../types/surveys'
import { EventInfoSection } from './EventInfoSection'
import { searchSurveysPage, getMyResponse } from '../../api/surveysApi'
import { useAuth } from '../auth/AuthContext'
import { translateSurveyStatus } from '../../utils/surveyTranslations'
import { Spinner } from '../../components/Spinner'
import { XMarkIcon } from '../../components/Icons'
import '../../styles/common.css'

interface EventDetailCardCompleteProps {
    event: EventDTO
    onBack?: () => void
    backButtonLabel?: string
}

/**
 * EventDetailCardComplete — Tarjeta completa de evento para usuarios.
 *
 * RESPONSABILIDAD:
 * Muestra la información completa de un evento (datos básicos mediante EventInfoSection)
 * más las encuestas asociadas al evento. Carga dinámicamente las encuestas del evento
 * y comprueba cuáles ya han sido respondidas por el usuario actual.
 *
 * USO:
 * Se renderiza en la fila expandida de MyEventsPage cuando el usuario (MUSICIAN)
 * hace clic en un evento. Diferente de EventDetailCard en que incluye encuestas.
 *
 * DIFERENCIA CON EventDetailCard:
 * - EventDetailCard: solo detalles del evento + botones de admin (editar, crear encuesta)
 * - EventDetailCardComplete: detalles + lista de encuestas del evento
 */
export function EventDetailCardComplete({
    event,
    onBack,
}: EventDetailCardCompleteProps) {
    const { token } = useAuth()
    const navigate = useNavigate()
    const [surveys, setSurveys] = useState<SurveyDTO[]>([])
    const [loadingSurveys, setLoadingSurveys] = useState(false)
    const [errorSurveys, setErrorSurveys] = useState<string | null>(null)
    const [answeredSurveyIds, setAnsweredSurveyIds] = useState<Set<string>>(new Set())

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
                        size: 50,
                    },
                    token
                )
                setSurveys(response.content)
                // Comprobar cuáles encuestas ya ha respondido el usuario
                const responseChecks = await Promise.allSettled(
                    response.content.map(s => getMyResponse(s.id, token))
                )
                const answeredIds = new Set<string>()
                response.content.forEach((s, idx) => {
                    if (responseChecks[idx].status === 'fulfilled') answeredIds.add(s.id)
                })
                setAnsweredSurveyIds(answeredIds)
            } catch (err) {
                console.error('Error loading surveys:', err)
                setErrorSurveys('No se pudieron cargar las encuestas')
            } finally {
                setLoadingSurveys(false)
            }
        }

        loadSurveys()
    }, [event.id, token])

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
                    <button type="button" className="button-secondary" onClick={onBack}>
                        <XMarkIcon /> Ocultar
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {surveys.map((survey) => (
                        <div
                            key={survey.id}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.6rem 0.9rem',
                                border: '1px solid var(--border-light)',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: 'var(--color-surface)',
                                gap: 'var(--space-3)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
                                <span style={{
                                    fontWeight: 'var(--font-weight-medium)',
                                    fontSize: 'var(--font-size-sm)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {survey.title}
                                </span>
                                <span 
                                    className={
                                        survey.status === 'OPEN' ? 'badge badge--success' :
                                        survey.status === 'DRAFT' ? 'badge badge--info' :
                                        survey.status === 'CANCELLED' ? 'badge badge--error' :
                                        'badge badge--neutral'
                                    } 
                                    style={{ flexShrink: 0 }}
                                >
                                    {translateSurveyStatus(survey.status)}
                                </span>
                            </div>
                            <button
                                type="button"
                                className="button-primary"
                                style={{ flexShrink: 0, fontSize: 'var(--font-size-sm)', padding: '0.35rem 0.8rem' }}
                                onClick={() =>
                                    navigate('/surveys', {
                                        state: {
                                            surveyId: survey.id,
                                            tab: answeredSurveyIds.has(survey.id) ? 'ACTIVE' : 'PENDING',
                                        },
                                    })
                                }
                            >
                                {answeredSurveyIds.has(survey.id) ? 'Ver respuesta' : 'Responder'}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Sección de Partituras - Placeholder
            <hr style={{ margin: 'var(--space-5) 0', borderColor: 'var(--border-light)' }} />
            <div className="section-title" style={{ marginBottom: 'var(--space-3)' }}>
                Partituras asociadas
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', fontStyle: 'italic' }}>
                Las partituras se mostrarán aquí cuando el microservicio esté disponible
            </p> */}
        </div>
    )
}
