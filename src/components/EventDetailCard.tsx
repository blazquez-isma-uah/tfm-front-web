import { useNavigate } from 'react-router-dom'
import type { EventDTO } from '../types/events'
import { EventInfoSection } from './EventInfoSection'
import { XMarkIcon } from './Icons'
import '../styles/common.css'

interface EventDetailCardProps {
    event: EventDTO
    onBack?: () => void
    onEdit?: (event: EventDTO) => void
    showButtons?: boolean
    backButtonLabel?: string
}

/**
 * Componente para mostrar el detalle de un evento (solo información básica).
 * Usado principalmente en la zona de administración.
 */
export function EventDetailCard({
    event,
    onBack,
    onEdit,
    showButtons = true,
}: EventDetailCardProps) {
    const navigate = useNavigate()

    const handleCreateSurvey = () => {
        navigate('/admin/surveys', {
            state: {
                action: 'CREATE',
                preselectedEventId: event.id,
                preselectedEventTitle: event.title,
            }
        })
    }

    const handleViewSurveys = () => {
        navigate('/admin/surveys', {
            state: {
                filterEventId: event.id,
                filterEventTitle: event.title,
            }
        })
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
                {showButtons && onBack && (
                    <button type="button" className="button-secondary" onClick={onBack}>
                        <XMarkIcon/> Ocultar
                    </button>
                )}
            </div>

            <EventInfoSection event={event} />

            {showButtons && (
                <div className="button-row-1rem" style={{ marginTop: 'var(--space-5)' }}>
                    <button type="button" className="button-secondary" onClick={handleViewSurveys}>
                        Ver encuestas
                    </button>
                    <button type="button" className="button-secondary" onClick={handleCreateSurvey}>
                        Nueva encuesta
                    </button>
                    {onEdit && (
                        <button
                            type="button"
                            className="button-secondary"
                            onClick={() => onEdit(event)}
                        >
                            Editar
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
