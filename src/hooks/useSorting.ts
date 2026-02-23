import { useState } from 'react'

/**
 * useSorting — Encapsula la lógica de ordenación de columnas de tabla.
 *
 * PROBLEMA QUE RESUELVE:
 * Este bloque aparecía IDÉNTICO en las 4 páginas principales:
 *
 *   const [sortField, setSortField] = useState<SortableField | null>(null)
 *   const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
 *   const handleSortChange = (field: SortableField) => {
 *       if (sortField === field) {
 *           setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
 *       } else {
 *           setSortField(field)
 *           setSortDirection('asc')
 *       }
 *   }
 *
 * Con este hook: 1 línea por página.
 *
 * COMPORTAMIENTO:
 * - Primera vez que se hace click en una columna → ordena ASC
 * - Segunda vez en la misma columna → invierte a DESC
 * - Click en otra columna → resetea a ASC para esa columna
 *
 * USO:
 *   type SortableField = 'username' | 'email' | 'active'
 *   const sorting = useSorting<SortableField>()
 *
 *   // Para la llamada a la API:
 *   fetchUsers(token, page, size, sorting.field, sorting.direction)
 *
 *   // Para el componente DataTable:
 *   <DataTable sortState={sorting.state} onSortChange={sorting.handleSortChange} />
 *
 * GENÉRICO:
 * El tipo T representa el conjunto de campos ordenables,
 * que varía en cada página. Esto da type-safety: TypeScript
 * avisará si pasas un campo que no es ordenable.
 */

export type SortDirection = 'asc' | 'desc'

export type SortingState<T extends string> = {
    /** Campo actualmente ordenado, o null si no hay ordenación activa */
    field: T | null
    /** Dirección actual de ordenación */
    direction: SortDirection
    /** Manejador para pasar a DataTable en onSortChange */
    handleSortChange: (field: T) => void
    /** Objeto SortState listo para pasar a DataTable con spread */
    state: { field: T | null; direction: SortDirection }
    /** Resetea la ordenación a su estado inicial (sin campo, ASC) */
    reset: () => void
}

export function useSorting<T extends string>(defaultField: T | null = null): SortingState<T> {
    const [field, setField] = useState<T | null>(defaultField)
    const [direction, setDirection] = useState<SortDirection>('asc')

    const handleSortChange = (newField: T) => {
        if (field === newField) {
            // Misma columna: invertir dirección
            setDirection(prev => prev === 'asc' ? 'desc' : 'asc')
        } else {
            // Columna nueva: activarla en ASC
            setField(newField)
            setDirection('asc')
        }
    }

    const reset = () => {
        setField(defaultField)
        setDirection('asc')
    }

    return {
        field,
        direction,
        handleSortChange,
        state: { field, direction },
        reset,
    }
}