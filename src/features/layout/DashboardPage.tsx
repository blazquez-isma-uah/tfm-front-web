import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { getUpcomingEvents } from '../../api/eventsApi'
import { getMyNotAnsweredSurveys } from '../../api/surveysApi'
import type { CalendarEventItemDTO } from '../../types/events'
import type { SurveyDTO } from '../../types/surveys'
import { formatDateTime } from '../../utils/date'
import { translateEventType, translateEventStatus } from '../../utils/eventTranslations'
import { translateSurveyType, formatSurveyDateTime } from '../../utils/surveyTranslations'
import { ErrorState } from '../../components/ErrorState'

/**
 * DashboardPage — Página de inicio tras el login.
 *
 * Muestra dos secciones independientes con sus propios estados de carga
 * y error, de modo que un fallo en una no afecta a la otra.
 *
 * Los errores de carga usan <ErrorState> con botón de reintento, porque
 * son errores persistentes (los datos no están disponibles) y el usuario
 * necesita saberlo mientras dure la situación.
 *
 * Los textos de carga ("Cargando...") son temporales — se sustituirán
 * por skeletons en P12.
 */
function DashboardPage() {
  const { token } = useAuth()

  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEventItemDTO[]>([])
  const [loadingEvents, setLoadingEvents]   = useState(true)
  const [errorEvents, setErrorEvents]       = useState<string | null>(null)

  const [pendingSurveys, setPendingSurveys] = useState<SurveyDTO[]>([])
  const [loadingSurveys, setLoadingSurveys] = useState(true)
  const [errorSurveys, setErrorSurveys]     = useState<string | null>(null)

  // ── Fetch de eventos ────────────────────────────────────────────────────────
  // useCallback permite pasarlo como onRetry a ErrorState sin crear una
  // nueva referencia en cada render (evita bucles de re-ejecución).
  const fetchUpcomingEvents = useCallback(async () => {
    try {
      setLoadingEvents(true)
      setErrorEvents(null)
      const events = await getUpcomingEvents(5, 120, token)
      setUpcomingEvents(events)
    } catch (err) {
      console.error('Error fetching upcoming events:', err)
      setErrorEvents('No se pudieron cargar los próximos eventos')
    } finally {
      setLoadingEvents(false)
    }
  }, [token])

  // ── Fetch de encuestas ──────────────────────────────────────────────────────
  const fetchPendingSurveys = useCallback(async () => {
    if (!token) return
    try {
      setLoadingSurveys(true)
      setErrorSurveys(null)
      const now = new Date().toISOString()
      const response = await getMyNotAnsweredSurveys(
        {
          status: 'OPEN',
          opensTo: now,
          closesFrom: now,
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
  }, [token])

  useEffect(() => { fetchUpcomingEvents() }, [fetchUpcomingEvents])
  useEffect(() => { fetchPendingSurveys() }, [fetchPendingSurveys])

  return (
    <div className="page-container">
      <h1 className="page-title">Dashboard</h1>

      {/* ── Próximos eventos ─────────────────────────────────────────────── */}
      <section className="dashboard-section">
        <h2 className="section-title">Próximos eventos</h2>

        {loadingEvents && <p>Cargando eventos...</p>}

        {errorEvents && (
          <ErrorState message={errorEvents} onRetry={fetchUpcomingEvents} />
        )}

        {!loadingEvents && !errorEvents && upcomingEvents.length === 0 && (
          <p className="dashboard-empty">No hay eventos próximos programados</p>
        )}

        {!loadingEvents && !errorEvents && upcomingEvents.length > 0 && (
          <div className="dashboard-grid">
            {upcomingEvents.map((event) => (
              <article key={event.id} className="dashboard-card">
                <h3 className="dashboard-card__title">{event.title}</h3>
                <dl className="dashboard-card__body">
                  <div className="dashboard-card__pair">
                    <dt className="dashboard-card__term">Fecha</dt>
                    <dd className="dashboard-card__value">{formatDateTime(event.startAt)}</dd>
                  </div>
                  {event.location && (
                    <div className="dashboard-card__pair">
                      <dt className="dashboard-card__term">Lugar</dt>
                      <dd className="dashboard-card__value">{event.location}</dd>
                    </div>
                  )}
                  <div className="dashboard-card__pair">
                    <dt className="dashboard-card__term">Tipo</dt>
                    <dd className="dashboard-card__value">{translateEventType(event.type)}</dd>
                  </div>
                  <div className="dashboard-card__pair">
                    <dt className="dashboard-card__term">Estado</dt>
                    <dd className="dashboard-card__value">{translateEventStatus(event.status)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ── Encuestas pendientes ─────────────────────────────────────────── */}
      <section className="dashboard-section">
        <h2 className="section-title">Encuestas pendientes</h2>

        {loadingSurveys && <p>Cargando encuestas...</p>}

        {errorSurveys && (
          <ErrorState message={errorSurveys} onRetry={fetchPendingSurveys} />
        )}

        {!loadingSurveys && !errorSurveys && pendingSurveys.length === 0 && (
          <p className="dashboard-empty">No tienes encuestas pendientes por responder</p>
        )}

        {!loadingSurveys && !errorSurveys && pendingSurveys.length > 0 && (
          <div className="dashboard-grid">
            {pendingSurveys.map((survey) => (
              <article key={survey.id} className="dashboard-card dashboard-card--warning">
                <h3 className="dashboard-card__title">{survey.title}</h3>
                <dl className="dashboard-card__body">
                  <div className="dashboard-card__pair">
                    <dt className="dashboard-card__term">Tipo</dt>
                    <dd className="dashboard-card__value">{translateSurveyType(survey.surveyType)}</dd>
                  </div>
                  <div className="dashboard-card__pair">
                    <dt className="dashboard-card__term">Cierra</dt>
                    <dd className="dashboard-card__value dashboard-card__value--urgent">
                      {formatSurveyDateTime(survey.closesAt)}
                    </dd>
                  </div>
                  {survey.description && (
                    <div className="dashboard-card__pair">
                      <dt className="dashboard-card__term">Descripción</dt>
                      <dd className="dashboard-card__value dashboard-card__value--muted">
                        {survey.description}
                      </dd>
                    </div>
                  )}
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default DashboardPage