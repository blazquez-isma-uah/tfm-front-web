/**
 * src/hooks/index.ts — Exportaciones centralizadas de custom hooks.
 *
 * Con este índice, los imports en los componentes son más limpios:
 *
 *   // Sin índice (verboso):
 *   import { usePagination } from '../../hooks/usePagination'
 *   import { useSorting } from '../../hooks/useSorting'
 *   import { useConfirmDialog } from '../../hooks/useConfirmDialog'
 *
 *   // Con índice (limpio):
 *   import { usePagination, useSorting, useConfirmDialog } from '../../hooks'
 */

export { usePagination }       from './usePagination'
export type { PaginationState } from './usePagination'

export { useSorting }          from './useSorting'
export type { SortingState, SortDirection } from './useSorting'

export { useConfirmDialog }    from './useConfirmDialog'
export type { ConfirmDialogControl, ConfirmDialogVariant } from './useConfirmDialog'

export { useRowExpansion }     from './useRowExpansion'
export type { RowExpansionControl } from './useRowExpansion'

export { useMediaQuery } from './useMediaQuery'
export { useFormValidation, rules } from './useFormValidation'