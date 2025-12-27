import type { EventDTO } from '../types/events'
import {
    translateEventType,
    translateEventStatus,
    translateEventVisibility,
    formatEventDateTime,
} from '../utils/eventTranslations'
import '../styles/common.css'

interface EventInfoSectionProps {
    event: EventDTO
}

/**
 * Componente compartido que muestra la información básica de un evento.
 * Usado tanto en EventDetailCard (admin) como en EventDetailCardComplete (general).
 */
export function EventInfoSection({ event }: EventInfoSectionProps) {
    return (
        <>
            {/* Línea 1: Título, Localización (2 columnas) */}
            <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '0.75rem' }}>
                <div className="detail-item">
                    <span className="detail-label">Título</span>
                    <span className="detail-value">{event.title}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">Localización</span>
                    <span className="detail-value">{event.location || '-'}</span>
                </div>
            </div>

            {/* Línea 2: Tipo, Estado, Visibilidad (3 columnas) */}
            <div className="detail-grid" style={{ marginBottom: '0.75rem' }}>
                <div className="detail-item">
                    <span className="detail-label">Tipo</span>
                    <span className="detail-value">{translateEventType(event.type)}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">Estado</span>
                    <span className="detail-value">{translateEventStatus(event.status)}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">Visibilidad</span>
                    <span className="detail-value">
                        {translateEventVisibility(event.visibility)}
                    </span>
                </div>
            </div>

            {/* Línea 3: Fecha inicio, Fecha fin (2 columnas) */}
            <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '0.75rem' }}>
                <div className="detail-item">
                    <span className="detail-label">Fecha inicio</span>
                    <span className="detail-value">
                        {formatEventDateTime(event.startAt)}
                    </span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">Fecha fin</span>
                    <span className="detail-value">
                        {formatEventDateTime(event.endAt)}
                    </span>
                </div>
            </div>

            {/* Línea 4: Descripción (ancho completo) */}
            <div className="detail-grid">
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                    <span className="detail-label">Descripción</span>
                    <span className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>
                        {event.description || '-'}
                    </span>
                </div>
            </div>
        </>
    )
}
