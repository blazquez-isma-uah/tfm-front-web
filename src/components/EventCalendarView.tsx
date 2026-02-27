import type { CalendarEventItemDTO } from '../types/events'
import '../styles/common.css'

interface EventCalendarViewProps {
    currentMonth: Date
    calendarEvents: CalendarEventItemDTO[]
    onPrevMonth: () => void
    onNextMonth: () => void
    onMonthChange: (date: Date) => void
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
 * - Las fechas se normalizan a UTC para evitar drift de zona horaria.
 * - Los estilos se definen en common.css con prefijo .cal-.
 */
export function EventCalendarView({
    currentMonth,
    calendarEvents,
    onPrevMonth,
    onNextMonth,
    onMonthChange,
}: EventCalendarViewProps) {
    const firstDay       = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const lastDay        = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
    const daysInMonth    = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()
    // Ajuste semana ISO (Lun=0 … Dom=6); getDay() devuelve Dom=0
    const adjustedStart  = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1

    const days: (number | null)[] = []
    for (let i = 0; i < adjustedStart; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(d)

    // Agrupar eventos por día del mes (UTC-safe: evita drift de zona horaria)
    const eventsByDay: Record<number, CalendarEventItemDTO[]> = {}
    calendarEvents.forEach(event => {
        // Guardia defensiva: el backend puede devolver null/undefined en runtime
        if (!event.start) return

        // Solo añadir 'Z' si no hay ningún indicador de zona horaria en el string
        // (evita construir "…+02:00Z" que daría Invalid Date)
        let rawDate = event.start
        if (!rawDate.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(rawDate)) {
            rawDate = rawDate + 'Z'
        }
        const eventDate = new Date(rawDate)
        // Guardia contra Invalid Date
        if (isNaN(eventDate.getTime())) return

        const eventMonth = eventDate.getUTCMonth()
        const eventYear  = eventDate.getUTCFullYear()
        const eventDay   = eventDate.getUTCDate()

        if (eventMonth === currentMonth.getMonth() &&
            eventYear  === currentMonth.getFullYear()) {
            if (!eventsByDay[eventDay]) eventsByDay[eventDay] = []
            eventsByDay[eventDay].push(event)
        }
    })

    // Detección del día actual
    const today   = new Date()
    const isToday = (day: number) =>
        today.getDate()     === day &&
        today.getMonth()    === currentMonth.getMonth() &&
        today.getFullYear() === currentMonth.getFullYear()

    // Extrae "HH:MM" de un ISO string (UTC) para mostrarlo como prefijo en el chip
    const formatChipTime = (isoString: string): string => {
        const match = isoString.match(/T(\d{2}):(\d{2})/)
        return match ? `${match[1]}:${match[2]}` : ''
    }

    return (
        <div className="card">
            {/* Navegación de mes */}
            <div className="cal-nav">
                <button type="button" className="button-secondary" onClick={onPrevMonth}>← Anterior</button>
                <input
                    type="month"
                    className="input-base"
                    value={`${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`}
                    onChange={(e) => {
                        if (!e.target.value) return
                        const [year, month] = e.target.value.split('-').map(Number)
                        onMonthChange(new Date(year, month - 1, 1))
                    }}
                    style={{ textTransform: 'capitalize', width: 'auto' }}
                />
                <button type="button" className="button-secondary" onClick={onNextMonth}>Siguiente →</button>
            </div>

            {/* Cuadrícula 7 columnas */}
            <div className="cal-grid">
                {/* Cabecera de días */}
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                    <div key={day} className="cal-grid__header">
                        {day}
                    </div>
                ))}

                {/* Celdas de días */}
                {days.map((day, index) => (
                    <div key={index} className={`cal-grid__cell${day === null ? ' cal-grid__cell--empty' : ''}`}>
                        {day && (
                            <>
                                <div className={`cal-grid__day${isToday(day) ? ' cal-grid__day--today' : ''}`}>{day}</div>
                                {eventsByDay[day]?.length > 0 && (
                                    <>
                                        {eventsByDay[day].slice(0, 3).map(event => (
                                            <div
                                                key={event.id}
                                                className="cal-event-chip"
                                                title={`${formatChipTime(event.start)} · ${event.title}${event.location ? `\n📍 ${event.location}` : ''}`}
                                            >
                                                <span className="cal-event-chip__time">{formatChipTime(event.start)}</span>
                                                {event.title}
                                            </div>
                                        ))}
                                        {eventsByDay[day].length > 3 && (
                                            <div className="cal-event-overflow">
                                                +{eventsByDay[day].length - 3} más
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
