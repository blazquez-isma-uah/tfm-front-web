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

export { formatDate }