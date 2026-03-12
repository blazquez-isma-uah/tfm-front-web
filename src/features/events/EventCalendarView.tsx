import { useState, useRef, useEffect } from 'react'
import type { CalendarEventItemDTO } from '../../types/events'
import '../../styles/common.css'

interface EventCalendarViewProps {
    currentMonth: Date
    calendarEvents: CalendarEventItemDTO[]
    onPrevMonth: () => void
    onNextMonth: () => void
    onMonthChange: (date: Date) => void
}

/**
 * EventCalendarView — Vista mensual de eventos en formato de lista cronológica.
 *
 * RESPONSABILIDAD:
 * Renderiza los eventos de un mes agrupados por día, con un selector de mes/año
 * personalizado y navegación prev/next. La información se presenta en una lista
 * vertical (no en grid mensual de 7 columnas).
 *
 * POR QUÉ LISTA CRONOLÓGICA Y NO GRID MENSUAL:
 * - Bajo volumen de eventos: la mayoría de días quedan vacíos
 * - En grid: muchas celdas vacías (impacto especialmente en móvil)
 * - En lista: compacta y densa en información, mejor para pantallas pequeñas
 * - Accesibilidad: más fácil de recorrer con teclado
 *
 * CORRECCIÓN DE TIMEZONE:
 * Usa UTC explícitamente en la lógica de agrupación para evitar que las fechas se
 * desplacen un día según el timezone del dispositivo del usuario. Sin esto:
 * - Un evento con start="2025-03-15T23:00:00Z" podría verse en el día 16
 *   si el usuario está en timezone UTC+2.
 * - Se normaliza: si no hay indicador de zona (Z o +/-HH:MM), se añade 'Z'.
 * - Se usan getUTCMonth(), getUTCDate() para leer las fechas de forma consistente.
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

    // ── Agrupación de eventos por día del mes ─────────────────────────────────
    // Usa UTC explícitamente para evitar desplazamiento de fechas por timezone.
    // Sin esto, un evento en UTC que cae en "2025-03-15T23:00Z" podría
    // aparecer el 16 si el dispositivo usa timezone UTC+2.
    const eventsByDay: Record<number, CalendarEventItemDTO[]> = {}
    calendarEvents.forEach(event => {
        // Guardia defensiva: el backend puede devolver null/undefined en runtime
        if (!event.start) return

        // Normalizar el string ISO: si no tiene indicador de timezone (Z o ±HH:MM),
        // añadir 'Z' para que se interprete como UTC. Evita construir "…+02:00Z"
        // que sería inválido.
        let rawDate = event.start
        if (!rawDate.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(rawDate)) {
            rawDate = rawDate + 'Z'
        }
        const eventDate = new Date(rawDate)
        // Guardia contra Invalid Date (parsing erróneo)
        if (isNaN(eventDate.getTime())) return

        // Usar getUTCMonth(), getUTCDate(), getUTCFullYear() para leer la fecha
        // en UTC, independientemente del timezone local del dispositivo.
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

    // Estado y lógica del selector de mes/año
    const [isPickerOpen, setIsPickerOpen] = useState(false)
    const [pickerYear, setPickerYear] = useState(currentMonth.getFullYear())
    const pickerRef = useRef<HTMLDivElement>(null)

    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]

    const monthNamesShort = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

    // Rango amplio de años: desde 2000 hasta 2050
    const minYear = 2000
    const maxYear = 2050

    // Cerrar el picker al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsPickerOpen(false)
            }
        }
        if (isPickerOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isPickerOpen])

    const handleMonthSelect = (month: number) => {
        onMonthChange(new Date(pickerYear, month, 1))
        setIsPickerOpen(false)
    }

    const handleYearChange = (delta: number) => {
        const newYear = pickerYear + delta
        if (newYear >= minYear && newYear <= maxYear) {
            setPickerYear(newYear)
        }
    }

    const formatCurrentMonth = () => {
        return `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`
    }

    return (
        <div className="card">
            {/* Navegación de mes */}
            <div className="cal-nav">
                <button type="button" className="button-secondary" onClick={onPrevMonth}>
                    ← Anterior
                </button>
                
                {/* Selector de mes/año personalizado */}
                <div style={{ position: 'relative' }} ref={pickerRef}>
                    <button
                        type="button"
                        className="button-secondary"
                        onClick={() => {
                            setPickerYear(currentMonth.getFullYear())
                            setIsPickerOpen(!isPickerOpen)
                        }}
                        style={{
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            padding: '0.6rem 1.2rem',
                            minWidth: '200px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.5rem'
                        }}
                    >
                        <span>{formatCurrentMonth()}</span>
                        <span style={{ fontSize: '0.8rem' }}>📅</span>
                    </button>

                    {/* Dropdown del picker */}
                    {isPickerOpen && (
                        <div
                            style={{
                                position: 'absolute',
                                top: 'calc(100% + 0.5rem)',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                backgroundColor: 'white',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                padding: '1rem',
                                zIndex: 1000,
                                minWidth: '280px'
                            }}
                        >
                            {/* Selector de año */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '1rem',
                                padding: '0.5rem',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '6px'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => handleYearChange(-1)}
                                    disabled={pickerYear <= minYear}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '1.2rem',
                                        cursor: pickerYear <= minYear ? 'not-allowed' : 'pointer',
                                        opacity: pickerYear <= minYear ? 0.3 : 1,
                                        padding: '0.25rem 0.5rem'
                                    }}
                                >
                                    ‹
                                </button>
                                <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                                    {pickerYear}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleYearChange(1)}
                                    disabled={pickerYear >= maxYear}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '1.2rem',
                                        cursor: pickerYear >= maxYear ? 'not-allowed' : 'pointer',
                                        opacity: pickerYear >= maxYear ? 0.3 : 1,
                                        padding: '0.25rem 0.5rem'
                                    }}
                                >
                                    ›
                                </button>
                            </div>

                            {/* Grid de meses */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '0.5rem'
                            }}>
                                {monthNamesShort.map((name, index) => {
                                    const isSelected = index === currentMonth.getMonth() && 
                                                     pickerYear === currentMonth.getFullYear()
                                    return (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => handleMonthSelect(index)}
                                            style={{
                                                padding: '0.6rem',
                                                border: '1px solid #ddd',
                                                borderRadius: '6px',
                                                backgroundColor: isSelected ? '#007bff' : 'white',
                                                color: isSelected ? 'white' : '#333',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem',
                                                fontWeight: isSelected ? '600' : '400',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isSelected) {
                                                    e.currentTarget.style.backgroundColor = '#f0f0f0'
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isSelected) {
                                                    e.currentTarget.style.backgroundColor = 'white'
                                                }
                                            }}
                                        >
                                            {name}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <button type="button" className="button-secondary" onClick={onNextMonth}>
                    Siguiente →
                </button>
            </div>

            {/* Vista de lista cronológica */}
            <div className="cal-list">
                {Object.entries(eventsByDay)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([day, events]) => (
                        <div key={day} className="cal-list__day">
                            <div className={`cal-list__day-header${
                                isToday(Number(day)) ? ' cal-list__day-header--today' : ''
                            }`}>
                                {new Date(
                                    currentMonth.getFullYear(),
                                    currentMonth.getMonth(),
                                    Number(day)
                                ).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}
                            </div>
                            <div className="cal-list__events">
                                {events.map(event => (
                                    <div key={event.id} className="cal-list__event">
                                        <span className="cal-list__event-time">
                                            {formatChipTime(event.start)}
                                        </span>
                                        <span className="cal-list__event-title">{event.title}</span>
                                        {event.location && (
                                            <span className="cal-list__event-location">
                                                📍 {event.location}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                }
                {Object.keys(eventsByDay).length === 0 && (
                    <p className="cal-list__empty">No hay eventos este mes</p>
                )}
            </div>
        </div>
    )
}
