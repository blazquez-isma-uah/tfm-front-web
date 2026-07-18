import type { FormEvent, ReactNode } from 'react'
import type { RoleResponse } from '../../types/roles'
import { SearchFiltersPanel } from '../../components/SearchFiltersPanel'

interface UserFiltersPanelProps {
    // Valores del formulario (lo que el usuario ve mientras edita)
    filterUsername: string
    setFilterUsername: (v: string) => void
    filterEmail: string
    setFilterEmail: (v: string) => void
    filterActive: 'all' | 'true' | 'false'
    setFilterActive: (v: 'all' | 'true' | 'false') => void
    filterRole: string
    setFilterRole: (v: string) => void
    filterFirstName: string
    setFilterFirstName: (v: string) => void
    filterLastName: string
    setFilterLastName: (v: string) => void
    filterSecondLastName: string
    setFilterSecondLastName: (v: string) => void
    filterBirthDateFrom: string
    setFilterBirthDateFrom: (v: string) => void
    filterBirthDateTo: string
    setFilterBirthDateTo: (v: string) => void
    filterBandJoinDateFrom: string
    setFilterBandJoinDateFrom: (v: string) => void
    filterBandJoinDateTo: string
    setFilterBandJoinDateTo: (v: string) => void
    // Opciones de los selectores (cargadas de la API en UsersPage)
    roles: RoleResponse[]
    rolesLoading: boolean
    // Metadatos del panel
    activeFiltersCount: number
    onSubmit: (e: FormEvent) => void
    onReset: () => void
    actionButton?: ReactNode
}

/**
 * UserFiltersPanel — Formulario de filtros de búsqueda para usuarios.
 *
 * RESPONSABILIDAD:
 * Renderiza el formulario completo de filtros de usuarios (username, email,
 * estado, rol, nombre/apellidos y dos rangos de fechas) envuelto en
 * SearchFiltersPanel para obtener comportamiento colapsable y badge de activos.
 *
 * DECISIONES DE DISEÑO:
 * - Presentacional controlado: todo el estado viene del padre; este componente
 *   no gestiona estado propio ni llama a la API.
 * - activeFiltersCount lo calcula el padre sobre los search* (filtros aplicados),
 *   no sobre los filter* (lo que el usuario está editando), igual que en el
 *   resto de FiltersPanel del sistema.
 * - Rangos de fecha: search-date-group envuelve a search-date-row (un grupo
 *   por campo de fecha, cada uno con su fila desde/hasta) -- mismo anidamiento
 *   que EventFiltersPanel y SurveyFiltersPanel, para layout horizontal
 *   consistente entre las tres páginas.
 */
export function UserFiltersPanel({
    filterUsername,         setFilterUsername,
    filterEmail,             setFilterEmail,
    filterActive,            setFilterActive,
    filterRole,              setFilterRole,
    filterFirstName,         setFilterFirstName,
    filterLastName,          setFilterLastName,
    filterSecondLastName,    setFilterSecondLastName,
    filterBirthDateFrom,     setFilterBirthDateFrom,
    filterBirthDateTo,       setFilterBirthDateTo,
    filterBandJoinDateFrom,  setFilterBandJoinDateFrom,
    filterBandJoinDateTo,    setFilterBandJoinDateTo,
    roles,
    rolesLoading,
    activeFiltersCount,
    onSubmit,
    onReset,
    actionButton,
}: UserFiltersPanelProps) {
    return (
        <SearchFiltersPanel
            activeFiltersCount={activeFiltersCount}
            onSubmit={onSubmit}
            actionButton={actionButton}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.5rem', width: '100%' }}>
                <div className="search-grid">
                    <div className="form-field">
                        <span className="label-text">Username</span>
                        <input type="text" placeholder="Buscar por username" value={filterUsername} onChange={e => setFilterUsername(e.target.value)} className="input-full-width" />
                    </div>
                    <div className="form-field">
                        <span className="label-text">Email</span>
                        <input type="text" placeholder="Buscar por email" value={filterEmail} onChange={e => setFilterEmail(e.target.value)} className="input-full-width" />
                    </div>
                    <div className="form-field">
                        <span className="label-text">Estado</span>
                        <select value={filterActive} onChange={e => setFilterActive(e.target.value as 'all' | 'true' | 'false')} className="select-base">
                            <option value="all">Todos</option>
                            <option value="true">Activos</option>
                            <option value="false">Inactivos</option>
                        </select>
                    </div>
                    <div className="form-field">
                        <span className="label-text">Rol</span>
                        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="select-base" disabled={rolesLoading}>
                            <option value="">Todos</option>
                            {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="search-grid">
                    <div className="form-field">
                        <span className="label-text">Nombre</span>
                        <input type="text" placeholder="Nombre" value={filterFirstName} onChange={e => setFilterFirstName(e.target.value)} className="input-full-width" />
                    </div>
                    <div className="form-field">
                        <span className="label-text">1er apellido</span>
                        <input type="text" placeholder="Primer apellido" value={filterLastName} onChange={e => setFilterLastName(e.target.value)} className="input-full-width" />
                    </div>
                    <div className="form-field">
                        <span className="label-text">2º apellido</span>
                        <input type="text" placeholder="Segundo apellido" value={filterSecondLastName} onChange={e => setFilterSecondLastName(e.target.value)} className="input-full-width" />
                    </div>
                </div>

                {/* Rangos de fecha: mismo anidamiento que EventFiltersPanel/SurveyFiltersPanel
                    -- search-date-group envuelve a search-date-row, no al revés. */}
                <div className="search-date-group">
                    <div className="search-date-row">
                        <div className="form-field">
                            <span className="label-text">Nacimiento (desde)</span>
                            <input type="date" value={filterBirthDateFrom} onChange={e => setFilterBirthDateFrom(e.target.value)} className="input-full-width" />
                        </div>
                        <div className="form-field">
                            <span className="label-text">Nacimiento (hasta)</span>
                            <input type="date" value={filterBirthDateTo} onChange={e => setFilterBirthDateTo(e.target.value)} className="input-full-width" />
                        </div>
                    </div>
                    <div className="search-date-row">
                        <div className="form-field">
                            <span className="label-text">Alta en banda (desde)</span>
                            <input type="date" value={filterBandJoinDateFrom} onChange={e => setFilterBandJoinDateFrom(e.target.value)} className="input-full-width" />
                        </div>
                        <div className="form-field">
                            <span className="label-text">Alta en banda (hasta)</span>
                            <input type="date" value={filterBandJoinDateTo} onChange={e => setFilterBandJoinDateTo(e.target.value)} className="input-full-width" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="search-actions-row" style={{ justifyContent: 'space-between' }}>
                <button type="button" className="button-subtle" onClick={onReset}
                    style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>
                    Resetear filtros
                </button>
                <button type="submit" className="button-primary">Buscar</button>
            </div>
        </SearchFiltersPanel>
    )
}