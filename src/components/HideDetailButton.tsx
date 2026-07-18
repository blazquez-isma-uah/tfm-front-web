import { XMarkIcon } from './Icons'

interface HideDetailButtonProps {
  onClick: () => void
}

/**
 * HideDetailButton — botón que oculta/cierra una vista de detalle expandida.
 * Icono siempre visible; el texto "Ocultar" solo se muestra desde md (768px)
 * para no comprimir el título de la cabecera en móvil.
 */
export function HideDetailButton({ onClick }: HideDetailButtonProps) {
  return (
    <button type="button" className="button-secondary" onClick={onClick} aria-label="Ocultar">
      <XMarkIcon />
      <span className="hide-detail-button__label">Ocultar</span>
    </button>
  )
}
