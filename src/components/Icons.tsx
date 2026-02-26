/**
 * Icons.tsx — Iconos SVG inline reutilizables.
 *
 * DECISIÓN DE DISEÑO: ¿Por qué no usar una librería de iconos (Lucide, HeroIcons)?
 *
 * Las librerías de iconos como Lucide-React tienen entre 1.000 y 5.000 iconos.
 * Esta aplicación usa exactamente 8. Importar la librería entera para 8 iconos
 * añade ~50-100KB al bundle final sin tree-shaking agresivo. Para un TFM
 * que se va a defender, justificar "importé una librería de 1.000 iconos para
 * usar 8" es más difícil que "definí los 8 SVG que necesito, eliminando
 * la dependencia externa".
 *
 * Los SVG son de Heroicons (MIT License, Tailwind Labs) — paths copiados
 * directamente del set de iconos outline 24x24.
 *
 * NOTA: Todos los componentes aceptan className para que el consumidor
 * pueda controlar el tamaño y color vía CSS (width/height/color).
 * El color se hereda del padre via currentColor, salvo excepciones documentadas.
 */

interface IconProps {
  className?: string
  'aria-hidden'?: boolean
}

// Utilidad para el viewBox y atributos comunes
const iconBase = {
  xmlns:         'http://www.w3.org/2000/svg',
  viewBox:       '0 0 24 24',
  fill:          'none',
  stroke:        'currentColor',
  strokeWidth:   1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin:'round' as const,
}

/** ✏️ Lápiz — acción de editar */
export function EditIcon({ className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...iconBase} className={className} aria-hidden={ariaHidden}>
      <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
    </svg>
  )
}

/** 🗑️ Papelera — acción de eliminar */
export function TrashIcon({ className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...iconBase} className={className} aria-hidden={ariaHidden}>
      <path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  )
}

/** ⬇️ Chevron hacia abajo — toggle de panel colapsable */
export function ChevronDownIcon({ className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...iconBase} className={className} aria-hidden={ariaHidden}>
      <path d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

/** 🔍 Embudo — icono de filtros */
export function FilterIcon({ className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...iconBase} className={className} aria-hidden={ariaHidden}>
      <path d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
    </svg>
  )
}

/** ✅ Check — acción de activar/confirmar */
export function CheckIcon({ className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...iconBase} className={className} aria-hidden={ariaHidden}>
      <path d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

/** ✕ XMark — acción neutra de cerrar o desactivar */
export function XMarkIcon({ className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...iconBase} className={className} aria-hidden={ariaHidden}>
      <path d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

/** 👁️ Ojo — ver resultados / detalles */
export function EyeIcon({ className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...iconBase} className={className} aria-hidden={ariaHidden}>
      <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

/**
 * ❌ CancelIcon — X en color de peligro.
 *
 * DIFERENCIA con XMarkIcon:
 * - XMarkIcon hereda currentColor — para acciones neutras (cerrar panel, ocultar)
 * - CancelIcon usa var(--color-danger) explícitamente — para acciones destructivas
 *   o irreversibles (cancelar encuesta, cerrar proceso permanente) donde el color
 *   rojo comunica semánticamente la naturaleza de la acción.
 *
 * Se usa style en lugar de stroke="red" para respetar el sistema de tokens:
 * si --color-danger cambia en design-tokens.css, este icono se actualiza solo.
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

/**
 * 💾 SaveIcon — Disquete, acción de guardar.
 *
 * Tres elementos que componen el disquete:
 *   1. Cuerpo exterior con esquina cortada superior-derecha (forma característica)
 *   2. Etiqueta superior (zona donde va la ranura de escritura)
 *   3. Área de almacenamiento interior inferior
 *
 * Source: Heroicons outline, path 24x24.
 */
export function SaveIcon({ className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...iconBase} className={className} aria-hidden={ariaHidden}>
      <path d="M17.25 3.75H5.25a1.5 1.5 0 00-1.5 1.5v13.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V6.75l-3-3z" />
      <path d="M8.25 3.75v4.5h7.5v-4.5" />
      <path d="M6.75 13.5h10.5v6H6.75z" />
    </svg>
  )
}