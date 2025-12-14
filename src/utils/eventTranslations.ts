export function translateEventType(type: string): string {
    const translations: Record<string, string> = {
        REHEARSAL: 'Ensayo',
        MEETING: 'Reunión',
        PERFORMANCE: 'Actuación',
        OTHER: 'Otro',
    }
    return translations[type] || type
}

export function translateEventStatus(status: string): string {
    const translations: Record<string, string> = {
        SCHEDULED: 'Programado',
        CANCELED: 'Cancelado',
        POSTPONED: 'Pospuesto',
    }
    return translations[status] || status
}

export function translateEventVisibility(visibility: string): string {
    const translations: Record<string, string> = {
        PUBLIC: 'Público',
        BAND_ONLY: 'Solo banda',
    }
    return translations[visibility] || visibility
}

export function formatEventDateTime(isoString?: string): string {
    if (!isoString) return '-'
    try {
        // Parsear el ISO string manualmente sin conversión de zona horaria
        // Formato esperado: 2025-09-27T19:00:00Z
        const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/)
        if (!match) return isoString
        
        const [, year, month, day, hour, minute] = match
        return `${day}/${month}/${year}, ${hour}:${minute}`
    } catch {
        return isoString
    }
}
