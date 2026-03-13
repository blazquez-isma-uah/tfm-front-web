import { useEffect, useState } from 'react'
import type { SurveyDTO } from '../../types/surveys'
import type { EventDTO } from '../../types/events'
import type { UserDTO } from '../../types/users'
import {
  translateSurveyStatus,
  translateResponseType,
  translateSurveyType,
  formatSurveyDateTime,
} from '../../utils/surveyTranslations'
import { getEventById } from '../../api/eventsApi'
import { getUserByIamId } from '../../api/usersApi'
import { useAuth } from '../auth/AuthContext'
import { SurveyResponseForm } from './SurveyResponseForm'
import { XMarkIcon } from '../../components/Icons'
import '../../styles/common.css'

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
  onHideResponseForm?: () => void // Callback para ocultar el formulario de respuesta
}

// ── Badge helpers ────────────────────────────────────────────────────────────
/**
 * Retorna la clase CSS del badge de estado de la encuesta.
 * Los estilos están definidos en common.css con prefijo .badge-.
 */
function surveyStatusBadgeClass(status: string): string {
  if (status === 'OPEN') {
    return 'badge badge--success'
  }
  if (status === 'DRAFT') {
    return 'badge badge--info'
  }
  if (status === 'CLOSED') {
    return 'badge badge--neutral'
  }
  if (status === 'CANCELLED') {
    return 'badge badge--error'
  }
  return 'badge badge--neutral'
}
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SurveyDetailCard — Tarjeta de detalle de encuesta.
 *
 * RESPONSABILIDAD:
 * Muestra la información completa de una encuesta (título, tipo, estado, fechas,
 * evento vinculado, creador, descripción) y proporciona botones de acción según
 * el contexto (admin o usuario).
 *
 * MODOS DE USO:
 * - Admin: editar, ver resultados, abrir, cerrar, cancelar, eliminar
 * - Musician: responder encuesta si está abierta, ver detalles
 *
 * FLUJO DE RESPUESTA:
 * Si showResponseForm=true, renderiza SurveyResponseForm dentro de esta tarjeta,
 * permitiendo al usuario responder o actualizar su respuesta inline.
 */
export function SurveyDetailCard({
  survey,
  onBack,
  showButtons = true,
  compact = false,
  showResponseForm = false,
  onResponseSubmitted,
  onHideResponseForm,
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
          <span className={surveyStatusBadgeClass(survey.status)}>
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
          <button type="button" className="button-secondary" onClick={onBack}>
            <XMarkIcon /> Ocultar
          </button>
        )}
      </div>

      <h2 className="detail-title">{survey.title}</h2>

      {/* Primera sección sin título */}
      <div className="detail-section">
        <div className="detail-grid">
          <div className="detail-field">
            <span className="detail-field__label">Tipo de encuesta</span>
            <span className="detail-field__value">{translateSurveyType(survey.surveyType)}</span>
          </div>
          <div className="detail-field">
            <span className="detail-field__label">Tipo de respuesta</span>
            <span className="detail-field__value">{translateResponseType(survey.responseType)}</span>
          </div>
          <div className="detail-field">
            <span className="detail-field__label">Estado</span>
            <span className="detail-field__value">
              <span className={surveyStatusBadgeClass(survey.status)}>
                {translateSurveyStatus(survey.status)}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Sección: Evento */}
      <div className="detail-section">
        <div className="detail-grid">
          <div className="detail-field detail-field--full">
            <span className="detail-field__label">Evento</span>
            <span className="detail-field__value">
              {loadingEvent
                ? 'Cargando...'
                : event
                ? event.title
                : <span className="detail-field__value--empty">Sin evento asociado</span>}
            </span>
          </div>
        </div>
      </div>

      {/* Sección: Fechas */}
      <div className="detail-section">
        <div className="detail-grid">
          <div className="detail-field">
            <span className="detail-field__label">Fecha apertura</span>
            <span className="detail-field__value">{formatSurveyDateTime(survey.opensAt)}</span>
          </div>
          <div className="detail-field">
            <span className="detail-field__label">Fecha cierre</span>
            <span className="detail-field__value">{formatSurveyDateTime(survey.closesAt)}</span>
          </div>
        </div>
      </div>

      {/* Sección: Descripción */}
      <div className="detail-section">
        <div className="detail-grid">
          <div className="detail-field detail-field--full">
            <span className="detail-field__label">Descripción</span>
            <span className="detail-field__value" style={{ whiteSpace: 'pre-wrap' }}>
              {survey.description || <span className="detail-field__value--empty">-</span>}
            </span>
          </div>
        </div>
      </div>

      {/* Sección: Autoría */}
      {(survey.createdBy || survey.createdAt || survey.updatedAt) && (
        <div className="detail-section">
          <div className="detail-grid">
            {survey.createdAt && (
              <div className="detail-field">
                <span className="detail-field__label">Fecha creación</span>
                <span className="detail-field__value">{formatSurveyDateTime(survey.createdAt)}</span>
              </div>
            )}
            {survey.updatedAt && (
              <div className="detail-field">
                <span className="detail-field__label">Última actualización</span>
                <span className="detail-field__value">{formatSurveyDateTime(survey.updatedAt)}</span>
              </div>
            )}
            {survey.createdBy && (
              <div className="detail-field">
                <span className="detail-field__label">Creado por</span>
                <span className="detail-field__value">
                  {loadingCreator ? 'Cargando...' : creator ? creator.username : <span className="detail-field__value--empty">-</span>}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Formulario para responder encuesta (usuarios con rol MUSICIAN) */}
      {showResponseForm && isMusician && (
        <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '2px solid var(--border-light)' }}>
          <SurveyResponseForm
            survey={survey}
            onResponseSubmitted={onResponseSubmitted}
            onHide={onHideResponseForm}
          />
        </div>
      )}
    </div>
  )
}
