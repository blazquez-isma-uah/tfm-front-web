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

const badgeScheduled: React.CSSProperties = {
    background: 'var(--color-info-light)',
    color: 'var(--color-info-dark)',
    padding: '2px 8px',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-medium)',
}

const badgeCanceled: React.CSSProperties = {
    background: 'var(--color-gray-100)',
    color: 'var(--color-gray-600)',
    padding: '2px 8px',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-medium)',
}

const mutedValue: React.CSSProperties = {
    color: 'var(--text-muted)',
}

function EventStatusBadge({ status }: { status: string }) {
    const style = status === 'SCHEDULED' ? badgeScheduled : badgeCanceled
    return <span style={style}>{translateEventStatus(status)}</span>
}

/**
 * Componente compartido que muestra la información básica de un evento.
 * Usado tanto en EventDetailCard (admin) como en EventDetailCardComplete (general).
 */
export function EventInfoSection({ event }: EventInfoSectionProps) {
    return (
        <>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', margin: '0 0 var(--space-3) 0', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                {event.title}
            </h2>
            <dl className="dashboard-card__body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-2) var(--space-4)', marginBottom: 0 }}>
                <div className="dashboard-card__pair">
                    <dt className="dashboard-card__term">Tipo</dt>
                    <dd className="dashboard-card__value">{translateEventType(event.type)}</dd>
                </div>
                <div className="dashboard-card__pair">
                    <dt className="dashboard-card__term">Estado</dt>
                    <dd className="dashboard-card__value">
                        <EventStatusBadge status={event.status} />
                    </dd>
                </div>
                <div className="dashboard-card__pair">
                    <dt className="dashboard-card__term">Visibilidad</dt>
                    <dd className="dashboard-card__value">{translateEventVisibility(event.visibility)}</dd>
                </div>
            </dl>

            {/* Grupo: Fechas */}
            <div className="detail-section-divider">Fechas</div>
            <dl className="dashboard-card__body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-2) var(--space-4)', marginBottom: 0 }}>
                <div className="dashboard-card__pair">
                    <dt className="dashboard-card__term">Fecha inicio</dt>
                    <dd className="dashboard-card__value">{formatEventDateTime(event.startAt)}</dd>
                </div>
                <div className="dashboard-card__pair">
                    <dt className="dashboard-card__term">Fecha fin</dt>
                    <dd className="dashboard-card__value">{formatEventDateTime(event.endAt)}</dd>
                </div>
            </dl>

            {/* Grupo: Lugar */}
            <div className="detail-section-divider">Lugar</div>
            <dl className="dashboard-card__body" style={{ marginBottom: 0 }}>
                <div className="dashboard-card__pair" style={{ gridTemplateColumns: '1fr' }}>
                    <dd className="dashboard-card__value">
                        {event.location || <span style={mutedValue}>-</span>}
                    </dd>
                </div>
            </dl>

            {/* Grupo: Descripción */}
            <div className="detail-section-divider">Descripción</div>
            <dl className="dashboard-card__body" style={{ marginBottom: 0 }}>
                <div className="dashboard-card__pair" style={{ gridTemplateColumns: '1fr' }}>
                    <dd className="dashboard-card__value" style={{ whiteSpace: 'pre-wrap', ...(event.description ? {} : mutedValue) }}>
                        {event.description || '-'}
                    </dd>
                </div>
            </dl>
        </>
    )
}
