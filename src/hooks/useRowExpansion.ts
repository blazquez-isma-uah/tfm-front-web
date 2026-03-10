import { useState, useCallback } from 'react'

/**
 * useRowExpansion — Encapsula la lógica de expansión/colapso de filas en tablas.
 * 
 * Gestiona un estado intermedio `isClosing` que permite que la animación CSS
 * de colapso se complete antes de eliminar el elemento del DOM. El timing de
 * 250ms coincide con la animación CSS definida en common.css.
 * 
 * El tipo T (por defecto string) representa el tipo del ID de la fila.
 * 
 * Uso:
 *   const rowExpansion = useRowExpansion<number>()
 *   <tr onClick={() => rowExpansion.toggle(user.id)}>
 *   {rowExpansion.expandedId === user.id && (
 *     <div className={`expanded-row-content ${rowExpansion.isClosing ? 'closing' : ''}`}>...
 *   )}
 */

const ANIMATION_DURATION_MS = 250

export type RowExpansionControl<T = string> = {
    expandedId: T | null
    isClosing: boolean
    toggle: (id: T) => void
    close: () => void
    forceClose: () => void
    isExpanded: (id: T) => boolean
}

export function useRowExpansion<T = string>(): RowExpansionControl<T> {
    // Estado: ID de la fila expandida (null si ninguna) y flag de animación de cierre
    const [expandedId, setExpandedId] = useState<T | null>(null)
    const [isClosing, setIsClosing] = useState(false)

    // Cierra la fila expandida con animación (250ms)
    const close = useCallback(() => {
        setIsClosing(true)
        setTimeout(() => {
            setExpandedId(null)
            setIsClosing(false)
        }, ANIMATION_DURATION_MS)
    }, [])

    // Cierra la fila expandida sin animación. Útil al cambiar de página o filtros.
    const forceClose = useCallback(() => {
        setExpandedId(null)
        setIsClosing(false)
    }, [])

    // Alterna la expansión de una fila.
    // Si la fila ya está expandida, la colapsa con animación.
    // Si es otra fila, la expande cancelando cualquier cierre en curso.
    const toggle = useCallback((id: T) => {
        if (expandedId === id) {
            // Misma fila: colapsar con animación
            setIsClosing(true)
            setTimeout(() => {
                setExpandedId(null)
                setIsClosing(false)
            }, ANIMATION_DURATION_MS)
        } else {
            // Fila diferente: expandir inmediatamente
            setIsClosing(false)
            setExpandedId(id)
        }
    }, [expandedId])

    // Comprueba si una fila está expandida
    const isExpanded = useCallback((id: T) => expandedId === id, [expandedId])

    return {
        expandedId,
        isClosing,
        toggle,
        close,
        forceClose,
        isExpanded,
    }
}