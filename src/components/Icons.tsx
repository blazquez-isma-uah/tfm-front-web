/**
 * Icons.tsx — Iconos SVG inline reutilizables.
 *
 * Se definen los 8 iconos necesarios en lugar de importar una librería
 * completa (Lucide, HeroIcons) para evitar añadir ~50-100KB de bundle
 * innecesarios. Los SVG son de Heroicons (MIT License, Tailwind Labs),
 * paths copiados del set outline 24x24.
 *
 * Todos los componentes aceptan className para control de tamaño/color vía CSS.
 * El color se hereda del padre via currentColor, salvo excepciones documentadas.
 */

interface IconProps {
  className?: string
  'aria-hidden'?: boolean
}

const iconBase = {
  xmlns:         'http://www.w3.org/2000/svg',
  viewBox:       '0 0 24 24',
  width:         '1em',
  height:        '1em',
  fill:          'none',
  stroke:        'currentColor',
  strokeWidth:   1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin:'round' as const,
}

/** Editar */
export function EditIcon({ className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...iconBase} className={className} aria-hidden={ariaHidden}>
      <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
    </svg>
  )
}

/** Eliminar */
export function TrashIcon({ className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...iconBase} className={className} aria-hidden={ariaHidden}>
      <path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  )
}

/** Toggle de panel colapsable */
export function ChevronDownIcon({ className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...iconBase} className={className} aria-hidden={ariaHidden}>
      <path d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

/** Icono de filtros */
export function FilterIcon({ className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...iconBase} className={className} aria-hidden={ariaHidden}>
      <path d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
    </svg>
  )
}

/** Activar/confirmar */
export function CheckIcon({ className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...iconBase} className={className} aria-hidden={ariaHidden}>
      <path d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

/** Cerrar o desactivar (acción neutra) */
export function XMarkIcon({ className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...iconBase} className={className} aria-hidden={ariaHidden}>
      <path d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

/** Ver resultados/detalles */
export function EyeIcon({ className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...iconBase} className={className} aria-hidden={ariaHidden}>
      <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

/**
 * X en color de peligro para acciones destructivas.
 * Usa var(--color-danger) en lugar de currentColor para comunicar
 * semánticamente la naturaleza destructiva de la acción.
 */
export function CancelIcon({ className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg
      {...iconBase}
      className={className}
      aria-hidden={ariaHidden}
      style={{ stroke: 'var(--color-danger)' }}
    >
      <path d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

/** Guardar */
export function SaveIcon({ className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...iconBase} className={className} aria-hidden={ariaHidden}>
      <path d="M17.25 3.75H5.25a1.5 1.5 0 00-1.5 1.5v13.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V6.75l-3-3z" />
      <path d="M8.25 3.75v4.5h7.5v-4.5" />
      <path d="M6.75 13.5h10.5v6H6.75z" />
    </svg>
  )
}

/** Ver resultados/estadísticas */
export function ChartIcon({ className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...iconBase} className={className} aria-hidden={ariaHidden}>
      <path d="M3 3v18h18" />
      <path d="M7 16V11M12 16V9M17 16V13" />
    </svg>
  )
}

/** Cerrar encuesta (candado cerrado) */
export function LockIcon({ className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...iconBase} className={className} aria-hidden={ariaHidden}>
      <path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  )
}

/** Reiniciar/resetear */
export function ArrowPathIcon({ className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg
      {...iconBase}
      className={className}
      aria-hidden={ariaHidden}
      style={{ stroke: 'var(--color-warning-dark, #b45309)' }}
    >
      <path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  )
}

/**
 * Abrir encuesta (candado abierto).
 * Usa var(--color-success) para comunicar que la acción es positiva/habilitadora.
 */
export function LockOpenIcon({ className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg
      {...iconBase}
      className={className}
      aria-hidden={ariaHidden}
      style={{ stroke: 'var(--color-success-dark)' }}
    >
      <path d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  )
}