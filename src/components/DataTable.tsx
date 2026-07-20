import { Fragment, type ReactNode } from 'react'
import { useMediaQuery } from '../hooks/useMediaQuery'

/**
 * DataTable — Tabla genérica paginada con vista responsive adaptativa.
 * 
 * En pantallas < 768px renderiza cada fila como una tarjeta vertical.
 * En pantallas >= 768px renderiza una tabla HTML estándar.
 * 
 * La decisión entre vistas se toma con useMediaQuery para evitar renderizar
 * DOM duplicado y mantener sincronizada la lógica de expansión entre ambas vistas.
 * 
 * @param getRowId Función para extraer el ID único de cada fila. Fallback a row.id
 * @param getRowTitle Texto tooltip nativo que aparece al hacer hover sobre la fila
 */

// ─── Tipos públicos ────────────────────────────────────────────────────────────

export type SortDirection = 'asc' | 'desc'

export type SortState<F extends string> = {
  field: F | null
  direction: SortDirection
}

export type ColumnDef<T, F extends string> = {
  key: string
  header: string
  sortable?: boolean
  sortField?: F
  render?: (row: T) => ReactNode
  width?: string | number
}

type DataTableProps<T, F extends string> = {
  columns: ColumnDef<T, F>[]
  data: T[]
  sortState?: SortState<F>
  onSortChange?: (field: F) => void
  onRowClick?: (row: T) => void
  expandedRowId?: string | number | null
  renderExpandedContent?: (row: T) => ReactNode
  isClosing?: boolean
  getRowId?: (row: T) => string | number
  getRowTitle?: (row: T) => string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Fallback seguro cuando no se proporciona getRowId */
function defaultGetRowId<T>(row: T, idx: number): string | number {
  const id = (row as Record<string, unknown>).id
  return (id as string | number) ?? idx
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function DataTable<T, F extends string>({
  columns,
  data,
  sortState,
  onSortChange,
  onRowClick,
  expandedRowId,
  renderExpandedContent,
  isClosing = false,
  getRowId,
  getRowTitle,
}: DataTableProps<T, F>) {
  // Decidimos qué vista renderizar según el ancho de la pantalla.
  // 767px es el breakpoint entre móvil y tablet en el design system.
  const isMobile = useMediaQuery('(max-width: 767px)')

  // Resuelve el ID único de cada fila, usando getRowId si se proporciona
  // o cayendo a row.id como fallback.
  const resolveId = (row: T, idx: number) =>
    getRowId ? getRowId(row) : defaultGetRowId(row, idx)

  // Comprueba si una fila específica está expandida comparando su ID
  // con expandedRowId (que viene del hook useRowExpansion en el componente padre).
  const isRowExpanded = (row: T, idx: number) => {
    if (expandedRowId == null) return false
    return resolveId(row, idx) === expandedRowId
  }

  // Renderiza el valor de una celda: usa la función render personalizada
  // si existe, o accede directamente a la propiedad del objeto.
  const renderCellValue = (col: ColumnDef<T, F>, row: T): ReactNode =>
    col.render
      ? col.render(row)
      : (row as Record<string, unknown>)[col.key] as ReactNode

  // Renderiza el marcador de ordenación (▲ o ▼) si la columna está ordenada.
  const renderSortMarker = (col: ColumnDef<T, F>) => {
    if (!sortState || !col.sortable || !col.sortField) return null
    // Solo mostramos el marcador si esta columna es la que está ordenada actualmente
    if (sortState.field !== col.sortField) return null
    return sortState.direction === 'asc' ? ' ▲' : ' ▼'
  }

  // ========== VISTA MÓVIL: Cards verticales ==========
  if (isMobile) {
    // Separamos las columnas de datos de la columna de acciones.
    // En móvil, las acciones se renderizan al final de la card, visualmente separadas.
    const dataColumns = columns.filter((c) => c.key !== 'actions')
    const actionsColumn = columns.find((c) => c.key === 'actions')

    // Columnas ordenables: mismo criterio que decide qué cabeceras son
    // clicables en la vista de tabla (col.sortable && col.sortField).
    // El control de ordenación en móvil reutiliza exactamente esas mismas
    // columnas y el mismo onSortChange -- no hay una lista de campos
    // ordenables distinta para cada vista.
    const sortableColumns = columns.filter((c) => c.sortable && c.sortField)
    const showSortControl = sortableColumns.length > 0 && !!onSortChange

    return (
      <div className="dt-mobile-wrapper">
        {showSortControl && (
          <div className="dt-mobile-sort">
            <select
              className="select-base dt-mobile-sort__field"
              value={sortState?.field ?? ''}
              onChange={(e) => {
                const field = e.target.value
                if (field) onSortChange!(field as F)
              }}
              aria-label="Ordenar por"
            >
              <option value="" disabled>Ordenar por...</option>
              {sortableColumns.map((col) => (
                <option key={col.key} value={col.sortField as string}>
                  {col.header}
                </option>
              ))}
            </select>
            {/* Solo visible con un campo ya activo: pulsar invierte la
                dirección, igual que un segundo click sobre la misma
                cabecera en la vista de tabla. */}
            {sortState?.field && (
              <button
                type="button"
                className="button-secondary dt-mobile-sort__direction"
                onClick={() => onSortChange!(sortState.field as F)}
                aria-label={
                  sortState.direction === 'asc'
                    ? 'Orden ascendente, pulsar para invertir'
                    : 'Orden descendente, pulsar para invertir'
                }
              >
                {sortState.direction === 'asc' ? '▲' : '▼'}
              </button>
            )}
          </div>
        )}

        {data.length === 0 ? (
          <p className="dt-card-empty">
            No hay datos para los filtros actuales.
          </p>
        ) : (
        <ul className="dt-card-list" role="list">
        {data.map((row, idx) => {
          const rowId = resolveId(row, idx)
          const expanded = isRowExpanded(row, idx)

          return (
            <li key={rowId}>
              {/* Usamos <article> porque cada card es una unidad de contenido
                  semánticamente autónoma (un usuario, evento, etc.). */}
              <article
                id={String(rowId)}
                className={`dt-card${expanded ? ' dt-card--expanded' : ''}`}
                title={getRowTitle ? getRowTitle(row) : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                // role="button" hace que lectores de pantalla anuncien que es interactivo
                role={onRowClick ? 'button' : undefined}
                // tabIndex={0} permite que usuarios de teclado puedan navegar a la card
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        // Enter o Espacio activan el click (estándar de accesibilidad)
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onRowClick(row)
                        }
                      }
                    : undefined
                }
              >
                {/* <dl> (definition list) es semánticamente correcto para pares etiqueta:valor */}
                <dl className="dt-card__body">
                  {dataColumns.map((col) => (
                    <div key={col.key} className="dt-card__pair">
                      <dt className="dt-card__term">{col.header}</dt>
                      <dd className="dt-card__value">{renderCellValue(col, row)}</dd>
                    </div>
                  ))}
                </dl>

                {/* Las acciones se renderizan al final de la card,
                    visualmente separadas de los datos del registro */}
                {actionsColumn && (
                  <div className="dt-card__actions">
                    {renderCellValue(actionsColumn, row)}
                  </div>
                )}
              </article>

              {/* Contenido expandido: se renderiza fuera del <article> para que
                  tenga su propio contexto de diseño (altura máxima, animación, etc.) */}
              {expanded && renderExpandedContent && (
                <div className={`expanded-row-content ${isClosing ? 'closing' : ''}`}>
                  {renderExpandedContent(row)}
                </div>
              )}
            </li>
          )
        })}
      </ul>
        )}
      </div>
    )
  }

  // ========== VISTA TABLET/DESKTOP: Tabla HTML estándar ==========
  return (
    <div className="data-table-wrapper">
      <table className="dt-table">
        <thead className="dt-table__head">
          <tr>
            {columns.map((col) => {
              const isSortable = col.sortable && col.sortField && onSortChange
              return (
                <th
                  key={col.key}
                  className={`dt-table__th${isSortable ? ' dt-table__th--sortable' : ''}`}
                  style={{ width: col.width }}
                  // Si la columna es ordenable, el click cambia la ordenación
                  onClick={
                    isSortable
                      ? () => onSortChange!(col.sortField as F)
                      : undefined
                  }
                  // tabIndex={0} permite navegar a la columna con teclado
                  tabIndex={isSortable ? 0 : undefined}
                  onKeyDown={
                    isSortable
                      ? (e) => {
                          // Enter o Espacio activan la ordenación
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            onSortChange!(col.sortField as F)
                          }
                        }
                      : undefined
                  }
                  // aria-sort indica el estado de ordenación a lectores de pantalla
                  aria-sort={
                    isSortable && sortState && sortState.field === col.sortField
                      ? sortState.direction === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                >
                  {col.header}
                  {renderSortMarker(col)}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {/* Mensaje cuando no hay datos */}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="dt-table__empty">
                No hay datos para los filtros actuales.
              </td>
            </tr>
          )}
          {data.map((row, idx) => {
            const rowId = resolveId(row, idx)
            const expanded = isRowExpanded(row, idx)

            return (
              // Usamos Fragment con key para poder renderizar tanto el <tr> principal
              // como el <tr> de contenido expandido (si aplica) bajo la misma key.
              <Fragment key={rowId}>
                <tr
                  id={String(rowId)}
                  className={`dt-table__row${expanded ? ' dt-table__row--expanded' : ''}${onRowClick ? ' dt-table__row--clickable' : ''}`}
                  title={getRowTitle ? getRowTitle(row) : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? 'button' : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            const target = e.target as HTMLElement
                            // No activamos el click si el evento viene de un elemento
                            // ya interactivo (botón, enlace, input) para no interferir
                            const isInteractive = target.tagName === 'BUTTON' || 
                                                  target.tagName === 'A' || 
                                                  target.tagName === 'INPUT' ||
                                                  target.tagName === 'SELECT' ||
                                                  target.tagName === 'TEXTAREA'
                            if (isInteractive) return
                            
                            e.preventDefault()
                            onRowClick(row)
                          }
                        }
                      : undefined
                  }
                >
                  {columns.map((col) => (
                    <td key={col.key} className="dt-table__td">
                      {renderCellValue(col, row)}
                    </td>
                  ))}
                </tr>

                {/* Fila de contenido expandido: ocupa todas las columnas.
                    isClosing aplica la animación de cierre (collapseRow en CSS) */}
                {expanded && renderExpandedContent && (
                  <tr>
                    <td colSpan={columns.length} className="dt-table__expanded-td">
                      <div className={`expanded-row-content ${isClosing ? 'closing' : ''}`}>
                        {renderExpandedContent(row)}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}