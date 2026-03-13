import { useEffect } from 'react'
import '../styles/common.css'

/**
 * ConfirmDialog — Modal de confirmación accesible para acciones críticas.
 * 
 * Implementa el patrón de diálogo modal con gestión completa de foco:
 * - Cierre con Escape
 * - Bloqueo de scroll del body mientras está abierto
 * - Trap de foco (Tab/Shift+Tab circulan solo dentro del modal)
 * - Restauración del foco al elemento previo al cerrar
 * 
 * @param variant Define el estilo visual (danger=rojo, warning=amarillo, info=azul)
 */
interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Efecto 1: Gestión de cierre con Escape y bloqueo de scroll del body.
  // Se ejecuta cada vez que isOpen o onCancel cambian.
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      // Solo cerramos si el modal está abierto, evitamos cerrar otros modales
      if (e.key === 'Escape' && isOpen) {
        onCancel()
      }
    }

    if (isOpen) {
      // Registramos el listener a nivel de documento para capturar Escape
      // desde cualquier elemento dentro del modal
      document.addEventListener('keydown', handleEscape)
      // Bloqueamos el scroll del body para que el usuario no pueda scrollear
      // el contenido de fondo mientras el modal está activo
      document.body.style.overflow = 'hidden'
    }

    // Cleanup: se ejecuta cuando el modal se cierra o antes de volver a ejecutar el efecto.
    // Crucial para evitar memory leaks y restaurar el comportamiento del scroll.
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onCancel])

  // Efecto 2: Focus trap — impide que Tab/Shift+Tab escapen del modal.
  // Esto es esencial para accesibilidad: los usuarios de teclado deben permanecer
  // dentro del contexto del modal hasta que lo cierren explícitamente.
  useEffect(() => {
    if (!isOpen) return

    // Encuentra todos los elementos focusables dentro del modal.
    // Solo consideramos elementos que no estén deshabilitados.
    const getFocusable = () => {
      const dialog = document.querySelector('[role="dialog"]')
      if (!dialog) return []
      return Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => !el.hasAttribute('disabled'))
    }

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const focusable = getFocusable()
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      // Shift+Tab desde el primer elemento → salta al último (cierra el círculo)
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        // Tab desde el último elemento → salta al primero (cierra el círculo)
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
  }, [isOpen])

  // Efecto 3: Restauración del foco al cerrar el modal.
  // Guardamos el elemento que tenía el foco antes de abrir el modal.
  // Al cerrar (cleanup), devolvemos el foco a ese elemento para que el usuario
  // de teclado continúe donde lo dejó, sin perderse en la página.
  useEffect(() => {
    if (!isOpen) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    return () => {
      // El cleanup se ejecuta cuando isOpen cambia de true a false
      previouslyFocused?.focus()
    }
  }, [isOpen])

  // Si el modal no está abierto, no renderizamos nada
  if (!isOpen) return null

  return (
    // Overlay: cubre toda la pantalla y cierra el modal si se hace click fuera
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-content"
        // stopPropagation evita que el click dentro del modal lo cierre
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        // aria-labelledby vincula el título con el diálogo para lectores de pantalla
        aria-labelledby="confirm-dialog-title"
      >
        <div className="modal-header">
          <h3 className="modal-title" id="confirm-dialog-title">{title}</h3>
        </div>
        <div className="modal-body">
          <p className="modal-message">{message}</p>
        </div>
        <div className="modal-footer">
          {/* Botón de cancelar: siempre con estilo subtle (gris) */}
          <button
            type="button"
            className="button-subtle"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          {/* Botón de confirmar: estilo según variant (danger=rojo, warning=amarillo, info=azul).
              autoFocus hace que este botón reciba el foco al abrir el modal. */}
          <button
            type="button"
            className={variant === 'danger' ? 'button-danger' : variant === 'warning' ? 'button-warning' : 'button-primary'}
            onClick={onConfirm}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
