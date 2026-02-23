import { useState } from 'react'

/**
 * usePagination — Encapsula toda la lógica de paginación.
 *
 * PROBLEMA QUE RESUELVE:
 * Los siguientes 4 useState + 3 handlers aparecían IDÉNTICOS
 * en UsersPage, EventsPage, SurveysPage e InstrumentsPage:
 *
 *   const [page, setPage] = useState(0)
 *   const [size, setSize] = useState(10)
 *   const [totalPages, setTotalPages] = useState(0)
 *   const [totalElements, setTotalElements] = useState(0)
 *   const handleNextPage = () => { ... }
 *   const handlePrevPage = () => { ... }
 *   const handleSizeChange = (newSize) => { ... }
 *
 * Eso son ~20 líneas × 4 páginas = 80 líneas duplicadas.
 * Con este hook: 1 línea por página.
 *
 * USO:
 *   const pagination = usePagination({ defaultSize: 10 })
 *
 *   // Para la llamada a la API:
 *   fetchUsers(token, pagination.page, pagination.size, ...)
 *
 *   // Cuando la API responde:
 *   pagination.setTotals(data.totalPages, data.totalElements)
 *
 *   // Para el componente PaginationBar:
 *   <PaginationBar {...pagination.barProps} />
 */

export type PaginationState = {
    /** Página actual (0-indexed, como espera Spring Data) */
    page: number
    /** Tamaño de página actual */
    size: number
    /** Total de páginas devuelto por el backend */
    totalPages: number
    /** Total de elementos devuelto por el backend */
    totalElements: number
    /** Actualiza los totales tras recibir respuesta del backend */
    setTotals: (totalPages: number, totalElements: number) => void
    /** Navega a una página concreta */
    goToPage: (newPage: number) => void
    /** Cambia el tamaño de página y resetea a la página 0 */
    changeSize: (newSize: number) => void
    /** Resetea página y totales a 0 (útil al aplicar filtros) */
    reset: () => void
    /** Props listos para pasar a <PaginationBar> con spread */
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
    /** Tamaño de página inicial. Por defecto: 10 */
    defaultSize?: number
}

export function usePagination({ defaultSize = 10 }: UsePaginationOptions = {}): PaginationState {
    const [page, setPage] = useState(0)
    const [size, setSize] = useState(defaultSize)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)

    const setTotals = (tp: number, te: number) => {
        setTotalPages(tp)
        setTotalElements(te)
    }

    const goToPage = (newPage: number) => {
        setPage(newPage)
    }

    const changeSize = (newSize: number) => {
        setSize(newSize)
        setPage(0)  // Al cambiar el tamaño siempre volvemos a la primera página
    }

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