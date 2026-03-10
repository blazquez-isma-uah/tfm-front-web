/**
 * src/hooks/index.ts — Exportaciones centralizadas de custom hooks.
 * Permite imports limpios: import { usePagination, useSorting } from '../../hooks'
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