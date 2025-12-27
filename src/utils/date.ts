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

export { formatDate, formatDateTime }