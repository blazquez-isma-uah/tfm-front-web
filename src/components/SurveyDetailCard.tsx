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
import { getUserByIamId } from '../api/usersApi'
import { useAuth } from '../features/auth/AuthContext'
import { SurveyResponseForm } from './SurveyResponseForm'
import { XMarkIcon } from './Icons'
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
  compact?: boolean // Modo compacto para mostrar dentro de otros componentes
  showResponseForm?: boolean // Mostrar formulario para responder encuesta
  onResponseSubmitted?: () => void // Callback cuando se envía una respuesta
}

// ─── Badge helpers ────────────────────────────────────────────────────────────
function surveyStatusBadgeStyle(status: string): React.CSSProperties {
  if (status === 'OPEN') {
    return {
      background: 'var(--color-success-light)',
      color: 'var(--color-success-dark)',
      padding: '2px 8px',
      borderRadius: 'var(--radius-full)',
      fontSize: 'var(--font-size-xs)',
      fontWeight: 'var(--font-weight-medium)',
    }
  }
  if (status === 'DRAFT') {
    return {
      background: 'var(--color-info-light)',
      color: 'var(--color-info-dark)',
      padding: '2px 8px',
      borderRadius: 'var(--radius-full)',
      fontSize: 'var(--font-size-xs)',
      fontWeight: 'var(--font-weight-medium)',
    }
  }
  return {
    background: 'var(--color-gray-100)',
    color: 'var(--color-gray-600)',
    padding: '2px 8px',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-medium)',
  }
}

const mutedValue: React.CSSProperties = { color: 'var(--text-muted)' }
// ─────────────────────────────────────────────────────────────────────────────

export function SurveyDetailCard({
  survey,
  onBack,
  showButtons = true,
  backButtonLabel = 'Volver a la lista',
  compact = false,
  showResponseForm = false,
  onResponseSubmitted,
}: SurveyDetailCardProps) {
  const { token, hasRole } = useAuth()
  const [event, setEvent] = useState<EventDTO | null>(null)
  const [creator, setCreator] = useState<UserDTO | null>(null)
  const [loadingEvent, setLoadingEvent] = useState(false)
  const [loadingCreator, setLoadingCreator] = useState(false)
  
  const isMusician = hasRole('MUSICIAN')

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
  
  // Modo compacto: versión simplificada sin cargar evento/creador
  if (compact) {
    return (
      <div 
        style={{ 
          padding: '0.75rem', 
          border: '1px solid #e0e0e0', 
          borderRadius: '6px',
          backgroundColor: '#fafafa'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <strong style={{ fontSize: '0.95rem' }}>{survey.title}</strong>
          <span style={surveyStatusBadgeStyle(survey.status)}>
            {translateSurveyStatus(survey.status)}
          </span>
        </div>
        <div style={{ fontSize: '0.9rem', color: '#666', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {survey.description && (
            <div style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>{survey.description}</div>
          )}
          <div><strong>Tipo:</strong> {translateSurveyType(survey.surveyType)}</div>
          <div><strong>Abre:</strong> {formatSurveyDateTime(survey.opensAt)}</div>
          <div><strong>Cierra:</strong> {formatSurveyDateTime(survey.closesAt)}</div>
        </div>
      </div>
    )
  }
  
  // Modo completo: versión detallada rediseñada
  return (
    <div className="card" style={{ marginTop: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <div className="section-title" style={{ marginBottom: 0 }}>
          Detalle de la encuesta
        </div>
        {showButtons && onBack && (
          <button
            type="button"
            className="button-subtle"
            onClick={onBack}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}
          >
            <span style={{ width: '0.9rem', height: '0.9rem', display: 'inline-flex', flexShrink: 0 }}><XMarkIcon /></span>
            {backButtonLabel}
          </button>
        )}
      </div>

      <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', margin: '0 0 var(--space-3) 0', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
        {survey.title}
      </h2>
      <dl className="dashboard-card__body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-2) var(--space-4)', marginBottom: 0 }}>
        <div className="dashboard-card__pair">
          <dt className="dashboard-card__term">Tipo de encuesta</dt>
          <dd className="dashboard-card__value">{translateSurveyType(survey.surveyType)}</dd>
        </div>
        <div className="dashboard-card__pair">
          <dt className="dashboard-card__term">Estado</dt>
          <dd className="dashboard-card__value">
            <span style={surveyStatusBadgeStyle(survey.status)}>
              {translateSurveyStatus(survey.status)}
            </span>
          </dd>
        </div>
        <div className="dashboard-card__pair" style={{ gridColumn: '1 / -1' }}>
          <dt className="dashboard-card__term">Tipo de respuesta</dt>
          <dd className="dashboard-card__value">{translateResponseType(survey.responseType)}</dd>
        </div>
      </dl>

      {/* Grupo: Evento */}
      <div className="detail-section-divider">Evento</div>
      <dl className="dashboard-card__body" style={{ marginBottom: 0 }}>
        <div className="dashboard-card__pair" style={{ gridTemplateColumns: '1fr' }}>
          <dd className="dashboard-card__value">
            {loadingEvent
              ? 'Cargando...'
              : event
              ? event.title
              : <span style={mutedValue}>Sin evento asociado</span>}
          </dd>
        </div>
      </dl>

      {/* Grupo: Fechas */}
      <div className="detail-section-divider">Fechas</div>
      <dl className="dashboard-card__body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-2) var(--space-4)', marginBottom: 0 }}>
        <div className="dashboard-card__pair">
          <dt className="dashboard-card__term">Fecha apertura</dt>
          <dd className="dashboard-card__value">{formatSurveyDateTime(survey.opensAt)}</dd>
        </div>
        <div className="dashboard-card__pair">
          <dt className="dashboard-card__term">Fecha cierre</dt>
          <dd className="dashboard-card__value">{formatSurveyDateTime(survey.closesAt)}</dd>
        </div>
      </dl>

      {/* Grupo: Autoría */}
      {(survey.createdBy || survey.createdAt || survey.updatedAt) && (
        <>
          <div className="detail-section-divider">Autoría</div>
          <dl className="dashboard-card__body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-2) var(--space-4)', marginBottom: 0 }}>
            {survey.createdAt && (
              <div className="dashboard-card__pair">
                <dt className="dashboard-card__term">Fecha creación</dt>
                <dd className="dashboard-card__value">{formatSurveyDateTime(survey.createdAt)}</dd>
              </div>
            )}
            {survey.updatedAt && (
              <div className="dashboard-card__pair">
                <dt className="dashboard-card__term">Última actualización</dt>
                <dd className="dashboard-card__value">{formatSurveyDateTime(survey.updatedAt)}</dd>
              </div>
            )}
            {survey.createdBy && (
              <div className="dashboard-card__pair">
                <dt className="dashboard-card__term">Creado por</dt>
                <dd className="dashboard-card__value">
                  {loadingCreator ? 'Cargando...' : creator ? creator.username : <span style={mutedValue}>-</span>}
                </dd>
              </div>
            )}
          </dl>
        </>
      )}

      {/* Grupo: Descripción */}
      <div className="detail-section-divider">Descripción</div>
      <dl className="dashboard-card__body" style={{ marginBottom: 0 }}>
        <div className="dashboard-card__pair" style={{ gridTemplateColumns: '1fr' }}>
          <dd className="dashboard-card__value" style={{ whiteSpace: 'pre-wrap', ...(survey.description ? {} : mutedValue) }}>
            {survey.description || '-'}
          </dd>
        </div>
      </dl>

      {/* Formulario para responder encuesta (usuarios con rol MUSICIAN) */}
      {showResponseForm && isMusician && (
        <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '2px solid var(--border-light)' }}>
          <SurveyResponseForm
            survey={survey}
            onResponseSubmitted={onResponseSubmitted}
          />
        </div>
      )}
    </div>
  )
}
