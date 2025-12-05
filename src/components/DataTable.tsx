import { type ReactNode } from 'react'

export type SortDirection = 'asc' | 'desc'

export type SortState<F extends string> = {
  field: F | null
  direction: SortDirection
}

export type ColumnDef<T, F extends string> = {
  key: string
  header: string
  sortable?: boolean
  sortField?: F         // nombre del campo para el backend
  // cómo renderizar la celda (por defecto coge (row as any)[key])
  render?: (row: T) => ReactNode
  width?: string | number
}

type DataTableProps<T, F extends string> = {
  columns: ColumnDef<T, F>[]
  data: T[]
  sortState?: SortState<F>
  onSortChange?: (field: F) => void
}

export function DataTable<T, F extends string>({
  columns,
  data,
  sortState,
  onSortChange,
}: DataTableProps<T, F>) {
  const renderSortMarker = (col: ColumnDef<T, F>) => {
    if (!sortState || !col.sortable || !col.sortField) return null
    if (sortState.field !== col.sortField) return null
    return sortState.direction === 'asc' ? ' ▲' : ' ▼'
  }

  return (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        background: '#ffffff',
        borderRadius: '0.5rem',
        overflow: 'hidden',
      }}
    >
      <thead style={{ background: '#e5e7eb' }}>
        <tr>
          {columns.map((col) => {
            const sortable = col.sortable && col.sortField && onSortChange
            return (
              <th
                key={col.key}
                style={{
                  padding: '0.5rem',
                  textAlign: 'left',
                  cursor: sortable ? 'pointer' : 'default',
                  userSelect: 'none',
                  width: col.width,
                }}
                onClick={
                  sortable ? () => onSortChange!(col.sortField as F) : undefined
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
            <td colSpan={columns.length} style={{ padding: '0.75rem' }}>
              No hay datos para los filtros actuales.
            </td>
          </tr>
        )}
        {data.map((row: any, idx) => (
          <tr key={row.id ?? idx}>
            {columns.map((col) => (
              <td
                key={col.key}
                style={{ padding: '0.5rem', borderTop: '1px solid #e5e7eb' }}
              >
                {col.render ? col.render(row) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
