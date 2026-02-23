import { useState, type ReactNode, type FormEvent } from 'react'
import { FilterIcon, ChevronDownIcon } from './Icons' 
import '../styles/common.css'

/**
 * SearchFiltersPanel — Contenedor colapsable para formularios de búsqueda.
 *
 * PROBLEMA QUE RESUELVE:
 * Los formularios de filtros de todas las páginas admin (Usuarios, Eventos,
 * Encuestas, Instrumentos) ocupan mucho espacio vertical incluso cuando el
 * usuario no los necesita activamente. En móvil esto es especialmente grave:
 * el usuario tiene que hacer scroll largo para llegar a los datos.
 *
 * SOLUCIÓN — Panel colapsable con badge de filtros activos:
 * - Por defecto: collapsed (oculto) en móvil, expandido en tablet+
 *   (defaultOpen=true en pantallas grandes).
 * - Cuando hay filtros activos y el panel está cerrado, un badge numérico
 *   indica cuántos filtros están aplicados. Así el usuario sabe que hay
 *   filtros activos aunque no los vea.
 * - El borde inferior cambia a azul cuando hay filtros activos (feedback visual).
 *
 * DECISIÓN — Animación por max-height en lugar de JS:
 * La alternativa "correcta" sería medir la altura real con useRef y
 * asignarla dinámicamente. Max-height tiene el problema de que la transición
 * de "apertura" puede parecer lenta si el valor máximo es muy grande.
 * Para este caso (formularios de filtros con altura máxima ~200-300px)
 * el valor de 9999px es suficiente y la diferencia no es perceptible.
 * Se elige max-height por simplicidad y eliminación de efectos secundarios
 * (un useEffect para medir alturas añade complejidad sin beneficio real aquí).
 *
 * PROPS:
 * @param children          Contenido del formulario de filtros (campos + botones)
 * @param activeFiltersCount Número de filtros activos. Controla el badge y el
 *                           borde de acento. El padre lo calcula contando cuántos
 *                           filtros efectivos son != '' o != undefined.
 * @param title             Texto del header (default: "Filtros de búsqueda")
 * @param defaultOpen       Si el panel empieza abierto (default: false en móvil,
 *                          true en tablet+). Nota: el componente usa un valor
 *                          fijo para simplicidad; el valor responsive correcto
 *                          requeriría matchMedia, que añade complejidad innecesaria.
 * @param actionButton      Botón opcional que aparece a la derecha del header
 *                          (ej: "+ Nuevo usuario"). Se coloca aquí para que
 *                          siempre sea visible, incluso con el panel cerrado.
 * @param onSubmit          Handler del submit del formulario de filtros.
 */
interface SearchFiltersPanelProps {
  children: ReactNode
  activeFiltersCount: number
  title?: string
  defaultOpen?: boolean
  actionButton?: ReactNode
  onSubmit: (e: FormEvent) => void
}

export function SearchFiltersPanel({
  children,
  activeFiltersCount,
  title = 'Filtros de búsqueda',
  defaultOpen = false,
  actionButton,
  onSubmit,
}: SearchFiltersPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const hasFilters = activeFiltersCount > 0

  return (
    <div className={`filter-panel${hasFilters ? ' has-active-filters' : ''}`}>
      {/* Cabecera clicable */}
      <div
        className="filter-panel-header"
        onClick={() => setIsOpen(prev => !prev)}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setIsOpen(prev => !prev) }}
      >
        <div className="filter-panel-header-left">
          <FilterIcon className="filter-chevron" />
          <span className="filter-panel-title">{title}</span>
          {/* Badge: solo visible cuando hay filtros activos */}
          {hasFilters && (
            <span className="filter-badge" title={`${activeFiltersCount} filtro${activeFiltersCount !== 1 ? 's' : ''} activo${activeFiltersCount !== 1 ? 's' : ''}`}>
              {activeFiltersCount}
            </span>
          )}
        </div>

        <div className="filter-panel-header-right">
          {/* El botón de acción (ej: "+ Nuevo") se detiene la propagación
              para que el click no colapse/expanda el panel */}
          {actionButton && (
            <div onClick={e => e.stopPropagation()}>
              {actionButton}
            </div>
          )}
          <ChevronDownIcon className={`filter-chevron${isOpen ? ' open' : ''}`} />
        </div>
      </div>

      {/* Cuerpo colapsable: el formulario de filtros */}
      <div className={`filter-panel-body${isOpen ? ' open' : ''}`}>
        <form onSubmit={onSubmit}>
          {children}
        </form>
      </div>
    </div>
  )
}