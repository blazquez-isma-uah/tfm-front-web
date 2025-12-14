import type { EventDTO } from '../types/events'
import {
    translateEventType,
    translateEventStatus,
    translateEventVisibility,
    formatEventDateTime,
} from '../utils/eventTranslations'
import '../styles/common.css'

interface EventDetailCardProps {
    event: EventDTO
    onBack?: () => void
    onEdit?: (event: EventDTO) => void
    showButtons?: boolean
    backButtonLabel?: string
}

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
                    marginBottom: '0.75rem',
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

            {showButtons && onEdit && (
                <div className="button-row-1rem">
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
