/**
 * ErrorState — Bloque visual para errores de carga persistentes.
 *
 * A diferencia de un toast (feedback transiente de operación), este
 * componente vive en el flujo normal de la página y permanece visible
 * mientras el error no se resuelva. El usuario sabe que hay datos
 * que no se pudieron cargar.
 *
 * onRetry es opcional: si se proporciona, aparece el botón "Reintentar"
 * que permite al usuario volver a disparar la llamada a la API sin
 * recargar la página entera.
 */
type ErrorStateProps = {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="error-state" role="alert">
      <svg
        className="error-state__icon"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M10 6v5M10 13v.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="error-state__message">{message}</span>
      {onRetry && (
        <button className="error-state__retry" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  )
}