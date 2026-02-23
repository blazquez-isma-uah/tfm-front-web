import type { CalendarEventItemDTO } from '../types/events'
import '../styles/common.css'

interface EventCalendarViewProps {
    currentMonth: Date
    calendarEvents: CalendarEventItemDTO[]
    onPrevMonth: () => void
    onNextMonth: () => void
}

/**
 * EventCalendarView — Vista mensual de eventos en formato cuadrícula.
 *
 * RESPONSABILIDAD:
 * Renderiza un grid CSS de 7 columnas (Lun–Dom) con los días del mes actual.
 * Cada celda muestra el número de día y hasta 3 chips con el título de los
 * eventos que caen en esa fecha. Si hay más de 3 eventos, muestra "+N más".
 *
 * POR QUÉ SE EXTRAE:
 * El bloque renderCalendarView() original tenía ~55 líneas. Toda la lógica
 * de distribución de días (cálculo de primer día de la semana, celdas vacías
 * de relleno, agrupación por día en eventsByDay) es autocontenida y no depende
 * del estado de EventsPage. Extraerla mejora la legibilidad del componente
 * padre y facilita el test unitario independiente del calendario.
 *
 * DECISIONES DE DISEÑO:
 * - Presentacional puro: no hace llamadas a la API. EventsPage carga los eventos
 *   del mes en loadCalendarEvents() y los pasa por prop.
 * - La semana empieza en Lunes (ajuste: domingo=0 → posición 6).
 * - Máximo 3 eventos visibles por celda con chip "+N más" para evitar overflow.
 * - Los estilos inline se mantienen por ser específicos de esta vista de
 *   cuadrícula; un CSS separado no aportaría reutilización en otro lugar.
 */
export function EventCalendarView({
    currentMonth,
    calendarEvents,
    onPrevMonth,
    onNextMonth,
}: EventCalendarViewProps) {
    const monthName      = currentMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })
    const firstDay       = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const lastDay        = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
    const daysInMonth    = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()
    // Ajuste semana ISO (Lun=0 … Dom=6); getDay() devuelve Dom=0
    const adjustedStart  = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1

    const days: (number | null)[] = []
    for (let i = 0; i < adjustedStart; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(d)

    // Agrupar eventos por día del mes
    const eventsByDay: Record<number, CalendarEventItemDTO[]> = {}
    calendarEvents.forEach(event => {
        const eventDate = new Date(event.startAt)
        if (
            eventDate.getMonth()    === currentMonth.getMonth() &&
            eventDate.getFullYear() === currentMonth.getFullYear()
        ) {
            const day = eventDate.getDate()
            if (!eventsByDay[day]) eventsByDay[day] = []
            eventsByDay[day].push(event)
        }
    })

    return (
        <div className="card">
            {/* Navegación de mes */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <button type="button" className="button-secondary" onClick={onPrevMonth}>← Anterior</button>
                <h2 style={{ textTransform: 'capitalize', margin: 0 }}>{monthName}</h2>
                <button type="button" className="button-secondary" onClick={onNextMonth}>Siguiente →</button>
            </div>

            {/* Cuadrícula 7 columnas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: '#e0e0e0', border: '1px solid #e0e0e0' }}>
                {/* Cabecera de días */}
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                    <div key={day} style={{ backgroundColor: '#f5f5f5', padding: '0.5rem', textAlign: 'center', fontWeight: 600 }}>
                        {day}
                    </div>
                ))}

                {/* Celdas de días */}
                {days.map((day, index) => (
                    <div key={index} style={{ backgroundColor: 'white', minHeight: '80px', padding: '0.5rem', position: 'relative' }}>
                        {day && (
                            <>
                                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{day}</div>
                                {eventsByDay[day]?.length > 0 && (
                                    <div style={{ fontSize: '0.75rem' }}>
                                        {eventsByDay[day].slice(0, 3).map(event => (
                                            <div
                                                key={event.id}
                                                style={{ backgroundColor: '#e3f2fd', padding: '0.15rem 0.25rem', marginBottom: '0.15rem', borderRadius: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                            >
                                                {event.title}
                                            </div>
                                        ))}
                                        {eventsByDay[day].length > 3 && (
                                            <div style={{ fontSize: '0.7rem', color: '#666' }}>
                                                +{eventsByDay[day].length - 3} más
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
