import type { EventDTO } from '../types/events'
import { EventInfoSection } from './EventInfoSection'
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
    backButtonLabel = 'Volver a la lista',
}: EventDetailCardProps) {

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

            <EventInfoSection event={event} />

            {showButtons && onEdit && (
                <div className="button-row-1rem" style={{ marginTop: 'var(--space-5)' }}>
                    <button
                        type="button"
                        className="button-secondary"
                        onClick={() => onEdit(event)}
                    >
                        Editar
                    </button>
                </div>
            )}
        </div>
    )
}
