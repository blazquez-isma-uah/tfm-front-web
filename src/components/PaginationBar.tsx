/**
 * PaginationBar — Barra de paginación reutilizable con diseño responsive.
 * 
 * Mobile First: en móvil se apila verticalmente, en tablet+ en fila horizontal.
 * Los botones usan las clases del design system para consistencia.
 * 
 * @param currentCount Opcional: número de elementos en la página actual
 */

import './PaginationBar.css'

type PaginationBarProps = {
    page: number
    totalPages: number
    pageSize: number
    currentCount?: number        // Opcional: elementos en la página actual
    totalElements: number
    onPageChange: (newPage: number) => void
    onPageSizeChange?: (newSize: number) => void
    pageSizeOptions?: number[]
}

export function PaginationBar({
    page,
    totalPages,
    pageSize,
    totalElements,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [5, 10, 20, 50],
}: PaginationBarProps) {

    // Handlers de navegación: aseguran que no salgamos de los límites (0 a totalPages-1)
    const handlePrev = () => onPageChange(Math.max(0, page - 1))
    const handleNext = () => {
        if (totalPages > 0) onPageChange(Math.min(totalPages - 1, page + 1))
    }

    // Cambia el tamaño de página y notifica al padre
    const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSize = Number(e.target.value)
        if (onPageSizeChange && !Number.isNaN(newSize)) {
            onPageSizeChange(newSize)
        }
    }

    // Cálculo del rango visible (ej: "11–20 de 150")
    const from = totalElements === 0 ? 0 : page * pageSize + 1
    const to   = totalElements === 0 ? 0 : Math.min(totalElements, (page + 1) * pageSize)

    // Deshabilitamos botones en los extremos
    const isFirstPage = page === 0
    const isLastPage  = totalPages === 0 || page >= totalPages - 1

    return (
        <div className="pagination-bar">

            <div className="pagination-nav">
                <button
                    className="btn btn-secondary pagination-btn"
                    onClick={handlePrev}
                    disabled={isFirstPage}
                    aria-label="Ir a la página anterior"
                >
                    ← Anterior
                </button>

                <span className="pagination-info">
                    Página {page + 1} de {totalPages || 1}
                </span>

                <button
                    className="btn btn-secondary pagination-btn"
                    onClick={handleNext}
                    disabled={isLastPage}
                    aria-label="Ir a la página siguiente"
                >
                    Siguiente →
                </button>
            </div>

            <div className="pagination-meta">
                <span className="pagination-range">
                    {from}–{to} de {totalElements}
                </span>

                {onPageSizeChange && (
                    <label className="pagination-size-label">
                        <span className="pagination-size-text">Por página:</span>
                        <select
                            className="select-base pagination-size-select"
                            value={pageSize}
                            onChange={handleSizeChange}
                            aria-label="Elementos por página"
                        >
                            {pageSizeOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </label>
                )}
            </div>
        </div>
    )
}