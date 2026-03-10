import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { ToastContainer } from '../../components/ToastContainer'

// ─── Tipos públicos ────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export type Toast = {
  id: number
  message: string
  type: ToastType
  removing?: boolean
}

type ToastContextValue = {
  showToast: (message: string, type?: ToastType, duration?: number) => void
  markRemoving: (id: number) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * ToastProvider — Envuelve el árbol de la aplicación y expone showToast
 * a cualquier componente descendiente mediante useToast().
 *
 * Decisión de diseño: el Provider gestiona el estado de los toasts Y
 * renderiza el ToastContainer directamente. Así MainLayout no necesita
 * saber nada del sistema de toasts — el contenedor flotante vive aquí,
 * fuera de cualquier stacking context problemático.
 *
 * El id se genera con un ref (no con Math.random) para evitar re-renders
 * innecesarios y para que el valor sea estable entre renders.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const removeToast = useCallback((id: number) => {
    const timerId = timers.current.get(id)
    if (timerId !== undefined) {
      clearTimeout(timerId)
      timers.current.delete(id)
    }
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const markRemoving = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, removing: true } : t)))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration?: number) => {
      const effectiveDuration = duration ?? (type === 'error' || type === 'warning' ? 5000 : 3000)
      const id = nextId.current++
      setToasts((prev) => [...prev, { id, message, type }])
      const timerId = setTimeout(() => markRemoving(id), effectiveDuration)
      timers.current.set(id, timerId)
    },
    [markRemoving]
  )

  return (
    <ToastContext.Provider value={{ showToast, markRemoving }}>
      {children}
      {/* Renderizado fuera del flujo normal — position: fixed en el componente */}
      <ToastContainer toasts={toasts} onStartClose={markRemoving} onClose={removeToast} />
    </ToastContext.Provider>
  )
}

// ─── Hook público ─────────────────────────────────────────────────────────────

/**
 * useToast — Accede a showToast desde cualquier componente.
 *
 * Lanza un error explícito si se usa fuera del provider para que el
 * fallo sea inmediato y claro durante el desarrollo, en lugar de un
 * "cannot read property of undefined" difícil de rastrear.
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast debe usarse dentro de <ToastProvider>')
  }
  return ctx
}