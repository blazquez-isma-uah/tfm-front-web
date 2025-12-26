import type { SurveyStatus, ResponseType, YesNoMaybeAnswer, SurveyType } from '../types/surveys'

// ==================== Survey Status ====================

export function translateSurveyStatus(status: SurveyStatus): string {
  const translations: Record<string, string> = {
    DRAFT: 'Borrador',
    OPEN: 'Abierta',
    CLOSED: 'Cerrada',
    CANCELLED: 'Cancelada',
  }
  return translations[status] || status
}

// ==================== Response Type ====================

export function translateResponseType(type: ResponseType): string {
  const translations: Record<string, string> = {
    YES_NO_MAYBE: 'Sí/No/Quizás',
    YES_NO_MAYBE_WITH_INSTRUMENT: 'Sí/No/Quizás (con instrumento)',
  }
  return translations[type] || type
}

// ==================== Survey Type ====================

export function translateSurveyType(type: SurveyType): string {
  const translations: Record<string, string> = {
    ATTENDANCE: 'Asistencia',
    OTHER: 'Otro',
  }
  return translations[type] || type
}

// ==================== YesNoMaybe Answer ====================

export function translateYesNoMaybeAnswer(answer: YesNoMaybeAnswer): string {
  const translations: Record<string, string> = {
    YES: 'Sí',
    NO: 'No',
    MAYBE: 'Quizás',
  }
  return translations[answer] || answer
}

// ==================== Date/Time Formatting ====================

/**
 * Formatea un ISO Instant a formato legible sin conversión de zona horaria
 * Ejemplo: "2024-03-15T14:30:00.000Z" -> "15/03/2024, 14:30"
 */
export function formatSurveyDateTime(isoString?: string): string {
  if (!isoString) return '-'
  
  // Usar regex para extraer partes sin crear objeto Date (evita conversión de timezone)
  const match = isoString.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!match) return isoString
  
  const [, year, month, day, hour, minute] = match
  return `${day}/${month}/${year}, ${hour}:${minute}`
}
