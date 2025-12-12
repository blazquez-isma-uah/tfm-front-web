import { type FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import {
    searchUsersPage,
    getUserById,
    updateUser,
    enableUser,
    disableUser,
    deleteUser,
    type UserUpdatePayload,
    createUser,
    type UserCreatePayload,
    setUserRoles,
} from '../../api/usersApi'
import { getAllInstruments, setUserInstruments } from '../../api/instrumentsApi'
import type { InstrumentDTO } from '../../types/instruments'
import { getAllRoles } from '../../api/rolesApi'
import type { UserDTO } from '../../types/users'
import type { KeycloakRoleResponse } from '../../types/roles'
import { PaginationBar } from '../../components/PaginationBar'
import { DataTable, type SortState } from '../../components/DataTable'
import { formatDate } from '../../utils/date'
import {
    groupInstrumentsByInitial,
    type InstrumentGroup,
} from '../../utils/instrumentUtils'
import '../../styles/common.css'

type ViewMode = 'LIST' | 'DETAIL' | 'EDIT' | 'CREATE'

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

    // Gestión de instrumentos
    const [allGroupedInstruments, setAllGroupedInstruments] = useState<
        InstrumentGroup[]
    >([])
    const [instrumentsLoading, setInstrumentsLoading] = useState(false)
    const [managingInstruments, setManagingInstruments] = useState(false)
    const [selectedInstrumentIds, setSelectedInstrumentIds] = useState<number[]>(
        [],
    )

    // Gestión de roles
    const [managingRoles, setManagingRoles] = useState(false)
    const [selectedRoleNames, setSelectedRoleNames] = useState<string[]>([])

    // filtros visibles
    const [filterUsername, setFilterUsername] = useState('')
    const [filterFirstName, setFilterFirstName] = useState('')
    const [filterLastName, setFilterLastName] = useState('')
    const [filterSecondLastName, setFilterSecondLastName] = useState('')
    const [filterEmail, setFilterEmail] = useState('')
    const [filterActive, setFilterActive] = useState<'all' | 'true' | 'false'>(
        'all',
    )
    const [filterRole, setFilterRole] = useState('')

    // filtros efectivos
    const [searchUsername, setSearchUsername] = useState('')
    const [searchFirstName, setSearchFirstName] = useState('')
    const [searchLastName, setSearchLastName] = useState('')
    const [searchSecondLastName, setSearchSecondLastName] = useState('')
    const [searchEmail, setSearchEmail] = useState('')
    const [searchActive, setSearchActive] = useState<boolean | undefined>(
        undefined,
    )
    const [searchRoleName, setSearchRoleName] = useState<string | undefined>(
        undefined,
    )

    const [searchTrigger, setSearchTrigger] = useState(0)

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

    // formulario creación
    const [createPayload, setCreatePayload] = useState<UserCreatePayload>({
        email: '',
        username: '',
        password: '',
        firstName: '',
        lastName: '',
        secondLastName: '',
        birthDate: '',
        bandJoinDate: '',
        systemSignupDate: '',
        phone: '',
        notes: '',
        profilePictureUrl: '',
        instrumentIds: [],
        roles: [],
    })


    // formulario edición
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

    // columnas tabla
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
                <div className="actions-container">
                    <button
                        type="button"
                        className="button-subtle"
                        onClick={() => handleViewDetails(u)}
                    >
                        Ver
                    </button>
                    <button
                        type="button"
                        className="button-secondary"
                        onClick={() => handleEditUser(u)}
                    >
                        Editar
                    </button>
                    <button
                        type="button"
                        className="button-subtle"
                        onClick={() => handleToggleActive(u)}
                    >
                        {u.active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                        type="button"
                        className="button-danger"
                        onClick={() => handleDeleteUser(u)}
                    >
                        Eliminar
                    </button>
                </div>
            ),
        },
    ]

    // ===== efectos =====

    // roles
    useEffect(() => {
        if (!token || !isAdmin) return

        const loadRoles = async () => {
            try {
                setRolesLoading(true)
                const data = await getAllRoles(token)
                setRoles(data)
            } catch (e) {
                console.error('Error loading roles', e)
            } finally {
                setRolesLoading(false)
            }
        }
        loadRoles()
    }, [token, isAdmin])

    // lista usuarios
    useEffect(() => {
        if (!token || !isAdmin) return

        const load = async () => {
            setLoading(true)
            setError(null)
            try {
                const sort =
                    sortField != null ? [`${sortField},${sortDirection}`] : undefined
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
                setError('Error cargando usuarios')
            } finally {
                setLoading(false)
            }
        }

        load()
    }, [
        token,
        isAdmin,
        page,
        size,
        searchUsername,
        searchFirstName,
        searchLastName,
        searchSecondLastName,
        searchEmail,
        searchActive,
        searchRoleName,
        sortField,
        sortDirection,
        searchTrigger,
    ])

    if (!isAdmin) {
        return (
            <div className="page-container">
                <h1 className="page-title">Gestión de usuarios</h1>
                <p>No tienes permisos para ver esta sección.</p>
            </div>
        )
    }

    // ===== helpers UI =====

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

        setMode('LIST')
        setSelectedUser(null)
        setSearchTrigger((prev) => prev + 1)
    }

    const handleSort = (field: SortableField) => {
        setPage(0)
        if (sortField === field) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
        } else {
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
        setManagingInstruments(false)
        setManagingRoles(false)
        setMode('DETAIL')
    }

    const handleOpenCreateUser = () => {
        setSelectedUser(null)
        setManagingInstruments(false)
        setManagingRoles(false)
        setMode('CREATE')
        setCreatePayload({
            email: '',
            username: '',
            password: '',
            firstName: '',
            lastName: '',
            secondLastName: '',
            birthDate: '',
            bandJoinDate: '',
            systemSignupDate: '',
            phone: '',
            notes: '',
            profilePictureUrl: '',
            instrumentIds: [],
            roles: [],
        })
    }

    const handleCreateFieldChange = (
        field: keyof UserCreatePayload,
        value: string,
    ) => {
        setCreatePayload((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    const handleToggleCreateRole = (roleName: string) => {
        setCreatePayload((prev) => ({
            ...prev,
            roles: prev.roles.includes(roleName)
                ? prev.roles.filter((r) => r !== roleName)
                : [...prev.roles, roleName],
        }))
    }

    const handleSubmitCreateUser = async (e: FormEvent) => {
        e.preventDefault()
        if (!token) return

        try {
            setSaving(true)
            setError(null)

            const payloadToSend: UserCreatePayload = {
                ...createPayload,
                secondLastName: createPayload.secondLastName || undefined,
                birthDate: createPayload.birthDate || undefined,
                bandJoinDate: createPayload.bandJoinDate || undefined,
                systemSignupDate: createPayload.systemSignupDate || undefined,
                phone: createPayload.phone || undefined,
                notes: createPayload.notes || undefined,
                profilePictureUrl: createPayload.profilePictureUrl || undefined,
                instrumentIds: createPayload.instrumentIds ?? [],
                roles: createPayload.roles ?? [],
            }

            await createUser(payloadToSend, token)

            // volvemos a la lista y recargamos
            setMode('LIST')
            setPage(0)
            setSearchTrigger((prev) => prev + 1)
        } catch (e) {
            console.error('Error creando usuario', e)
            setError('Error creando usuario')
        } finally {
            setSaving(false)
        }
    }


    const handleEditUser = (user: UserDTO) => {
        setSelectedUser(user)
        setManagingInstruments(false)
        setManagingRoles(false)
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
        setManagingInstruments(false)
        setManagingRoles(false)
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

            setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
            setSelectedUser(updated)
            setMode('LIST')
            setSearchTrigger((prev) => prev + 1)
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

            const refreshed = await getUserById(user.id, token)
            setUsers((prev) => prev.map((u) => (u.id === refreshed.id ? refreshed : u)))

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

            setPage(0)
            setMode('LIST')
            setSearchTrigger((prev) => prev + 1)
            if (selectedUser && selectedUser.id === user.id) {
                setSelectedUser(null)
            }
        } catch (e: any) {
            console.error('Error eliminando usuario:', e)
            setError('Error eliminando usuario')
        }
    }

    // instrumentos

    const openManageInstruments = async (user: UserDTO) => {
        if (!token) return

        setError(null)
        setManagingInstruments(true)
        setInstrumentsLoading(true)

        try {
            const fullUser = await getUserById(user.id, token)
            setSelectedUser(fullUser)

            const instruments = await getAllInstruments(token)
            setAllGroupedInstruments(groupInstrumentsByInitial(instruments))

            const currentIds =
                fullUser.instruments
                    ?.map((inst: any) => {
                        if (typeof inst === 'number') return inst
                        if (inst && typeof inst.id === 'number') return inst.id
                        if (inst && typeof inst.instrumentId === 'number')
                            return inst.instrumentId
                        return undefined
                    })
                    .filter((id): id is number => id != null) ?? []

            setSelectedInstrumentIds(currentIds)
            setMode('DETAIL')
        } catch (e) {
            console.error('Error cargando instrumentos para gestión de usuario', e)
            setError('Error cargando instrumentos del usuario')
            setManagingInstruments(false)
        } finally {
            setInstrumentsLoading(false)
        }
    }

    const toggleInstrumentForUser = (instrumentId: number) => {
        setSelectedInstrumentIds((prev) =>
            prev.includes(instrumentId)
                ? prev.filter((id) => id !== instrumentId)
                : [...prev, instrumentId],
        )
    }

    const handleSaveUserInstruments = async (e: FormEvent) => {
        e.preventDefault()
        if (!token || !selectedUser || !selectedUser.id) return

        try {
            setSaving(true)
            setError(null)

            const refreshed = await setUserInstruments(
                selectedUser.id,
                selectedInstrumentIds,
                selectedUser.version,
                token,
            )
            setUsers((prev) => prev.map((u) => (u.id === refreshed.id ? refreshed : u)))

            setSelectedUser(refreshed)
            setManagingInstruments(false)
        } catch (e) {
            console.error('Error guardando instrumentos del usuario', e)
            setError('Error guardando instrumentos del usuario')
        } finally {
            setSaving(false)
        }
    }

    const handleCancelManageInstruments = () => {
        setManagingInstruments(false)
        setSelectedInstrumentIds([])
    }

    // roles

    const openManageRoles = (user: UserDTO) => {
        if (!token) return

        setError(null)
        setManagingRoles(true)
        setSelectedUser(user)

        const currentRoles = user.roles ?? []
        setSelectedRoleNames(currentRoles)
        setMode('DETAIL')
    }

    const toggleRoleForUser = (roleName: string) => {
        setSelectedRoleNames((prev) =>
            prev.includes(roleName)
                ? prev.filter((name) => name !== roleName)
                : [...prev, roleName],
        )
    }

    const handleSaveUserRoles = async (e: FormEvent) => {
        e.preventDefault()
        if (!token || !selectedUser || !selectedUser.id) return

        try {
            setSaving(true)
            setError(null)

            const refreshed = await setUserRoles(
                selectedUser.id,
                selectedRoleNames,
                selectedUser.version,
                token,
            )
            setUsers((prev) => prev.map((u) => (u.id === refreshed.id ? refreshed : u)))

            setSelectedUser(refreshed)
            setManagingRoles(false)
            setSearchTrigger((prev) => prev + 1)
        } catch (e) {
            console.error('Error guardando roles del usuario', e)
            setError('Error guardando roles del usuario')
        } finally {
            setSaving(false)
        }
    }

    const handleCancelManageRoles = () => {
        setManagingRoles(false)
        setSelectedRoleNames([])
    }

    // ===== render =====

    return (
        <div className="page-container">
            <h1 className="page-title">Gestión de usuarios</h1>

            {/* Buscador */}
            <form onSubmit={handleSearchSubmit} className="card" style={{ marginBottom: '1rem' }}>
                <div className="section-title">Filtros de búsqueda</div>
                <div className="search-grid">
                    <input
                        type="text"
                        placeholder="Username"
                        value={filterUsername}
                        onChange={(e) => setFilterUsername(e.target.value)}
                        className="input-full-width"
                    />
                    <input
                        type="text"
                        placeholder="Nombre"
                        value={filterFirstName}
                        onChange={(e) => setFilterFirstName(e.target.value)}
                        className="input-full-width"
                    />
                    <input
                        type="text"
                        placeholder="1er apellido"
                        value={filterLastName}
                        onChange={(e) => setFilterLastName(e.target.value)}
                        className="input-full-width"
                    />
                    <input
                        type="text"
                        placeholder="2º apellido"
                        value={filterSecondLastName}
                        onChange={(e) => setFilterSecondLastName(e.target.value)}
                        className="input-full-width"
                    />
                    <input
                        type="text"
                        placeholder="Email"
                        value={filterEmail}
                        onChange={(e) => setFilterEmail(e.target.value)}
                        className="input-full-width"
                    />
                    <select
                        value={filterActive}
                        onChange={(e) =>
                            setFilterActive(e.target.value as 'all' | 'true' | 'false')
                        }
                        className="select-base"
                    >
                        <option value="all">Todos</option>
                        <option value="true">Activos</option>
                        <option value="false">Inactivos</option>
                    </select>
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="select-base"
                        disabled={rolesLoading}
                    >
                        <option value="">Rol (todos)</option>
                        {roles.map((r) => (
                            <option key={r.id} value={r.name}>
                                {r.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div
                    className="search-actions-row"
                    style={{ justifyContent: 'space-between' }}
                >
                    <button type="submit" className="button-primary">
                        Buscar
                    </button>

                    <button
                        type="button"
                        className="button-secondary"
                        onClick={handleOpenCreateUser}
                    >
                        + Nuevo usuario
                    </button>
                </div>

            </form>

            {loading && <p>Cargando usuarios...</p>}
            {error && <p className="error-message">{error}</p>}

            {/* LISTA */}
            {mode === 'LIST' && !loading && !error && (
                <>
                    <div className="card">
                        <DataTable<UserDTO, SortableField>
                            columns={userColumns}
                            data={users}
                            sortState={sortState}
                            onSortChange={handleSort}
                        />
                    </div>
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
            {mode === 'DETAIL' && selectedUser && !managingInstruments && !managingRoles && (
                <div className="card" style={{ marginTop: '1rem' }}>
                    <div className="section-title">Detalle de usuario</div>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <span className="detail-label">Username</span>
                            <span className="detail-value">{selectedUser.username}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Nombre</span>
                            <span className="detail-value">{selectedUser.firstName}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Apellidos</span>
                            <span className="detail-value">
                                {[selectedUser.lastName, selectedUser.secondLastName]
                                    .filter(Boolean)
                                    .join(' ')}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Email</span>
                            <span className="detail-value">{selectedUser.email}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Activo</span>
                            <span className="detail-value">
                                {selectedUser.active ? 'Sí' : 'No'}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Roles</span>
                            <span className="detail-value">
                                {(selectedUser.roles ?? []).join(', ') || '-'}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Instrumentos</span>
                            <span className="detail-value">
                                {selectedUser.instruments && selectedUser.instruments.length > 0
                                    ? [...selectedUser.instruments]
                                        .sort((a: any, b: any) => {
                                            const na = (
                                                a?.instrumentName ?? String(a)
                                            ).toString().toLowerCase()
                                            const nb = (
                                                b?.instrumentName ?? String(b)
                                            ).toString().toLowerCase()
                                            return na.localeCompare(nb)
                                        })
                                        .map((inst: any) =>
                                            inst && inst.instrumentName
                                                ? `${inst.instrumentName}${inst.voice ? ' ' + inst.voice : ''
                                                }`
                                                : String(inst),
                                        )
                                        .join(', ')
                                    : '-'}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Fecha nacimiento</span>
                            <span className="detail-value">
                                {formatDate(selectedUser.birthDate)}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Alta en banda</span>
                            <span className="detail-value">
                                {formatDate(selectedUser.bandJoinDate)}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Alta en sistema</span>
                            <span className="detail-value">
                                {formatDate(selectedUser.systemSignupDate)}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Teléfono</span>
                            <span className="detail-value">
                                {selectedUser.phone || '-'}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Notas</span>
                            <span className="detail-value">
                                {selectedUser.notes || '-'}
                            </span>
                        </div>
                    </div>

                    <div className="button-row-1rem">
                        <button
                            type="button"
                            className="button-subtle"
                            onClick={handleCancelDetailOrEdit}
                        >
                            Volver a la lista
                        </button>
                        <button
                            type="button"
                            className="button-secondary"
                            onClick={() => handleEditUser(selectedUser)}
                        >
                            Editar
                        </button>
                        <button
                            type="button"
                            className="button-primary"
                            onClick={() => openManageInstruments(selectedUser)}
                        >
                            Gestionar instrumentos
                        </button>
                        <button
                            type="button"
                            className="button-primary"
                            onClick={() => openManageRoles(selectedUser)}
                        >
                            Gestionar roles
                        </button>
                    </div>
                </div>
            )}

            {/* EDICIÓN */}
            {mode === 'EDIT' && selectedUser && (
                <form
                    onSubmit={handleSaveEdit}
                    className="card"
                    style={{ marginTop: '1rem' }}
                >
                    <div className="section-title">
                        Editar usuario: {selectedUser.username}
                    </div>

                    <div className="form-grid">
                        <div className="form-field">
                            <span className="label-text">Email *</span>
                            <input
                                type="email"
                                value={editPayload.email}
                                onChange={(e) =>
                                    handleEditFieldChange('email', e.target.value)
                                }
                                required
                                className="input-full-width"
                            />
                        </div>

                        <div className="form-field">
                            <span className="label-text">Nombre *</span>
                            <input
                                type="text"
                                value={editPayload.firstName}
                                onChange={(e) =>
                                    handleEditFieldChange('firstName', e.target.value)
                                }
                                required
                                className="input-full-width"
                            />
                        </div>

                        <div className="form-field">
                            <span className="label-text">1er apellido *</span>
                            <input
                                type="text"
                                value={editPayload.lastName}
                                onChange={(e) =>
                                    handleEditFieldChange('lastName', e.target.value)
                                }
                                required
                                className="input-full-width"
                            />
                        </div>

                        <div className="form-field">
                            <span className="label-text">2º apellido</span>
                            <input
                                type="text"
                                value={editPayload.secondLastName ?? ''}
                                onChange={(e) =>
                                    handleEditFieldChange('secondLastName', e.target.value)
                                }
                                className="input-full-width"
                            />
                        </div>

                        <div className="form-field">
                            <span className="label-text">Fecha nacimiento</span>
                            <input
                                type="date"
                                value={editPayload.birthDate ?? ''}
                                onChange={(e) =>
                                    handleEditFieldChange('birthDate', e.target.value)
                                }
                                className="input-full-width"
                            />
                        </div>

                        <div className="form-field">
                            <span className="label-text">Alta en banda</span>
                            <input
                                type="date"
                                value={editPayload.bandJoinDate ?? ''}
                                onChange={(e) =>
                                    handleEditFieldChange('bandJoinDate', e.target.value)
                                }
                                className="input-full-width"
                            />
                        </div>

                        <div className="form-field">
                            <span className="label-text">Teléfono</span>
                            <input
                                type="text"
                                value={editPayload.phone ?? ''}
                                onChange={(e) =>
                                    handleEditFieldChange('phone', e.target.value)
                                }
                                className="input-full-width"
                            />
                        </div>

                        <div className="form-field grid-full-width">
                            <span className="label-text">Notas</span>
                            <textarea
                                rows={3}
                                value={editPayload.notes ?? ''}
                                onChange={(e) =>
                                    handleEditFieldChange('notes', e.target.value)
                                }
                                className="textarea-base"
                            />
                        </div>

                        <div className="form-field grid-full-width">
                            <span className="label-text">URL foto de perfil</span>
                            <input
                                type="text"
                                value={editPayload.profilePictureUrl ?? ''}
                                onChange={(e) =>
                                    handleEditFieldChange('profilePictureUrl', e.target.value)
                                }
                                className="input-full-width"
                            />
                        </div>
                    </div>

                    <div className="button-row">
                        <button type="submit" className="button-primary" disabled={saving}>
                            {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button
                            type="button"
                            className="button-secondary"
                            onClick={handleCancelDetailOrEdit}
                            disabled={saving}
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {/* CREACIÓN */}
            {mode === 'CREATE' && (
                <form
                    onSubmit={handleSubmitCreateUser}
                    className="card"
                    style={{ marginTop: '1rem' }}
                >
                    <div className="section-title">Nuevo usuario</div>

                    <div className="form-grid">
                        {/* CREDENCIALES */}
                        <div className="form-field">
                            <span className="label-text">Username *</span>
                            <input
                                type="text"
                                value={createPayload.username}
                                onChange={(e) =>
                                    handleCreateFieldChange('username', e.target.value)
                                }
                                required
                                className="input-full-width"
                            />
                        </div>

                        <div className="form-field">
                            <span className="label-text">Email *</span>
                            <input
                                type="email"
                                value={createPayload.email}
                                onChange={(e) =>
                                    handleCreateFieldChange('email', e.target.value)
                                }
                                required
                                className="input-full-width"
                            />
                        </div>

                        <div className="form-field">
                            <span className="label-text">Password *</span>
                            <input
                                type="password"
                                value={createPayload.password}
                                onChange={(e) =>
                                    handleCreateFieldChange('password', e.target.value)
                                }
                                required
                                className="input-full-width"
                            />
                        </div>

                        {/* DATOS PERSONALES */}
                        <div className="form-field">
                            <span className="label-text">Nombre *</span>
                            <input
                                type="text"
                                value={createPayload.firstName}
                                onChange={(e) =>
                                    handleCreateFieldChange('firstName', e.target.value)
                                }
                                required
                                className="input-full-width"
                            />
                        </div>

                        <div className="form-field">
                            <span className="label-text">1er apellido *</span>
                            <input
                                type="text"
                                value={createPayload.lastName}
                                onChange={(e) =>
                                    handleCreateFieldChange('lastName', e.target.value)
                                }
                                required
                                className="input-full-width"
                            />
                        </div>

                        <div className="form-field">
                            <span className="label-text">2º apellido</span>
                            <input
                                type="text"
                                value={createPayload.secondLastName ?? ''}
                                onChange={(e) =>
                                    handleCreateFieldChange('secondLastName', e.target.value)
                                }
                                className="input-full-width"
                            />
                        </div>

                        <div className="form-field">
                            <span className="label-text">Fecha nacimiento</span>
                            <input
                                type="date"
                                value={createPayload.birthDate ?? ''}
                                onChange={(e) =>
                                    handleCreateFieldChange('birthDate', e.target.value)
                                }
                                className="input-full-width"
                            />
                        </div>

                        <div className="form-field">
                            <span className="label-text">Alta en banda</span>
                            <input
                                type="date"
                                value={createPayload.bandJoinDate ?? ''}
                                onChange={(e) =>
                                    handleCreateFieldChange('bandJoinDate', e.target.value)
                                }
                                className="input-full-width"
                            />
                        </div>
{/* 
                        <div className="form-field">
                            <span className="label-text">Alta en sistema</span>
                            <input
                                type="date"
                                value={createPayload.systemSignupDate ?? ''}
                                onChange={(e) =>
                                    handleCreateFieldChange('systemSignupDate', e.target.value)
                                }
                                className="input-full-width"
                            />
                        </div> */}

                        <div className="form-field">
                            <span className="label-text">Teléfono</span>
                            <input
                                type="text"
                                value={createPayload.phone ?? ''}
                                onChange={(e) =>
                                    handleCreateFieldChange('phone', e.target.value)
                                }
                                className="input-full-width"
                            />
                        </div>

                        <div className="form-field grid-full-width">
                            <span className="label-text">Notas</span>
                            <textarea
                                rows={3}
                                value={createPayload.notes ?? ''}
                                onChange={(e) =>
                                    handleCreateFieldChange('notes', e.target.value)
                                }
                                className="textarea-base"
                            />
                        </div>

                        <div className="form-field grid-full-width">
                            <span className="label-text">URL foto de perfil</span>
                            <input
                                type="text"
                                value={createPayload.profilePictureUrl ?? ''}
                                onChange={(e) =>
                                    handleCreateFieldChange('profilePictureUrl', e.target.value)
                                }
                                className="input-full-width"
                            />
                        </div>

                        {/* ROLES */}
                        <div className="form-field grid-full-width">
                            <span className="label-text">Roles</span>
                            <div className="checkbox-group">
                                {roles.map((r) => (
                                    <label key={r.id} className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={createPayload.roles.includes(r.name)}
                                            onChange={() => handleToggleCreateRole(r.name)}
                                        />
                                        <span>{r.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="button-row">
                        <button type="submit" className="button-primary" disabled={saving}>
                            {saving ? 'Guardando...' : 'Crear usuario'}
                        </button>
                        <button
                            type="button"
                            className="button-secondary"
                            onClick={handleCancelDetailOrEdit}
                            disabled={saving}
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}


            {/* GESTIÓN DE ROLES */}
            {mode === 'DETAIL' && selectedUser && managingRoles && (
                <form
                    onSubmit={handleSaveUserRoles}
                    className="card"
                    style={{ marginTop: '1rem' }}
                >
                    <div className="section-title">
                        Gestionar roles de {selectedUser.username}
                    </div>

                    <div className="checkbox-group" style={{ marginTop: '1rem' }}>
                        {roles.map((role) => (
                            <label key={role.id} className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={selectedRoleNames.includes(role.name)}
                                    onChange={() => toggleRoleForUser(role.name)}
                                />
                                <span>{role.name}</span>
                            </label>
                        ))}
                        {roles.length === 0 && (
                            <p>No hay roles definidos en el sistema.</p>
                        )}
                    </div>

                    <div className="button-row">
                        <button type="submit" className="button-primary" disabled={saving}>
                            {saving ? 'Guardando...' : 'Guardar roles'}
                        </button>
                        <button
                            type="button"
                            className="button-secondary"
                            onClick={handleCancelManageRoles}
                            disabled={saving}
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {/* GESTIÓN DE INSTRUMENTOS */}
            {mode === 'DETAIL' && selectedUser && managingInstruments && (
                <form
                    onSubmit={handleSaveUserInstruments}
                    className="card"
                    style={{ marginTop: '1rem' }}
                >
                    <div className="section-title">
                        Gestionar instrumentos de {selectedUser.username}
                    </div>

                    {instrumentsLoading ? (
                        <p>Cargando instrumentos...</p>
                    ) : (
                        <div className="instruments-grid">
                            {allGroupedInstruments.map((group) => (
                                <div key={group.letter} className="instrument-group">
                                    <div className="instrument-group-title">
                                        {group.letter}
                                    </div>

                                    {group.items.map((inst: InstrumentDTO) => (
                                        <label key={inst.id} className="instrument-item">
                                            <input
                                                type="checkbox"
                                                checked={selectedInstrumentIds.includes(inst.id)}
                                                onChange={() => toggleInstrumentForUser(inst.id)}
                                            />
                                            <span>
                                                {inst.instrumentName}{' '}
                                                {inst.voice && `(${inst.voice})`}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            ))}
                            {allGroupedInstruments.length === 0 && (
                                <p>No hay instrumentos definidos en el sistema.</p>
                            )}
                        </div>
                    )}

                    <div className="button-row">
                        <button type="submit" className="button-primary" disabled={saving}>
                            {saving ? 'Guardando...' : 'Guardar instrumentos'}
                        </button>
                        <button
                            type="button"
                            className="button-secondary"
                            onClick={handleCancelManageInstruments}
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
