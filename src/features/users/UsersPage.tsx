import { type FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import {
    searchUsersPage, getUserById, updateUser, enableUser, disableUser,
    deleteUser, type UserUpdatePayload,
} from '../../api/usersApi'

import { getAllRoles } from '../../api/rolesApi'
import type { UserDTO } from '../../types/users'
import type { KeycloakRoleResponse } from '../../types/roles'
import { PaginationBar } from '../../components/PaginationBar'
import { DataTable, type SortState } from '../../components/DataTable'
import { formatDate } from '../../utils/date'

type ViewMode = 'LIST' | 'DETAIL' | 'EDIT'

type SortableField = 'username' | 'firstName' | 'lastName' | 'email' | 'active'

function UsersPage() {
    const { token, hasRole } = useAuth()
    const isAdmin = hasRole('ADMIN')

    const [users, setUsers] = useState<UserDTO[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [page, setPage] = useState(0)
    const [size, setSize] = useState(10)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)

    const [mode, setMode] = useState<ViewMode>('LIST')
    const [selectedUser, setSelectedUser] = useState<UserDTO | null>(null)
    const [saving, setSaving] = useState(false)

    // filtros visibles
    const [filterUsername, setFilterUsername] = useState('')
    const [filterFirstName, setFilterFirstName] = useState('')
    const [filterLastName, setFilterLastName] = useState('')
    const [filterSecondLastName, setFilterSecondLastName] = useState('')
    const [filterEmail, setFilterEmail] = useState('')
    const [filterActive, setFilterActive] = useState<'all' | 'true' | 'false'>('all')
    const [filterRole, setFilterRole] = useState('')

    // filtros efectivos
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

    const sortState: SortState<SortableField> = {
        field: sortField,
        direction: sortDirection,
    }

    // roles disponibles
    const [roles, setRoles] = useState<KeycloakRoleResponse[]>([])
    const [rolesLoading, setRolesLoading] = useState(false)

    // estado del formulario de edición
    const [editPayload, setEditPayload] = useState<UserUpdatePayload>({
        email: '',
        firstName: '',
        lastName: '',
        secondLastName: '',
        birthDate: '',
        bandJoinDate: '',
        phone: '',
        notes: '',
        profilePictureUrl: '',
    })

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
        {
            key: 'actions',
            header: 'Acciones',
            sortable: false,
            render: (u: UserDTO) => (
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => handleViewDetails(u)}>
                        Ver
                    </button>
                    <button type="button" onClick={() => handleEditUser(u)}>
                        Editar
                    </button>
                    <button type="button" onClick={() => handleToggleActive(u)}>
                        {u.active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                        type="button"
                        style={{ color: 'red' }}
                        onClick={() => handleDeleteUser(u)}
                    >
                        Eliminar
                    </button>
                </div>
            ),
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

        // siempre que lanzamos una búsqueda, volvemos a LIST
        setMode('LIST')
        setSelectedUser(null)
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

    const handleViewDetails = (user: UserDTO) => {
        setSelectedUser(user)
        setMode('DETAIL')
    }

    const handleEditUser = (user: UserDTO) => {
        setSelectedUser(user)
        setEditPayload({
            email: user.email ?? '',
            firstName: user.firstName ?? '',
            lastName: user.lastName ?? '',
            secondLastName: user.secondLastName ?? '',
            birthDate: user.birthDate ?? '',
            bandJoinDate: user.bandJoinDate ?? '',
            phone: user.phone ?? '',
            notes: user.notes ?? '',
            profilePictureUrl: user.profilePictureUrl ?? '',
        })
        setMode('EDIT')
    }

    const handleCancelDetailOrEdit = () => {
        setMode('LIST')
        setSelectedUser(null)
    }

    const handleEditFieldChange = (
        field: keyof UserUpdatePayload,
        value: string,
    ) => {
        setEditPayload((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    const handleSaveEdit = async (e: FormEvent) => {
        e.preventDefault()
        if (!selectedUser || !selectedUser.id || selectedUser.version == null) return
        if (!token) return

        setSaving(true)
        setError(null)
        try {
            const updated = await updateUser(
                selectedUser.id,
                {
                    ...editPayload,
                    // limpiar strings vacíos a undefined para no enviar basura si no quieres
                    secondLastName: editPayload.secondLastName || undefined,
                    birthDate: editPayload.birthDate || undefined,
                    bandJoinDate: editPayload.bandJoinDate || undefined,
                    phone: editPayload.phone || undefined,
                    notes: editPayload.notes || undefined,
                    profilePictureUrl: editPayload.profilePictureUrl || undefined,
                },
                selectedUser.version,
                token,
            )

            setUsers((prev) =>
                prev.map((u) => (u.id === updated.id ? updated : u)),
            )
            setSelectedUser(updated)
            setMode('LIST')
        } catch (e: any) {
            console.error('Error actualizando usuario:', e)
            setError('Error actualizando usuario')
        } finally {
            setSaving(false)
        }
    }

    const handleToggleActive = async (user: UserDTO) => {
        if (!user.id || user.version == null || !token) return

        const action = user.active ? 'desactivar' : 'activar'
        const confirmMsg = `¿Seguro que quieres ${action} al usuario "${user.username}"?`
        if (!window.confirm(confirmMsg)) return

        try {
            setError(null)
            if (user.active) {
                await disableUser(user.id, user.version, token)
            } else {
                await enableUser(user.id, user.version, token)
            }

            // después de enable/disable, recargamos solo ese usuario para tener versión y estado nuevos
            const refreshed = await getUserById(user.id, token)
            setUsers((prev) =>
                prev.map((u) => (u.id === refreshed.id ? refreshed : u)),
            )

            if (selectedUser && selectedUser.id === refreshed.id) {
                setSelectedUser(refreshed)
            }
        } catch (e: any) {
            console.error('Error cambiando activo/inactivo:', e)
            setError('Error al cambiar el estado activo del usuario')
        }
    }

    const handleDeleteUser = async (user: UserDTO) => {
        if (!user.id || user.version == null || !token) return

        const confirmMsg = `¿Seguro que quieres eliminar al usuario "${user.username}"? Esta acción no se puede deshacer.`
        if (!window.confirm(confirmMsg)) return

        try {
            setError(null)
            await deleteUser(user.id, user.version, token)

            // decisión sencilla: recargar desde la primera página para evitar líos de paginación
            setPage(0)
            setMode('LIST')
            if (selectedUser && selectedUser.id === user.id) {
                setSelectedUser(null)
            }
        } catch (e: any) {
            console.error('Error eliminando usuario:', e)
            setError('Error eliminando usuario')
        }
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

            {/* LISTA */}
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

            {/* DETALLE */}
            {mode === 'DETAIL' && selectedUser && (
                <div
                    style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #e5e7eb',
                        background: '#ffffff',
                    }}
                >
                    <h2>Detalle de usuario</h2>
                    <p>
                        <strong>Username:</strong> {selectedUser.username}
                    </p>
                    <p>
                        <strong>Nombre:</strong> {selectedUser.firstName}
                    </p>
                    <p>
                        <strong>Apellidos:</strong>{' '}
                        {[selectedUser.lastName, selectedUser.secondLastName]
                            .filter(Boolean)
                            .join(' ')}
                    </p>
                    <p>
                        <strong>Email:</strong> {selectedUser.email}
                    </p>
                    <p>
                        <strong>Activo:</strong> {selectedUser.active ? 'Sí' : 'No'}
                    </p>
                    <p>
                        <strong>Roles:</strong> {(selectedUser.roles ?? []).join(', ')}
                    </p>
                    <p>
                        <strong>Instrumentos:</strong>{' '}
                        {(selectedUser.instruments ?? []).join(', ')}
                    </p>
                    <p>
                        <strong>Fecha nacimiento:</strong> {formatDate(selectedUser.birthDate)}
                    </p>
                    <p>
                        <strong>Alta en banda:</strong>{' '}
                        {formatDate(selectedUser.bandJoinDate)}
                    </p>
                    <p>
                        <strong>Alta en sistema:</strong>{' '}
                        {formatDate(selectedUser.systemSignupDate)}
                    </p>
                    <p>
                        <strong>Teléfono:</strong> {selectedUser.phone || '-'}
                    </p>
                    <p>
                        <strong>Notas:</strong> {selectedUser.notes || '-'}
                    </p>

                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                        <button type="button" onClick={handleCancelDetailOrEdit}>
                            Volver a la lista
                        </button>
                        <button type="button" onClick={() => handleEditUser(selectedUser)}>
                            Editar
                        </button>
                    </div>
                </div>
            )}

            {/* EDICIÓN */}
            {mode === 'EDIT' && selectedUser && (
                <form
                    onSubmit={handleSaveEdit}
                    style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #e5e7eb',
                        background: '#ffffff',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '0.75rem',
                    }}
                >
                    <h2 style={{ gridColumn: '1 / -1' }}>
                        Editar usuario: {selectedUser.username}
                    </h2>

                    <label>
                        Email *
                        <input
                            type="email"
                            value={editPayload.email}
                            onChange={(e) => handleEditFieldChange('email', e.target.value)}
                            required
                        />
                    </label>

                    <label>
                        Nombre *
                        <input
                            type="text"
                            value={editPayload.firstName}
                            onChange={(e) =>
                                handleEditFieldChange('firstName', e.target.value)
                            }
                            required
                        />
                    </label>

                    <label>
                        1er apellido *
                        <input
                            type="text"
                            value={editPayload.lastName}
                            onChange={(e) =>
                                handleEditFieldChange('lastName', e.target.value)
                            }
                            required
                        />
                    </label>

                    <label>
                        2º apellido
                        <input
                            type="text"
                            value={editPayload.secondLastName ?? ''}
                            onChange={(e) =>
                                handleEditFieldChange('secondLastName', e.target.value)
                            }
                        />
                    </label>

                    <label>
                        Fecha nacimiento
                        <input
                            type="date"
                            value={editPayload.birthDate ?? ''}
                            onChange={(e) =>
                                handleEditFieldChange('birthDate', e.target.value)
                            }
                        />
                    </label>

                    <label>
                        Alta en banda
                        <input
                            type="date"
                            value={editPayload.bandJoinDate ?? ''}
                            onChange={(e) =>
                                handleEditFieldChange('bandJoinDate', e.target.value)
                            }
                        />
                    </label>

                    <label>
                        Teléfono
                        <input
                            type="text"
                            value={editPayload.phone ?? ''}
                            onChange={(e) => handleEditFieldChange('phone', e.target.value)}
                        />
                    </label>

                    <label style={{ gridColumn: '1 / -1' }}>
                        Notas
                        <textarea
                            rows={3}
                            value={editPayload.notes ?? ''}
                            onChange={(e) => handleEditFieldChange('notes', e.target.value)}
                        />
                    </label>

                    <label style={{ gridColumn: '1 / -1' }}>
                        URL foto de perfil
                        <input
                            type="text"
                            value={editPayload.profilePictureUrl ?? ''}
                            onChange={(e) =>
                                handleEditFieldChange('profilePictureUrl', e.target.value)
                            }
                        />
                    </label>

                    <div
                        style={{
                            gridColumn: '1 / -1',
                            display: 'flex',
                            gap: '0.5rem',
                            marginTop: '0.5rem',
                        }}
                    >
                        <button type="submit" disabled={saving}>
                            {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button
                            type="button"
                            onClick={handleCancelDetailOrEdit}
                            disabled={saving}
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}

export default UsersPage
