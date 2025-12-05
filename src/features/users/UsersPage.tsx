import { type FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { searchUsersPage } from '../../api/usersApi'
import { getAllRoles } from '../../api/rolesApi'
import type { UserDTO } from '../../types/users'
import type { KeycloakRoleResponse } from '../../types/roles'
import { PaginationBar } from '../../components/PaginationBar'
import { DataTable, type SortState } from '../../components/DataTable'

type ViewMode = 'LIST' // en usuarios, de momento solo lista; los formularios vendrán luego

type SortableField = 'username' | 'firstName' | 'lastName' | 'email' | 'active'

function UsersPage() {
    const { token, hasRole } = useAuth()
    const [users, setUsers] = useState<UserDTO[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [page, setPage] = useState(0)
    const [size, setSize] = useState(10)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)

    const isAdmin = hasRole('ADMIN')
    const [mode] = useState<ViewMode>('LIST')

    // filtros visibles en el formulario
    const [filterUsername, setFilterUsername] = useState('')
    const [filterFirstName, setFilterFirstName] = useState('')
    const [filterLastName, setFilterLastName] = useState('')
    const [filterSecondLastName, setFilterSecondLastName] = useState('')
    const [filterEmail, setFilterEmail] = useState('')
    const [filterActive, setFilterActive] = useState<'all' | 'true' | 'false'>('all')
    const [filterRole, setFilterRole] = useState('') // name del rol o '' para todos
    // filtros efectivos (los que usa la llamada; solo cambian al darle a Buscar)
    const [searchUsername, setSearchUsername] = useState('')
    const [searchFirstName, setSearchFirstName] = useState('')
    const [searchLastName, setSearchLastName] = useState('')
    const [searchSecondLastName, setSearchSecondLastName] = useState('')
    const [searchEmail, setSearchEmail] = useState('')
    const [searchActive, setSearchActive] = useState<boolean | undefined>(undefined)
    const [searchRoleName, setSearchRoleName] = useState<string | undefined>(undefined)

    // ordenación
    const [sortField, setSortField] = useState<SortableField | null>(null)
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

    // roles disponibles
    const [roles, setRoles] = useState<KeycloakRoleResponse[]>([])
    const [rolesLoading, setRolesLoading] = useState(false)

    const sortState: SortState<SortableField> = {
        field: sortField,
        direction: sortDirection,
    }

    // columnas
    const userColumns = [
        {
            key: 'username',
            header: 'Username',
            sortable: true,
            sortField: 'username' as SortableField,
        },
        {
            key: 'firstName',
            header: 'Nombre',
            sortable: true,
            sortField: 'firstName' as SortableField,
        },
        {
            key: 'lastName',
            header: 'Apellidos',
            sortable: true,
            sortField: 'lastName' as SortableField,
            render: (u: UserDTO) =>
                [u.lastName, u.secondLastName].filter(Boolean).join(' '),
        },
        {
            key: 'email',
            header: 'Email',
            sortable: true,
            sortField: 'email' as SortableField,
        },
        {
            key: 'active',
            header: 'Activo',
            sortable: true,
            sortField: 'active' as SortableField,
            render: (u: UserDTO) => (u.active ? 'Sí' : 'No'),
        },
        {
            key: 'roles',
            header: 'Roles',
            sortable: false,
            render: (u: UserDTO) => (u.roles ?? []).join(', '),
        },
    ]

    // Cargar roles una vez al montar la página (por sesión de vista)
    useEffect(() => {
        if (!token || !isAdmin) return

        const loadRoles = async () => {
            try {
                setRolesLoading(true)
                const data = await getAllRoles(token)
                setRoles(data)
            } catch (e) {
                console.error('Error loading roles', e)
                // No rompe la UI si falla; simplemente el combo se quedará vacío
            } finally {
                setRolesLoading(false)
            }
        }
        loadRoles()
    }, [token, isAdmin])

    useEffect(() => {
        if (!token || !isAdmin) return

        const load = async () => {
            setLoading(true)
            setError(null)
            try {
                const sort = sortField != null ? [`${sortField},${sortDirection}`] : undefined
                const data = await searchUsersPage(
                    {
                        page,
                        size,
                        username: searchUsername || undefined,
                        firstName: searchFirstName || undefined,
                        lastName: searchLastName || undefined,
                        secondLastName: searchSecondLastName || undefined,
                        email: searchEmail || undefined,
                        active: searchActive,
                        roleName: searchRoleName,
                        sort,
                    },
                    token,
                )
                setUsers(data.content ?? [])
                setTotalPages(data.totalPages ?? 1)
                setTotalElements(data.totalElements ?? 0)
            } catch (e: any) {
                console.error('Error en getUsersPage (detallado):', e)
                console.error('Response:', e?.response)
                setError('Error cargando usuarios')
            } finally {
                setLoading(false)
            }
        }

        load()
    }, [token, isAdmin, page, size, searchUsername, searchFirstName, searchLastName, searchSecondLastName,
        searchEmail, searchActive, searchRoleName, sortField, sortDirection])

    if (!isAdmin) {
        return (
            <div>
                <h1>Gestión de usuarios</h1>
                <p>No tienes permisos para ver esta sección.</p>
            </div>
        )
    }

    // ---- helpers de UI ----
    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault()
        setPage(0)

        setSearchUsername(filterUsername.trim())
        setSearchFirstName(filterFirstName.trim())
        setSearchLastName(filterLastName.trim())
        setSearchSecondLastName(filterSecondLastName.trim())
        setSearchEmail(filterEmail.trim())

        if (filterActive === 'all') {
            setSearchActive(undefined)
        } else if (filterActive === 'true') {
            setSearchActive(true)
        } else {
            setSearchActive(false)
        }

        const roleTrim = filterRole.trim()
        setSearchRoleName(roleTrim === '' ? undefined : roleTrim)
    }

    const handleSort = (field: SortableField) => {
        setPage(0)
        if (sortField === field) {
            // misma columna → alternar asc/desc
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
        } else {
            // nueva columna → empezar por asc
            setSortField(field)
            setSortDirection('asc')
        }
    }

    const handlePageChange = (newPage: number) => setPage(newPage)
    const handlePageSizeChange = (newSize: number) => {
        setSize(newSize)
        setPage(0)
    }


    // ----- render -----

    return (
        <div>
            <h1>Gestión de usuarios</h1>

            {/* Formulario de búsqueda */}
            <form
                onSubmit={handleSearchSubmit}
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '0.5rem',
                    alignItems: 'center',
                    marginBottom: '1rem',
                }}
            >
                <input
                    type="text"
                    placeholder="Username"
                    value={filterUsername}
                    onChange={(e) => setFilterUsername(e.target.value)}
                    style={{ padding: '0.4rem 0.6rem' }}
                />
                <input
                    type="text"
                    placeholder="Nombre"
                    value={filterFirstName}
                    onChange={(e) => setFilterFirstName(e.target.value)}
                    style={{ padding: '0.4rem 0.6rem' }}
                />
                <input
                    type="text"
                    placeholder="1er apellido"
                    value={filterLastName}
                    onChange={(e) => setFilterLastName(e.target.value)}
                    style={{ padding: '0.4rem 0.6rem' }}
                />
                <input
                    type="text"
                    placeholder="2º apellido"
                    value={filterSecondLastName}
                    onChange={(e) => setFilterSecondLastName(e.target.value)}
                    style={{ padding: '0.4rem 0.6rem' }}
                />
                <input
                    type="text"
                    placeholder="Email"
                    value={filterEmail}
                    onChange={(e) => setFilterEmail(e.target.value)}
                    style={{ padding: '0.4rem 0.6rem' }}
                />
                <select
                    value={filterActive}
                    onChange={(e) => setFilterActive(e.target.value as 'all' | 'true' | 'false')}
                    style={{ padding: '0.4rem 0.6rem' }}
                >
                    <option value="all">Todos</option>
                    <option value="true">Activos</option>
                    <option value="false">Inactivos</option>
                </select>
                <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    style={{ padding: '0.4rem 0.6rem' }}
                    disabled={rolesLoading}
                >
                    <option value="">Rol (todos)</option>
                    {roles.map((r) => (
                        <option key={r.id} value={r.name}>
                            {r.name}
                        </option>
                    ))}
                </select>

                <div
                    style={
                        {
                            display: 'flex',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                        }}
                >
                    <button type="submit">Buscar</button>
                </div>
            </form>

            {loading && <p>Cargando usuarios...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {mode === 'LIST' && !loading && !error && (
                <>
                    <DataTable<UserDTO, SortableField>
                        columns={userColumns}
                        data={users}
                        sortState={sortState}
                        onSortChange={handleSort}
                    />
                    <PaginationBar
                        page={page}
                        totalPages={totalPages}
                        pageSize={size}
                        currentCount={users.length}
                        totalElements={totalElements}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                    />
                </>
            )}
        </div>
    )
}

export default UsersPage
