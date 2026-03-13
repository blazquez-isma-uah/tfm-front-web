import { useState } from 'react'

/**
 * useSorting — Encapsula la lógica de ordenación de columnas de tabla.
 * 
 * Comportamiento:
 * - Primera vez que se hace click en una columna → ASC
 * - Segunda vez en la misma columna → DESC
 * - Click en otra columna → resetea a ASC para esa columna
 * 
 * El tipo T representa el conjunto de campos ordenables para type-safety.
 * 
 * Uso:
 *   type SortableField = 'username' | 'email' | 'active'
 *   const sorting = useSorting<SortableField>()
 *   fetchUsers(token, page, size, sorting.field, sorting.direction)
 *   <DataTable sortState={sorting.state} onSortChange={sorting.handleSortChange} />
 */

export type SortDirection = 'asc' | 'desc'

export type SortingState<T extends string> = {
    field: T | null
    direction: SortDirection
    handleSortChange: (field: T) => void
    state: { field: T | null; direction: SortDirection }
    reset: () => void
}

export function useSorting<T extends string>(defaultField: T | null = null): SortingState<T> {
    // Estado: campo ordenado (null si no hay ordenación) y dirección (asc/desc)
    const [field, setField] = useState<T | null>(defaultField)
    const [direction, setDirection] = useState<SortDirection>('asc')

    // Manejador de click en columna ordenable.
    // Si es la misma columna, invierte la dirección.
    // Si es columna nueva, la activa en ASC.
    const handleSortChange = (newField: T) => {
        if (field === newField) {
            setDirection(prev => prev === 'asc' ? 'desc' : 'asc')
        } else {
            setField(newField)
            setDirection('asc')
        }
    }

    // Resetea la ordenación a su estado inicial
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