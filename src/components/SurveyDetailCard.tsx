import { useEffect, useState } from 'react'
import type { SurveyDTO } from '../types/surveys'
import type { EventDTO } from '../types/events'
import type { UserDTO } from '../types/users'
import {
  translateSurveyStatus,
  translateResponseType,
  translateSurveyType,
  formatSurveyDateTime,
} from '../utils/surveyTranslations'
import { getEventById } from '../api/eventsApi'
import { getUserByIamId, getUserById } from '../api/usersApi'
import { useAuth } from '../features/auth/AuthContext'
import '../styles/common.css'

interface SurveyDetailCardProps {
  survey: SurveyDTO
  onBack?: () => void
  onEdit?: (survey: SurveyDTO) => void
  onOpen?: (survey: SurveyDTO) => void
  onClose?: (survey: SurveyDTO) => void
  onCancel?: (survey: SurveyDTO) => void
  onViewResults?: (survey: SurveyDTO) => void
  showButtons?: boolean
  backButtonLabel?: string
}

export function SurveyDetailCard({
  survey,
  onBack,
  onEdit,
  onOpen,
  onClose,
  onCancel,
  onViewResults,
  showButtons = true,
  backButtonLabel = 'Volver a la lista',
}: SurveyDetailCardProps) {
  const { token } = useAuth()
  const [event, setEvent] = useState<EventDTO | null>(null)
  const [creator, setCreator] = useState<UserDTO | null>(null)
  const [loadingEvent, setLoadingEvent] = useState(false)
  const [loadingCreator, setLoadingCreator] = useState(false)

  useEffect(() => {
    if (!token || !survey.eventId) return

    const loadEvent = async () => {
      try {
        setLoadingEvent(true)
        const eventData = await getEventById(survey.eventId, token)
        setEvent(eventData)
      } catch (e) {
        console.error('Error loading event:', e)
        setEvent(null)
      } finally {
        setLoadingEvent(false)
      }
    }
    loadEvent()
  }, [survey.eventId, token])

  useEffect(() => {
    if (!token || !survey.createdBy) return

    const loadCreator = async () => {
      try {
        setLoadingCreator(true)
        const userData = await getUserByIamId(survey.createdBy as string, token)
        setCreator(userData)
      } catch (e) {
        console.error('Error loading creator:', e)
        setCreator(null)
      } finally {
        setLoadingCreator(false)
      }
    }
    loadCreator()
  }, [survey.createdBy, token])
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
          Detalle de la encuesta
        </div>
        {showButtons && onBack && (
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

      {/* Línea 1: Título, Evento (2 columnas) */}
      <div
        className="detail-grid"
        style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '0.75rem' }}
      >
        <div className="detail-item">
          <span className="detail-label">Título</span>
          <span className="detail-value">{survey.title}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Evento</span>
          <span className="detail-value">
            {loadingEvent ? 'Cargando...' : event ? event.title : survey.eventId}
          </span>
        </div>
      </div>

      {/* Línea 2: Estado, Tipo de respuesta, Tipo de encuesta (3 columnas) */}
      <div
        className="detail-grid"
        style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '0.75rem' }}
      >
        <div className="detail-item">
          <span className="detail-label">Estado</span>
          <span className="detail-value">{translateSurveyStatus(survey.status)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Tipo de respuesta</span>
          <span className="detail-value">
            {translateResponseType(survey.responseType)}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Tipo de encuesta</span>
          <span className="detail-value">
            {translateSurveyType(survey.surveyType)}
          </span>
        </div>
      </div>

      {/* Línea 3: Fecha apertura, Fecha cierre (2 columnas) */}
      <div
        className="detail-grid"
        style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '0.75rem' }}
      >
        <div className="detail-item">
          <span className="detail-label">Fecha apertura</span>
          <span className="detail-value">
            {formatSurveyDateTime(survey.opensAt)}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Fecha cierre</span>
          <span className="detail-value">
            {formatSurveyDateTime(survey.closesAt)}
          </span>
        </div>
      </div>

      {/* Línea 4: Descripción (ancho completo) */}
      <div className="detail-grid" style={{ marginBottom: '0.75rem' }}>
        <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
          <span className="detail-label">Descripción</span>
          <span className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>
            {survey.description || '-'}
          </span>
        </div>
      </div>

      {/* Línea 5: Creado por, Fecha creación, Fecha actualización (3 columnas) */}
      {(survey.createdBy || survey.createdAt || survey.updatedAt) && (
        <div className="detail-grid">
          {survey.createdBy && (
            <div className="detail-item">
              <span className="detail-label">Creado por</span>
              <span className="detail-value">
                {loadingCreator ? 'Cargando...' : creator ? creator.username : "-"}
              </span>
            </div>
          )}
          {survey.createdAt && (
            <div className="detail-item">
              <span className="detail-label">Fecha creación</span>
              <span className="detail-value">
                {formatSurveyDateTime(survey.createdAt)}
              </span>
            </div>
          )}
          {survey.updatedAt && (
            <div className="detail-item">
              <span className="detail-label">Última actualización</span>
              <span className="detail-value">
                {formatSurveyDateTime(survey.updatedAt)}
              </span>
            </div>
          )}
        </div>
      )}

      {showButtons && (
        <div className="button-row-1rem">
          {onEdit && (
            <button
              type="button"
              className="button-secondary"
              onClick={() => onEdit(survey)}
            >
              Editar
            </button>
          )}
          {onViewResults && (
            <button
              type="button"
              className="button-primary"
              onClick={() => onViewResults(survey)}
            >
              Ver resultados
            </button>
          )}
          {onOpen && (survey.status === 'DRAFT' || survey.status === 'CLOSED' || survey.status === 'CANCELLED') && (
            <button
              type="button"
              className="button-primary"
              onClick={() => onOpen(survey)}
            >
              Abrir encuesta
            </button>
          )}
          {onClose && survey.status === 'OPEN' && (
            <button
              type="button"
              className="button-secondary"
              onClick={() => onClose(survey)}
            >
              Cerrar encuesta
            </button>
          )}
          {onCancel && (survey.status === 'DRAFT' || survey.status === 'OPEN') && (
            <button
              type="button"
              className="button-danger"
              onClick={() => onCancel(survey)}
            >
              Cancelar encuesta
            </button>
          )}
        </div>
      )}
    </div>
  )
}
