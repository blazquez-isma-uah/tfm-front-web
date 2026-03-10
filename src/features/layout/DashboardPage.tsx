import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { getUpcomingEvents } from '../../api/eventsApi'
import { getMyNotAnsweredSurveys, getMyAnsweredSurveys } from '../../api/surveysApi'
import type { CalendarEventItemDTO } from '../../types/events'
import type { SurveyDTO } from '../../types/surveys'
import { formatDateTime } from '../../utils/date'
import { translateEventType, translateEventStatus } from '../../utils/eventTranslations'
import { translateSurveyType, formatSurveyDateTime } from '../../utils/surveyTranslations'
import { ErrorState } from '../../components/ErrorState'
import { Spinner } from '../../components/Spinner'
import '../../styles/common.css'

/**
 * DashboardPage — Página de inicio tras el login.
 *
 * Muestra dos secciones independientes:
 * 1. Próximos eventos: lista los próximos 5 eventos dentro de 120 días.
 * 2. Encuestas pendientes: lista las encuestas abiertas que el usuario no ha respondido.
 *
 * Cada sección tiene su propio estado de carga y error, de modo que un fallo
 * en una no afecta a la otra. Esto mejora la experiencia porque el usuario
 * puede ver los eventos aunque fallen las encuestas, o viceversa.
 *
 * Los errores de carga usan <ErrorState> con botón de reintento, porque
 * son errores persistentes (los datos no están disponibles) y el usuario
 * necesita saberlo y poder reintentar la carga.
 */
function DashboardPage() {
  const { token } = useAuth()

  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEventItemDTO[]>([])
  const [loadingEvents, setLoadingEvents]   = useState(true)
  const [errorEvents, setErrorEvents]       = useState<string | null>(null)
  const [confirmedEventIds, setConfirmedEventIds] = useState<Set<string>>(new Set())

  const [pendingSurveys, setPendingSurveys] = useState<SurveyDTO[]>([])
  const [loadingSurveys, setLoadingSurveys] = useState(true)
  const [errorSurveys, setErrorSurveys]     = useState<string | null>(null)

  // ── Fetch de eventos próximos ───────────────────────────────────────────────
  // useCallback memoiza la función para evitar crear una nueva referencia en cada
  // render. Esto es importante porque fetchUpcomingEvents se pasa como onRetry
  // a ErrorState, y sin memoización causaría bucles de re-ejecución.
  const fetchUpcomingEvents = useCallback(async () => {
    if (!token) return
    try {
      setLoadingEvents(true)
      setErrorEvents(null)
      // Obtiene los próximos 5 eventos dentro de 120 días
      const events = await getUpcomingEvents(5, 120, token)
      setUpcomingEvents(events)

      // Obtiene los IDs de eventos donde el usuario ha respondido la encuesta de asistencia.
      // Esto permite resaltar visualmente los eventos confirmados en la UI.
      try {
        const answeredResponse = await getMyAnsweredSurveys(
          { surveyType: 'ATTENDANCE', page: 0, size: 50, sort: ['opensAt,desc'] },
          token
        )
        // Extrae los eventIds de las encuestas respondidas y los guarda en un Set
        const ids = new Set(
          answeredResponse.content
            .map(s => s.eventId)
            .filter((id): id is string => Boolean(id))
        )
        setConfirmedEventIds(ids)
      } catch {
        // Si falla la carga de encuestas respondidas, simplemente no mostramos
        // diferenciación visual. No es un error crítico que impida mostrar los eventos.
        setConfirmedEventIds(new Set())
      }
    } catch (err) {
      console.error('Error fetching upcoming events:', err)
      setErrorEvents('No se pudieron cargar los próximos eventos')
    } finally {
      setLoadingEvents(false)
    }
  }, [token])

  // ── Fetch de encuestas pendientes ───────────────────────────────────────────
  const fetchPendingSurveys = useCallback(async () => {
    if (!token) return
    try {
      setLoadingSurveys(true)
      setErrorSurveys(null)
      const now = new Date().toISOString()
      // Obtiene las encuestas que cumplen:
      // - status: 'OPEN' (encuestas activas)
      // - opensTo: now (ya están abiertas)
      // - closesFrom: now (aún no han cerrado)
      // - sort: ['closesAt,asc'] (ordena por fecha de cierre ascendente,
      //   para mostrar primero las que cierran antes)
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

        {loadingEvents && <Spinner />}

        {errorEvents && (
          <ErrorState message={errorEvents} onRetry={fetchUpcomingEvents} />
        )}

        {!loadingEvents && !errorEvents && upcomingEvents.length === 0 && (
          <p className="dashboard-empty">No hay eventos próximos programados</p>
        )}

        {!loadingEvents && !errorEvents && upcomingEvents.length > 0 && (
          <div className="dashboard-grid">
            {upcomingEvents.map((event) => (
              <article
                key={event.id}
                className={`dashboard-card${confirmedEventIds.has(event.id) ? ' dashboard-card--success' : ''}`}
              >
                <h3 className="dashboard-card__title">{event.title}</h3>
                <dl className="dashboard-card__body">
                  <div className="dashboard-card__pair">
                    <dt className="dashboard-card__term">Fecha</dt>
                    <dd className="dashboard-card__value">{formatDateTime(event.start)}</dd>
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

        {loadingSurveys && <Spinner />}

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