import type { InstrumentDTO } from '../types/instruments'

// Agrupa una lista de instrumentos por la inicial de su nombre
function groupInstrumentsByInitial(instruments: InstrumentDTO[]) {
  // 1) Ordenamos alfabéticamente por nombre y luego por voz
  const sorted = [...instruments].sort((a, b) => {
    const nameA = (a.instrumentName ?? '').toLowerCase()
    const nameB = (b.instrumentName ?? '').toLowerCase()

    if (nameA < nameB) return -1
    if (nameA > nameB) return 1

    const voiceA = (a.voice ?? '').toLowerCase()
    const voiceB = (b.voice ?? '').toLowerCase()

    if (voiceA < voiceB) return -1
    if (voiceA > voiceB) return 1
    return 0
  })

  // 2) Agrupamos por primera letra
  const groups: Record<string, InstrumentDTO[]> = {}

  for (const inst of sorted) {
    const firstChar = (inst.instrumentName?.[0] ?? '#').toUpperCase()
    const key = /[A-ZÁÉÍÓÚÑ]/.test(firstChar) ? firstChar : '#'
    if (!groups[key]) groups[key] = []
    groups[key].push(inst)
  }

  // 3) Devolvemos un array ordenado por letra
  return Object.keys(groups)
    .sort()
    .map((letter) => ({
      letter,
      items: groups[letter],
    }))
}

type InstrumentGroup = { letter: string; items: InstrumentDTO[] }
export { groupInstrumentsByInitial, type InstrumentGroup }