/**
 * Spinner — Indicador de carga genérico.
 *
 * Dos variantes de tamaño:
 *   - 'sm': para estados de carga dentro de botones o campos (16px)
 *   - 'md': para estados de carga de secciones o páginas (32px) — por defecto
 *
 * El role="status" con aria-label hace que los lectores de pantalla
 * anuncien "Cargando..." sin necesidad de texto visible.
 */

type SpinnerProps = {
  size?: 'sm' | 'md'
  label?: string
}

export function Spinner({ size = 'md', label = 'Cargando...' }: SpinnerProps) {
  return (
    <div className={`spinner-wrap spinner-wrap--${size}`} role="status" aria-label={label}>
      <div className="spinner" />
      <span className="spinner-label">{label}</span>
    </div>
  )
}