import { useEffect, type JSX } from 'react'
import type { Toast } from './ToastContext'

const icons: Record<Toast['type'], JSX.Element> = {
  success: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 6l4 4M10 6l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2L14 13H2L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 6v3M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7v4M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
}

// ─── Componente ───────────────────────────────────────────────────────────────

type ToastContainerProps = {
  toasts: Toast[]
  onStartClose: (id: number) => void
  onClose: (id: number) => void
}

/**
 * ToastContainer — Renderiza la lista de toasts activos.
 *
 * Es un componente puramente presentacional: no gestiona estado ni timers.
 * Toda la lógica vive en ToastProvider.
 *
 * Posicionamiento:
 * - Móvil (< 480px): centrado en la parte inferior de la pantalla
 * - Desktop (≥ 480px): esquina inferior derecha
 * Esto sigue el patrón de iOS/Android en móvil y de apps web en desktop.
 *
 * El role="status" con aria-live="polite" hace que los lectores de pantalla
 * anuncien los nuevos toasts sin interrumpir al usuario.
 */
function ToastItem({ 
  toast, 
  onStartClose, 
  onClose 
}: { 
  toast: Toast
  onStartClose: (id: number) => void
  onClose: (id: number) => void
}) {
  // Efecto: cuando el toast se marca como removing, esperamos 200ms (duración de la animación CSS)
  // antes de eliminarlo completamente del DOM
  useEffect(() => {
    if (toast.removing) {
      const id = setTimeout(() => onClose(toast.id), 200)
      return () => clearTimeout(id)
    }
  }, [toast.removing, toast.id, onClose])

  return (
    <div
      key={toast.id}
      className={`toast toast--${toast.type}${toast.removing ? ' toast--removing' : ''}`}
      role="alert"
    >
      <span className="toast__icon">{icons[toast.type]}</span>
      <span className="toast__message">{toast.message}</span>
      <button
        className="toast__close"
        onClick={() => onStartClose(toast.id)}
        aria-label="Cerrar notificación"
      >
        ×
      </button>
    </div>
  )
}

export function ToastContainer({ toasts, onStartClose, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div
      className="toast-container"
      role="status"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onStartClose={onStartClose}
          onClose={onClose}
        />
      ))}
    </div>
  )
}