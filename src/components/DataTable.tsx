import { Fragment, type ReactNode } from 'react'
import { useMediaQuery } from '../hooks/useMediaQuery'

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
  /** Nombre del campo que el backend espera para ordenar */
  sortField?: F
  /** Cómo renderizar la celda. Por defecto: (row as Record<string,unknown>)[key] */
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
  /**
   * Extrae el identificador único de cada fila.
   * Si no se proporciona, hace fallback a (row as any).id — compatible con
   * todas las entidades actuales del proyecto sin necesitar cambios en las páginas.
   */
  getRowId?: (row: T) => string | number
  /**
   * Texto que aparece como tooltip nativo del navegador al hacer hover sobre la fila.
   * Se aplica al atributo `title` del <tr> (desktop) y del <article> (móvil).
   */
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
  // El punto de corte 480px coincide con el breakpoint 'sm' de design-tokens.css
  // y con el umbral definido en el handoff de Fase 3.
  const isMobile = useMediaQuery('(max-width: 767px)')

  const resolveId = (row: T, idx: number) =>
    getRowId ? getRowId(row) : defaultGetRowId(row, idx)

  const isRowExpanded = (row: T, idx: number) => {
    if (expandedRowId == null) return false
    return resolveId(row, idx) === expandedRowId
  }

  const renderCellValue = (col: ColumnDef<T, F>, row: T): ReactNode =>
    col.render
      ? col.render(row)
      : (row as Record<string, unknown>)[col.key] as ReactNode

  const renderSortMarker = (col: ColumnDef<T, F>) => {
    if (!sortState || !col.sortable || !col.sortField) return null
    if (sortState.field !== col.sortField) return null
    return sortState.direction === 'asc' ? ' ▲' : ' ▼'
  }

  // ── Vista móvil: cada fila → tarjeta ──────────────────────────────────────
  if (isMobile) {
    const dataColumns = columns.filter((c) => c.key !== 'actions')
    const actionsColumn = columns.find((c) => c.key === 'actions')

    if (data.length === 0) {
      return (
        <p className="dt-card-empty">
          No hay datos para los filtros actuales.
        </p>
      )
    }

    return (
      <ul className="dt-card-list" role="list">
        {data.map((row, idx) => {
          const rowId = resolveId(row, idx)
          const expanded = isRowExpanded(row, idx)

          return (
            <li key={rowId}>
              {/*
               * Usamos <article> porque cada tarjeta es una unidad de contenido
               * semánticamente autónoma (un usuario, un evento, etc.).
               * Ref: HTML spec §4.3.2
               */}
              <article
                id={String(rowId)}
                className={`dt-card${expanded ? ' dt-card--expanded' : ''}`}
                title={getRowTitle ? getRowTitle(row) : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                // Accesibilidad: si la fila es interactiva, debe ser operable con teclado
                role={onRowClick ? 'button' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onRowClick(row)
                        }
                      }
                    : undefined
                }
              >
                {/* Pares etiqueta:valor con <dl> — semánticamente correcto para este patrón */}
                <dl className="dt-card__body">
                  {dataColumns.map((col) => (
                    <div key={col.key} className="dt-card__pair">
                      <dt className="dt-card__term">{col.header}</dt>
                      <dd className="dt-card__value">{renderCellValue(col, row)}</dd>
                    </div>
                  ))}
                </dl>

                {/* Acciones al final de la tarjeta, separadas visualmente */}
                {actionsColumn && (
                  <div className="dt-card__actions">
                    {renderCellValue(actionsColumn, row)}
                  </div>
                )}
              </article>

              {/* Contenido expandido — misma lógica que en la tabla */}
              {expanded && renderExpandedContent && (
                <div className={`expanded-row-content ${isClosing ? 'closing' : ''}`}>
                  {renderExpandedContent(row)}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    )
  }

  // ── Vista tablet/desktop: tabla normal ────────────────────────────────────
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
                  onClick={
                    isSortable
                      ? () => onSortChange!(col.sortField as F)
                      : undefined
                  }
                  // Accesibilidad: indica el estado de ordenación al lector de pantalla
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
              /*
               * CORRECCIÓN: la key debe estar en el Fragment, no en el <tr> hijo.
               * Con <> shorthand no se puede poner key; hay que usar React.Fragment explícito.
               */
              <Fragment key={rowId}>
                <tr
                  id={String(rowId)}
                  className={`dt-table__row${expanded ? ' dt-table__row--expanded' : ''}${onRowClick ? ' dt-table__row--clickable' : ''}`}
                  title={getRowTitle ? getRowTitle(row) : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="dt-table__td">
                      {renderCellValue(col, row)}
                    </td>
                  ))}
                </tr>

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