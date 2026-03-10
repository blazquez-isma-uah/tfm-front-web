import { useState, type ReactNode, type FormEvent } from 'react'
import { FilterIcon, ChevronDownIcon } from './Icons' 
import '../styles/common.css'

/**
 * SearchFiltersPanel — Contenedor colapsable para formularios de búsqueda.
 * 
 * Por defecto collapsed en móvil, expandido en tablet+. Cuando hay filtros activos
 * y el panel está cerrado, un badge numérico indica cuántos filtros están aplicados.
 * El borde inferior cambia a azul cuando hay filtros activos (feedback visual).
 * 
 * La animación usa max-height en lugar de medir la altura real con useRef para
 * simplicidad. Para formularios de ~200-300px el valor de 9999px es suficiente y
 * la diferencia no es perceptible.
 * 
 * @param activeFiltersCount Número de filtros activos. Controla el badge y el borde.
 *                           El padre lo calcula contando filtros efectivos != '' o != undefined.
 * @param actionButton Botón opcional (ej: "+ Nuevo") que aparece en el header,
 *                     visible incluso con el panel cerrado.
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
          {/* Badge numérico: solo visible cuando hay filtros activos */}
          {hasFilters && (
            <span className="filter-badge" title={`${activeFiltersCount} filtro${activeFiltersCount !== 1 ? 's' : ''} activo${activeFiltersCount !== 1 ? 's' : ''}`}>
              {activeFiltersCount}
            </span>
          )}
        </div>

        <div className="filter-panel-header-right">
          {/* El botón de acción (ej: "+ Nuevo") detiene la propagación del click
              para que no colapse/expanda el panel al hacer click en él */}
          {actionButton && (
            <div onClick={e => e.stopPropagation()}>
              {actionButton}
            </div>
          )}
          {/* Chevron que rota cuando el panel está abierto (transición CSS) */}
          <ChevronDownIcon className={`filter-chevron${isOpen ? ' open' : ''}`} />
        </div>
      </div>

      {/* Cuerpo colapsable: usa max-height con transición CSS para animación.
          El valor 9999px es suficiente para formularios de hasta ~300px de altura. */}
      <div className={`filter-panel-body${isOpen ? ' open' : ''}`}>
        <form onSubmit={onSubmit}>
          {children}
        </form>
      </div>
    </div>
  )
}