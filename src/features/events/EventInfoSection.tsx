import type { EventDTO } from '../../types/events'
import {
    translateEventType,
    translateEventStatus,
    translateEventVisibility,
    formatEventDateTime,
} from '../../utils/eventTranslations'
import '../../styles/common.css'

interface EventInfoSectionProps {
    event: EventDTO
}

function EventStatusBadge({ status }: { status: string }) {
    let badgeClass = 'badge badge--neutral'
    
    if (status === 'SCHEDULED') {
        badgeClass = 'badge badge--info'
    } else if (status === 'POSTPONED') {
        badgeClass = 'badge badge--warning'
    } else if (status === 'CANCELED') {
        badgeClass = 'badge badge--error'
    }
    
    return <span className={badgeClass}>{translateEventStatus(status)}</span>
}

/**
 * Componente compartido que muestra la información básica de un evento.
 * Usado tanto en EventDetailCard (admin) como en EventDetailCardComplete (general).
 */
export function EventInfoSection({ event }: EventInfoSectionProps) {
    return (
        <>
            <h2 className="detail-title">{event.title}</h2>

            {/* Primera sección sin título */}
            <div className="detail-section">
                <div className="detail-grid">
                    <div className="detail-field">
                        <span className="detail-field__label">Tipo</span>
                        <span className="detail-field__value">{translateEventType(event.type)}</span>
                    </div>
                    <div className="detail-field">
                        <span className="detail-field__label">Estado</span>
                        <span className="detail-field__value">
                            <EventStatusBadge status={event.status} />
                        </span>
                    </div>
                    <div className="detail-field">
                        <span className="detail-field__label">Visibilidad</span>
                        <span className="detail-field__value">{translateEventVisibility(event.visibility)}</span>
                    </div>
                </div>
            </div>

            {/* Sección: Fechas */}
            <div className="detail-section">
                <div className="detail-grid">
                    <div className="detail-field">
                        <span className="detail-field__label">Fecha inicio</span>
                        <span className="detail-field__value">{formatEventDateTime(event.startAt)}</span>
                    </div>
                    <div className="detail-field">
                        <span className="detail-field__label">Fecha fin</span>
                        <span className="detail-field__value">{formatEventDateTime(event.endAt)}</span>
                    </div>
                </div>
            </div>

            {/* Sección: Lugar */}
            <div className="detail-section">
                <div className="detail-grid">
                    <div className="detail-field detail-field--full">
                        <span className="detail-field__label">Lugar</span>
                        <span className="detail-field__value">
                            {event.location || <span className="detail-field__value--empty">-</span>}
                        </span>
                    </div>
                </div>
            </div>

            {/* Sección: Descripción */}
            <div className="detail-section">
                <div className="detail-grid">
                    <div className="detail-field detail-field--full">
                        <span className="detail-field__label">Descripción</span>
                        <span className="detail-field__value" style={{ whiteSpace: 'pre-wrap' }}>
                            {event.description || <span className="detail-field__value--empty">-</span>}
                        </span>
                    </div>
                </div>
            </div>
        </>
    )
}
