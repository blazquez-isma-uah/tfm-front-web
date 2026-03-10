import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { ToastContainer } from './ToastContainer'

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

/**
 * ToastProvider — Envuelve el árbol de la aplicación y expone showToast
 * mediante useToast().
 * 
 * Gestiona el estado de los toasts y renderiza el ToastContainer directamente,
 * fuera de cualquier stacking context problemático.
 * 
 * El id se genera con un ref (no con Math.random) para evitar re-renders
 * innecesarios y mantener estabilidad entre renders.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  // Estado: array de toasts activos. Cada toast tiene id, mensaje, tipo y opcionalmente el flag removing
  const [toasts, setToasts] = useState<Toast[]>([])
  // Ref para generar IDs únicos y estables. No provoca re-renders al cambiar.
  const nextId = useRef(0)
  // Map para guardar los timeouts de cada toast y poder cancelarlos si es necesario
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  // Elimina un toast del estado y limpia su timeout
  const removeToast = useCallback((id: number) => {
    // Cancelamos el timeout pendiente para evitar setState sobre un componente desmontado
    const timerId = timers.current.get(id)
    if (timerId !== undefined) {
      clearTimeout(timerId)
      timers.current.delete(id)
    }
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Marca un toast como "removing" para activar la animación de salida
  const markRemoving = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, removing: true } : t)))
  }, [])

  // Añade un nuevo toast al estado y programa su cierre automático
  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration?: number) => {
      // Duración por defecto: 5s para error/warning, 3s para info/success
      const effectiveDuration = duration ?? (type === 'error' || type === 'warning' ? 5000 : 3000)
      const id = nextId.current++
      setToasts((prev) => [...prev, { id, message, type }])
      // Programamos marcar el toast como removing después de effectiveDuration
      const timerId = setTimeout(() => markRemoving(id), effectiveDuration)
      timers.current.set(id, timerId)
    },
    [markRemoving]
  )

  return (
    <ToastContext.Provider value={{ showToast, markRemoving }}>
      {children}
      <ToastContainer toasts={toasts} onStartClose={markRemoving} onClose={removeToast} />
    </ToastContext.Provider>
  )
}

/**
 * useToast — Accede a showToast desde cualquier componente.
 * 
 * Lanza error si se usa fuera del provider para que el fallo sea inmediato
 * y claro durante el desarrollo.
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast debe usarse dentro de <ToastProvider>')
  }
  return ctx
}