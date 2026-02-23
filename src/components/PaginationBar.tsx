/**
 * PaginationBar — Barra de paginación reutilizable.
 *
 * CAMBIOS RESPECTO AL ORIGINAL:
 * - Reemplaza todos los estilos inline por clases CSS del design system
 * - Diseño Mobile First: en móvil se apila verticalmente, en tablet+ en fila
 * - Los botones usan las clases .btn .btn-secondary para consistencia
 * - Se añaden atributos aria para accesibilidad (los botones disabled
 *   ya son semánticamente correctos, pero añadimos aria-label descriptivo)
 * - Se unifica el componente con el tipo que espera el hook usePagination
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

    const handlePrev = () => onPageChange(Math.max(0, page - 1))
    const handleNext = () => {
        if (totalPages > 0) onPageChange(Math.min(totalPages - 1, page + 1))
    }

    const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSize = Number(e.target.value)
        if (onPageSizeChange && !Number.isNaN(newSize)) {
            onPageSizeChange(newSize)
        }
    }

    const from = totalElements === 0 ? 0 : page * pageSize + 1
    const to   = totalElements === 0 ? 0 : Math.min(totalElements, (page + 1) * pageSize)

    const isFirstPage = page === 0
    const isLastPage  = totalPages === 0 || page >= totalPages - 1

    return (
        <div className="pagination-bar">

            {/* ── Navegación de páginas ── */}
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

            {/* ── Resumen y selector de tamaño ── */}
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