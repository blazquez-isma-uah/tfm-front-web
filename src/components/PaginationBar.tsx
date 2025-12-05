type PaginationBarProps = {
    page: number
    totalPages: number
    pageSize: number
    currentCount: number         // elementos en la página actual
    totalElements: number        // total devuelto por el backend
    onPageChange: (newPage: number) => void
    onPageSizeChange?: (newSize: number) => void
    pageSizeOptions?: number[]   // ej: [5, 10, 20, 50]
}

export function PaginationBar({
    page,
    totalPages,
    pageSize,
    currentCount,
    totalElements,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [5, 10, 20, 50],
}: PaginationBarProps) {

    const handlePrev = () => {
        onPageChange(Math.max(0, page - 1))
    }

    const handleNext = () => {
        if (totalPages === 0) return
        onPageChange(Math.min(totalPages - 1, page + 1))
    }

    const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (!onPageSizeChange) return
        const newSize = Number(e.target.value)
        if (!Number.isNaN(newSize)) {
            onPageSizeChange(newSize)
        }
    }

    // Por si quieres mostrar el rango: 11–20 de 53, etc. (opcional)
    const from = totalElements === 0 ? 0 : page * pageSize + 1
    const to = totalElements === 0 ? 0 : Math.min(totalElements, (page + 1) * pageSize)

    return (
        <div
            style={{
                marginTop: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
            }}
        >
            {/* Izquierda: paginación */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button disabled={page === 0} onClick={handlePrev}>
                    Anterior
                </button>
                <span style={{ fontSize: '0.9rem' }}>
                    Página {page + 1} de {totalPages || 1}
                </span>
                <button
                    disabled={totalPages === 0 || page >= totalPages - 1}
                    onClick={handleNext}
                >
                    Siguiente
                </button>
            </div>

            {/* Derecha: info + tamaño de página */}
            <div
                style={{
                    marginLeft: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.85rem',
                }}
            >
                {/* Si quieres mostrar el rango: */}
                {/* <span>{from}–{to} de {totalElements}</span> */}
                {/* Si prefieres "N de total" simple: */}
                <span>
                    {from}–{to} de {totalElements}
                </span>

                {onPageSizeChange && (
                    <>
                        {/* <span>Elementos por página:</span> */}
                        <select value={pageSize} onChange={handlePageSizeChange}>
                            {pageSizeOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </>
                )}
            </div>
        </div>
    )
}