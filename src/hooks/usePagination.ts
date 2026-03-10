import { useState } from 'react'

/**
 * usePagination — Encapsula toda la lógica de paginación.
 * 
 * Reduce el boilerplate de gestión de paginación que se repetía
 * idénticamente en todas las páginas principales.
 * 
 * Uso:
 *   const pagination = usePagination({ defaultSize: 10 })
 *   fetchUsers(token, pagination.page, pagination.size, ...)
 *   pagination.setTotals(data.totalPages, data.totalElements)
 *   <PaginationBar {...pagination.barProps} />
 */

export type PaginationState = {
    page: number
    size: number
    totalPages: number
    totalElements: number
    setTotals: (totalPages: number, totalElements: number) => void
    goToPage: (newPage: number) => void
    changeSize: (newSize: number) => void
    reset: () => void
    barProps: {
        page: number
        totalPages: number
        pageSize: number
        totalElements: number
        onPageChange: (newPage: number) => void
        onPageSizeChange: (newSize: number) => void
    }
}

type UsePaginationOptions = {
    defaultSize?: number
}

export function usePagination({ defaultSize = 10 }: UsePaginationOptions = {}): PaginationState {
    // Estado: página actual (0-indexed), tamaño de página, totales del backend
    const [page, setPage] = useState(0)
    const [size, setSize] = useState(defaultSize)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)

    // Actualiza los totales tras recibir respuesta del backend
    const setTotals = (tp: number, te: number) => {
        setTotalPages(tp)
        setTotalElements(te)
    }

    // Navega a una página concreta (0-indexed)
    const goToPage = (newPage: number) => {
        setPage(newPage)
    }

    // Cambia el tamaño de página y vuelve a la página 0.
    // Volver a la página 0 es necesario porque el número total de páginas cambia.
    const changeSize = (newSize: number) => {
        setSize(newSize)
        setPage(0)
    }

    // Resetea página y totales a 0. Útil al aplicar filtros.
    const reset = () => {
        setPage(0)
        setTotalPages(0)
        setTotalElements(0)
    }

    return {
        page,
        size,
        totalPages,
        totalElements,
        setTotals,
        goToPage,
        changeSize,
        reset,
        barProps: {
            page,
            totalPages,
            pageSize: size,
            totalElements,
            onPageChange: goToPage,
            onPageSizeChange: changeSize,
        },
    }
}