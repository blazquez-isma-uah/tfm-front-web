function formatDate(date?: string | null): string {
  if (!date) return '-'

  const parts = date.split('-')
  if (parts.length !== 3) {
    // Por si algún día llega con otro formato
    return date
  }

  const [year, month, day] = parts
  return `${day}-${month}-${year}` // dd-MM-yyyy
}

function formatDateTime(dateTime?: string | null): string {
  if (!dateTime) return '-' 
  const date = new Date(dateTime)
  if (isNaN(date.getTime())) {
    return dateTime // Por si no es una fecha válida
  }
  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0') // Los meses van de 0 a 11
  const year = date.getUTCFullYear()
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  return `${day}-${month}-${year} ${hours}:${minutes}` // dd-MM-yyyy HH:mm
}

/**
 * Extrae solo la fecha (YYYY-MM-DD) de un string ISO 8601.
 *
 * @param isoString - Fecha en formato ISO 8601 (ej: "2026-05-22T19:00:00Z")
 * @returns Fecha en formato YYYY-MM-DD (ej: "2026-05-22")
 *
 * @example
 * getDateOnly("2026-05-22T19:00:00Z") // "2026-05-22"
 */
function getDateOnly(isoString: string): string {
    return isoString.split('T')[0]
}

/**
 * Convierte una fecha ISO 8601 al formato DD/MM/YYYY (formato español).
 *
 * @param isoString - Fecha en formato ISO 8601
 * @returns Fecha en formato DD/MM/YYYY (ej: "22/05/2026")
 *
 * @example
 * formatDateSpanish("2026-05-22T19:00:00Z") // "22/05/2026"
 */
function formatDateSpanish(isoString: string): string {
    const date = new Date(isoString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
}

export { formatDate, formatDateTime, getDateOnly, formatDateSpanish }