import { useState, useCallback } from 'react'

/**
 * useRowExpansion — Encapsula la lógica de expansión/colapso de filas en tablas.
 *
 * PROBLEMA QUE RESUELVE:
 * Este bloque aparecía IDÉNTICO en las 4 páginas principales:
 *
 *   const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
 *   const [isClosing, setIsClosing] = useState(false)
 *   const handleRowClick = (row) => {
 *       if (expandedRowId === row.id) {
 *           setIsClosing(true)
 *           setTimeout(() => {
 *               setExpandedRowId(null)
 *               setIsClosing(false)
 *           }, 250)
 *       } else {
 *           setExpandedRowId(row.id)
 *           setIsClosing(false)
 *       }
 *   }
 *
 * Con este hook: 1 línea por página.
 *
 * LÓGICA DE ANIMACIÓN:
 * El hook gestiona un estado intermedio `isClosing` que permite
 * que la animación CSS de colapso (collapseRow) se complete antes
 * de eliminar el elemento del DOM. Sin este estado, el elemento
 * desaparecería abruptamente sin animación de salida.
 *
 * El timing de 250ms coincide con la duración de la animación
 * CSS definida en common.css (@keyframes collapseRow).
 *
 * GENÉRICO:
 * El tipo T (por defecto string) representa el tipo del ID de la fila.
 * Acepta string o number, lo que cubre todos los casos de la app.
 *
 * USO:
 *   const rowExpansion = useRowExpansion<number>()
 *
 *   // Para manejar el click en una fila:
 *   <tr onClick={() => rowExpansion.toggle(user.id)}>
 *
 *   // Para renderizar el contenido expandido:
 *   {rowExpansion.expandedId === user.id && (
 *       <tr>
 *           <td colSpan={...}>
 *               <div className={`expanded-row-content ${rowExpansion.isClosing ? 'closing' : ''}`}>
 *                   <UserDetailCard user={user} />
 *               </div>
 *           </td>
 *       </tr>
 *   )}
 */

const ANIMATION_DURATION_MS = 250

export type RowExpansionControl<T = string> = {
    /** ID de la fila actualmente expandida, o null si ninguna */
    expandedId: T | null
    /** True durante los 250ms de la animación de cierre */
    isClosing: boolean
    /** Alterna la expansión de una fila. Si ya está expandida, la colapsa con animación */
    toggle: (id: T) => void
    /** Cierra la fila expandida (con animación) */
    close: () => void
    /** Cierra sin animación (útil al cambiar de página/filtros) */
    forceClose: () => void
    /** Devuelve true si la fila con ese ID está actualmente expandida */
    isExpanded: (id: T) => boolean
}

export function useRowExpansion<T = string>(): RowExpansionControl<T> {
    const [expandedId, setExpandedId] = useState<T | null>(null)
    const [isClosing, setIsClosing] = useState(false)

    const close = useCallback(() => {
        setIsClosing(true)
        setTimeout(() => {
            setExpandedId(null)
            setIsClosing(false)
        }, ANIMATION_DURATION_MS)
    }, [])

    const forceClose = useCallback(() => {
        setExpandedId(null)
        setIsClosing(false)
    }, [])

    const toggle = useCallback((id: T) => {
        if (expandedId === id) {
            // La fila ya está expandida: colapsar con animación
            setIsClosing(true)
            setTimeout(() => {
                setExpandedId(null)
                setIsClosing(false)
            }, ANIMATION_DURATION_MS)
        } else {
            // Nueva fila: expandir (cancela cualquier cierre en curso)
            setIsClosing(false)
            setExpandedId(id)
        }
    }, [expandedId])

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