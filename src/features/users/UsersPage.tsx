import { type FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { extractErrorMessage } from '../../utils/errorHandler'
import {
    searchUsersPage, getUserById, updateUser,
    enableUser, disableUser, deleteUser,
    type UserUpdatePayload, createUser,
    type UserCreatePayload, setUserRoles,
} from '../../api/usersApi'
import { getAllInstruments, setUserInstruments } from '../../api/instrumentsApi'
import { getAllRoles } from '../../api/rolesApi'
import type { UserDTO } from '../../types/users'
import type { KeycloakRoleResponse } from '../../types/roles'
import type { InstrumentGroup } from '../../utils/instrumentUtils'
import { groupInstrumentsByInitial } from '../../utils/instrumentUtils'
import { formatDate } from '../../utils/date'
import { PaginationBar } from '../../components/PaginationBar'
import { DataTable } from '../../components/DataTable'
import { UserDetailCard } from './UserDetailCard'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { SearchFiltersPanel } from '../../components/SearchFiltersPanel'
import { UserEditForm } from './UserEditForm'
import { UserCreateForm } from './UserCreateForm'
import { UserRolesPanel } from './UserRolesPanel'
import { UserInstrumentsPanel } from './UserInstrumentsPanel'
import { EditIcon, TrashIcon, CheckIcon, CancelIcon } from '../../components/Icons'
import { usePagination, useSorting, useConfirmDialog, useRowExpansion } from '../../hooks'
import { useToast } from '../../context/ToastContext'
import { ErrorState } from '../../components/ErrorState'
import { Spinner } from '../../components/Spinner'
import '../../styles/common.css'

/**
 * UsersPage — Orquesta el CRUD completo de usuarios (solo ADMIN).
 *
 * Centraliza todo el estado y los handlers de API; los subcomponentes son
 * presentacionales y solo reciben datos y callbacks.
 *
 * Patrón de doble estado `filter*` y `search*`:
 * - `filter*` refleja lo que el usuario escribe en el formulario.
 * - `search*` son los filtros efectivos que disparan la búsqueda.
 * El badge de filtros activos cuenta `search*` para mostrar lo realmente aplicado,
 * no lo que todavía está escrito pero sin enviar.
 */

type ViewMode = 'LIST' | 'EDIT' | 'CREATE'
type SortableField = 'username' | 'email' | 'active' | 'bandJoinDate' | 'firstName' | 'lastName'

function UsersPage() {
    const { token, hasRole } = useAuth()
    const isAdmin = hasRole('ADMIN')
    const { showToast } = useToast()

    const [users, setUsers]     = useState<UserDTO[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError]     = useState<string | null>(null)
    const [saving, setSaving]   = useState(false)

    const pagination   = usePagination({ defaultSize: 10 })
    const sorting      = useSorting<SortableField>()
    const confirm      = useConfirmDialog()
    const rowExpansion = useRowExpansion<number>()

    const [mode, setMode]                 = useState<ViewMode>('LIST')
    const [selectedUser, setSelectedUser] = useState<UserDTO | null>(null)

    const [allGroupedInstruments, setAllGroupedInstruments] = useState<InstrumentGroup[]>([])
    const [instrumentsLoading, setInstrumentsLoading]       = useState(false)
    const [managingInstruments, setManagingInstruments]     = useState(false)
    const [selectedInstrumentIds, setSelectedInstrumentIds] = useState<number[]>([])
    const [managingRoles, setManagingRoles]                 = useState(false)
    const [selectedRoleNames, setSelectedRoleNames]         = useState<string[]>([])
    const [roles, setRoles]                                 = useState<KeycloakRoleResponse[]>([])
    const [rolesLoading, setRolesLoading]                   = useState(false)

    // Filtros visibles (UI)
    const [filterUsername, setFilterUsername]                 = useState('')
    const [filterFirstName, setFilterFirstName]               = useState('')
    const [filterLastName, setFilterLastName]                 = useState('')
    const [filterSecondLastName, setFilterSecondLastName]     = useState('')
    const [filterEmail, setFilterEmail]                       = useState('')
    const [filterActive, setFilterActive]                     = useState<'all' | 'true' | 'false'>('all')
    const [filterRole, setFilterRole]                         = useState('')
    const [filterBirthDateFrom, setFilterBirthDateFrom]       = useState('')
    const [filterBirthDateTo, setFilterBirthDateTo]           = useState('')
    const [filterBandJoinDateFrom, setFilterBandJoinDateFrom] = useState('')
    const [filterBandJoinDateTo, setFilterBandJoinDateTo]     = useState('')

    // Filtros efectivos (los que disparan la búsqueda)
    const [searchUsername, setSearchUsername]                   = useState('')
    const [searchFirstName, setSearchFirstName]                 = useState('')
    const [searchLastName, setSearchLastName]                   = useState('')
    const [searchSecondLastName, setSearchSecondLastName]       = useState('')
    const [searchEmail, setSearchEmail]                         = useState('')
    const [searchActive, setSearchActive]                       = useState<boolean | undefined>(undefined)
    const [searchRoleName, setSearchRoleName]                   = useState<string | undefined>(undefined)
    const [searchBirthDateFrom, setSearchBirthDateFrom]         = useState<string | undefined>(undefined)
    const [searchBirthDateTo, setSearchBirthDateTo]             = useState<string | undefined>(undefined)
    const [searchBandJoinDateFrom, setSearchBandJoinDateFrom]   = useState<string | undefined>(undefined)
    const [searchBandJoinDateTo, setSearchBandJoinDateTo]       = useState<string | undefined>(undefined)
    const [searchTrigger, setSearchTrigger]                     = useState(0)

    const [createPayload, setCreatePayload] = useState<UserCreatePayload>({
        email: '', username: '', password: '',
        firstName: '', lastName: '', secondLastName: '',
        birthDate: '', bandJoinDate: '', systemSignupDate: '',
        phone: '', notes: '', profilePictureUrl: '',
        instrumentIds: [], roles: [],
    })
    const [editPayload, setEditPayload] = useState<UserUpdatePayload>({
        email: '', firstName: '', lastName: '', secondLastName: '',
        birthDate: '', bandJoinDate: '', phone: '', notes: '', profilePictureUrl: '',
    })

    // Badge: cuenta los filtros efectivos (search*), no los del formulario (filter*).
    // Así el indicador refleja lo aplicado en la búsqueda, no lo pendiente de enviar.
    const activeFiltersCount =
        [searchUsername, searchFirstName, searchLastName, searchSecondLastName, searchEmail].filter(Boolean).length
        + (searchActive !== undefined ? 1 : 0)
        + (searchRoleName ? 1 : 0)
        + (searchBirthDateFrom || searchBirthDateTo ? 1 : 0)
        + (searchBandJoinDateFrom || searchBandJoinDateTo ? 1 : 0)

    // Columnas. Los botones de acción usan btn-icon + tooltip-wrap.
    // e.stopPropagation() es imprescindible: sin él el click en el botón
    // también dispara onRowClick del DataTable, expandiendo la fila.
    const userColumns = [
        { key: 'username',  header: 'Username',     sortable: true,  sortField: 'username'    as SortableField, width: '20%' },
        {
            key: 'firstName', header: 'Nombre', sortable: true,
            sortField: 'firstName' as SortableField, width: '20%',
            render: (u: UserDTO) => `${u.firstName}`,
        },
        {
            key: 'lastName', header: 'Apellidos', sortable: true,
            sortField: 'lastName' as SortableField, width: '23%',
            render: (u: UserDTO) => u.secondLastName ? `${u.lastName} ${u.secondLastName}` : u.lastName,
        },
        {
            key: 'bandJoinDate', header: 'Alta en banda', sortable: true,
            sortField: 'bandJoinDate' as SortableField, width: '20%',
            render: (u: UserDTO) => formatDate(u.bandJoinDate),
        },
        {
            key: 'actions', header: 'Acciones', sortable: false, width: '17%',
            render: (u: UserDTO) => (
                <div className="actions-container">
                    <span className="tooltip-wrap" data-tooltip="Editar">
                        <button type="button" className="btn-icon btn-icon-edit"
                            aria-label="Editar usuario"
                            onClick={e => { e.stopPropagation(); handleEditUser(u) }}>
                            <EditIcon />
                        </button>
                    </span>
                    <span className="tooltip-wrap" data-tooltip={u.active ? 'Desactivar' : 'Activar'}>
                        <button type="button"
                            className={`btn-icon ${u.active ? 'btn-icon-neutral' : 'btn-icon-success'}`}
                            aria-label={u.active ? 'Desactivar usuario' : 'Activar usuario'}
                            onClick={e => { e.stopPropagation(); handleToggleActive(u) }}>
                            {u.active ? <CancelIcon /> : <CheckIcon />}
                        </button>
                    </span>
                    <span className="tooltip-wrap" data-tooltip="Eliminar">
                        <button type="button" className="btn-icon btn-icon-danger"
                            aria-label="Eliminar usuario"
                            onClick={e => { e.stopPropagation(); handleDeleteUser(u) }}>
                            <TrashIcon />
                        </button>
                    </span>
                </div>
            ),
        },
    ]

    // ── Effects ───────────────────────────────────────────────────────────────

    // Cargamos la lista de roles al montar y cuando cambian token/isAdmin.
    // Si no hay autorización, salimos sin hacer llamadas a la API.
    useEffect(() => {
        if (!token || !isAdmin) return
        let cancelled = false
        const load = async () => {
            try {
                setRolesLoading(true)
                const result = await getAllRoles(token)
                if (!cancelled) setRoles(result)
            } catch (e) {
                if (!cancelled) console.error('Error cargando roles:', e)
            } finally { if (!cancelled) setRolesLoading(false) }
        }
        load()
        return () => { cancelled = true }
    }, [token, isAdmin])

    // Cargamos usuarios cada vez que cambia paginación, ordenación o search*.
    // Estas dependencias son las que realmente alteran el resultado del listado.
    useEffect(() => {
        if (!token || !isAdmin) return
        const load = async () => {
            setLoading(true); setError(null)
            try {
                const sort = sorting.field != null ? [`${sorting.field},${sorting.direction}`] : undefined
                const data = await searchUsersPage({
                    page: pagination.page, size: pagination.size,
                    username: searchUsername || undefined,
                    firstName: searchFirstName || undefined,
                    lastName: searchLastName || undefined,
                    secondLastName: searchSecondLastName || undefined,
                    email: searchEmail || undefined,
                    active: searchActive, roleName: searchRoleName,
                    birthDateFrom: searchBirthDateFrom, birthDateTo: searchBirthDateTo,
                    bandJoinDateFrom: searchBandJoinDateFrom, bandJoinDateTo: searchBandJoinDateTo,
                    sort,
                }, token)
                setUsers(data.content ?? [])
                pagination.setTotals(data.totalPages ?? 1, data.totalElements ?? 0)
            } catch (e: any) {
                // Capturamos errores de red, validación o concurrencia y mostramos
                // un mensaje consistente en la UI sin romper el render.
                setError(extractErrorMessage(e, 'Error cargando usuarios'))
            } finally { setLoading(false) }
        }
        load()
    }, [
        token, isAdmin, pagination.page, pagination.size,
        searchUsername, searchFirstName, searchLastName, searchSecondLastName,
        searchEmail, searchActive, searchRoleName,
        searchBirthDateFrom, searchBirthDateTo,
        searchBandJoinDateFrom, searchBandJoinDateTo,
        sorting.field, sorting.direction, searchTrigger,
    ])

    // ── Handlers de búsqueda ──────────────────────────────────────────────────

    const handleResetFilters = () => {
        // Limpiamos filtros visibles y filtros efectivos para volver al estado base.
        setFilterUsername(''); setFilterFirstName(''); setFilterLastName('')
        setFilterSecondLastName(''); setFilterEmail(''); setFilterActive('all')
        setFilterRole(''); setFilterBirthDateFrom(''); setFilterBirthDateTo('')
        setFilterBandJoinDateFrom(''); setFilterBandJoinDateTo('')
        setSearchUsername(''); setSearchFirstName(''); setSearchLastName('')
        setSearchSecondLastName(''); setSearchEmail(''); setSearchActive(undefined)
        setSearchRoleName(undefined); setSearchBirthDateFrom(undefined)
        setSearchBirthDateTo(undefined); setSearchBandJoinDateFrom(undefined)
        setSearchBandJoinDateTo(undefined)
        // Reseteamos a la primera página para evitar quedarnos en una página vacía.
        pagination.goToPage(0); setMode('LIST'); setSelectedUser(null)
        // Forzamos recarga aunque los filtros ya estuvieran vacíos.
        setSearchTrigger(prev => prev + 1)
    }

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault()
        // Reseteamos a la primera página para evitar mostrar resultados incompletos.
        pagination.goToPage(0)
        // Copiamos los valores del formulario de filtros a los estados de búsqueda
        // efectiva. Este paso es el que realmente dispara la recarga de datos.
        setSearchUsername(filterUsername.trim()); setSearchFirstName(filterFirstName.trim())
        setSearchLastName(filterLastName.trim()); setSearchSecondLastName(filterSecondLastName.trim())
        setSearchEmail(filterEmail.trim())
        setSearchActive(filterActive === 'all' ? undefined : filterActive === 'true')
        setSearchRoleName(filterRole.trim() || undefined)
        setSearchBirthDateFrom(filterBirthDateFrom || undefined)
        setSearchBirthDateTo(filterBirthDateTo || undefined)
        setSearchBandJoinDateFrom(filterBandJoinDateFrom || undefined)
        setSearchBandJoinDateTo(filterBandJoinDateTo || undefined)
        setMode('LIST'); setSelectedUser(null)
        setSearchTrigger(prev => prev + 1)
    }

    const handleSort = (field: SortableField) => {
        // Reseteamos a la primera página porque la ordenación cambia el conjunto visible.
        pagination.goToPage(0); sorting.handleSortChange(field)
    }

    const handleViewDetails = (user: UserDTO) => {
        if (rowExpansion.expandedId === user.id) {
            rowExpansion.close()
            setTimeout(() => setSelectedUser(null), 250)
        } else {
            rowExpansion.toggle(user.id ?? null)
            setSelectedUser(user)
        }
        setManagingInstruments(false); setManagingRoles(false)
    }

    // ── CRUD usuario ──────────────────────────────────────────────────────────

    const handleOpenCreateUser = () => {
        // Preparamos el formulario de alta con un payload limpio.
        setSelectedUser(null); setManagingInstruments(false); setManagingRoles(false)
        setMode('CREATE')
        setCreatePayload({
            email: '', username: '', password: '', firstName: '', lastName: '',
            secondLastName: '', birthDate: '', bandJoinDate: '', systemSignupDate: '',
            phone: '', notes: '', profilePictureUrl: '', instrumentIds: [], roles: [],
        })
    }

    const handleSubmitCreateUser = async (e: FormEvent) => {
        e.preventDefault(); if (!token) return
        try {
            // Creamos el usuario con valores opcionales normalizados a undefined.
            setSaving(true); setError(null)
            await createUser({
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
            }, token)
            showToast('Usuario creado correctamente', 'success')
            // Volvemos al listado y a la primera página para ver el nuevo registro.
            setMode('LIST'); pagination.goToPage(0)
            setSearchTrigger(prev => prev + 1)
        } catch (e) {
            // Mostramos el error devuelto por la API (incluida concurrencia si aplica).
            showToast(extractErrorMessage(e, 'Error creando usuario'), 'error')
        } finally { setSaving(false) }
    }

    const handleEditUser = (user: UserDTO) => {
        // Cargamos en el formulario los datos actuales del usuario seleccionado.
        setSelectedUser(user); setManagingInstruments(false); setManagingRoles(false)
        setEditPayload({
            email: user.email ?? '', firstName: user.firstName ?? '',
            lastName: user.lastName ?? '', secondLastName: user.secondLastName ?? '',
            birthDate: user.birthDate ?? '', bandJoinDate: user.bandJoinDate ?? '',
            phone: user.phone ?? '', notes: user.notes ?? '',
            profilePictureUrl: user.profilePictureUrl ?? '',
        })
        setMode('EDIT')
    }

    const handleSaveEdit = async (e: FormEvent) => {
        e.preventDefault()
        if (!selectedUser?.id || selectedUser.version == null || !token) return
        setSaving(true); setError(null)
        try {
            // Persistimos cambios y actualizamos tanto la lista como el detalle.
            const updated = await updateUser(selectedUser.id, {
                ...editPayload,
                secondLastName: editPayload.secondLastName || undefined,
                birthDate: editPayload.birthDate || undefined,
                bandJoinDate: editPayload.bandJoinDate || undefined,
                phone: editPayload.phone || undefined,
                notes: editPayload.notes || undefined,
                profilePictureUrl: editPayload.profilePictureUrl || undefined,
            }, selectedUser.version, token)
            setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))
            showToast('Usuario actualizado correctamente', 'success')
            setSelectedUser(updated); setMode('LIST')
            setSearchTrigger(prev => prev + 1)
        } catch (e: any) {
            // Capturamos errores de validación o concurrencia y avisamos al usuario.
            showToast(extractErrorMessage(e, 'Error actualizando usuario'), 'error')
        } finally { setSaving(false) }
    }

    const handleCancelForm = () => {
        // Volvemos al listado y cerramos paneles secundarios.
        setMode('LIST'); setSelectedUser(null)
        setManagingInstruments(false); setManagingRoles(false)
    }

    // ── Activar / Desactivar / Eliminar ───────────────────────────────────────

    const handleToggleActive = (user: UserDTO) => {
        if (!user.id || user.version == null || !token) return
        // Flujo: confirmación -> cambio de estado -> recarga del usuario.
        confirm.open({
            title: user.active ? `Desactivar "${user.username}"` : `Activar "${user.username}"`,
            message: `¿Seguro que quieres ${user.active ? 'desactivar' : 'activar'} al usuario "${user.username}"?`,
            variant: 'warning',
            onConfirm: async () => {
                confirm.close()
                try {
                    setError(null)
                    user.active
                        ? await disableUser(user.id, user.version, token)
                        : await enableUser(user.id, user.version, token)
                    const refreshed = await getUserById(user.id, token)
                    setUsers(prev => prev.map(u => u.id === refreshed.id ? refreshed : u))
                    if (selectedUser?.id === refreshed.id) setSelectedUser(refreshed)
                    showToast(user.active ? 'Usuario desactivado' : 'Usuario activado', 'success')
                } catch (e: any) {
                    // Errores de API (incluida concurrencia) se muestran en un toast.
                    showToast(extractErrorMessage(e, 'Error cambiando estado del usuario'), 'error')
                }
            },
        })
    }

    const handleDeleteUser = (user: UserDTO) => {
        if (!user.id || user.version == null || !token) return
        // Flujo: confirmación -> borrado -> recarga del listado.
        confirm.open({
            title: `Eliminar usuario "${user.username}"`,
            message: `¿Seguro que quieres eliminar a "${user.username}"?\nEsta acción no se puede deshacer.`,
            variant: 'danger',
            onConfirm: async () => {
                confirm.close()
                try {
                    setError(null)
                    await deleteUser(user.id, user.version, token)
                    showToast('Usuario eliminado correctamente', 'success')
                    // Reseteamos a la primera página para evitar huecos en la tabla.
                    pagination.goToPage(0); setMode('LIST')
                    setSearchTrigger(prev => prev + 1)
                    if (selectedUser?.id === user.id) setSelectedUser(null)
                } catch (e: any) {
                    // Mostramos el error de API sin alterar el estado de la UI.
                    showToast(extractErrorMessage(e, 'Error eliminando usuario'), 'error')
                }
            },
        })
    }

    // ── Instrumentos ──────────────────────────────────────────────────────────

    const openManageInstruments = async (user: UserDTO) => {
        if (!token) return
        // Abrimos el panel y cargamos datos solo cuando el admin lo solicita.
        setError(null); setManagingInstruments(true); setInstrumentsLoading(true)
        try {
            const fullUser = await getUserById(user.id, token)
            setSelectedUser(fullUser)
            setAllGroupedInstruments(groupInstrumentsByInitial(await getAllInstruments(token)))
            const currentIds = fullUser.instruments
                ?.map((inst: any) => {
                    if (typeof inst === 'number') return inst
                    if (inst && typeof inst.id === 'number') return inst.id
                    if (inst && typeof inst.instrumentId === 'number') return inst.instrumentId
                    return undefined
                })
                .filter((id): id is number => id != null) ?? []
            setSelectedInstrumentIds(currentIds)
        } catch (e) {
            // Si falla la carga, cerramos el panel y avisamos al usuario.
            showToast(extractErrorMessage(e, 'Error cargando instrumentos del usuario'), 'error')
            setManagingInstruments(false)
        } finally { setInstrumentsLoading(false) }
    }

    const handleSaveUserInstruments = async (e: FormEvent) => {
        e.preventDefault(); if (!token || !selectedUser?.id) return
        try {
            // Persistimos la asignación de instrumentos y refrescamos el usuario.
            setSaving(true); setError(null)
            const refreshed = await setUserInstruments(
                selectedUser.id, selectedInstrumentIds, selectedUser.version, token,
            )
            setUsers(prev => prev.map(u => u.id === refreshed.id ? refreshed : u))
            showToast('Instrumentos guardados correctamente', 'success')
            setSelectedUser(refreshed); setManagingInstruments(false)
        } catch (e) {
            // Errores de API se muestran en un toast para que el usuario actúe.
            showToast(extractErrorMessage(e, 'Error guardando instrumentos'), 'error')
        } finally { setSaving(false) }
    }

    // ── Roles ─────────────────────────────────────────────────────────────────

    const openManageRoles = (user: UserDTO) => {
        if (!token) return
        // Abrimos el panel y clonamos los roles actuales para edición local.
        setError(null); setManagingRoles(true); setSelectedUser(user)
        setSelectedRoleNames(user.roles ?? [])
    }

    const handleSaveUserRoles = async (e: FormEvent) => {
        e.preventDefault(); if (!token || !selectedUser?.id) return
        try {
            // Persistimos roles y actualizamos listado y detalle.
            setSaving(true); setError(null)
            const refreshed = await setUserRoles(
                selectedUser.id, selectedRoleNames, selectedUser.version, token,
            )
            setUsers(prev => prev.map(u => u.id === refreshed.id ? refreshed : u))
            showToast('Roles guardados correctamente', 'success')
            setSelectedUser(refreshed); setManagingRoles(false)
            setSearchTrigger(prev => prev + 1)
        } catch (e) {
            // Mostramos errores de API (incluida concurrencia) al usuario.
            showToast(extractErrorMessage(e, 'Error guardando roles'), 'error')
        } finally { setSaving(false) }
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="page-container">
            <h1 className="page-title">Gestión de usuarios</h1>

            {!error && (
            <SearchFiltersPanel
                activeFiltersCount={activeFiltersCount}
                onSubmit={handleSearchSubmit}
                actionButton={
                    <button type="button" className="button-secondary" onClick={handleOpenCreateUser}>
                        + Nuevo usuario
                    </button>
                }
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

                    <div className="search-date-row">
                        <div className="search-date-group">
                            <div className="form-field">
                                <span className="label-text">Nacimiento (desde)</span>
                                <input type="date" value={filterBirthDateFrom} onChange={e => setFilterBirthDateFrom(e.target.value)} className="input-full-width" />
                            </div>
                            <div className="form-field">
                                <span className="label-text">Nacimiento (hasta)</span>
                                <input type="date" value={filterBirthDateTo} onChange={e => setFilterBirthDateTo(e.target.value)} className="input-full-width" />
                            </div>
                        </div>
                        <div className="search-date-group">
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
                    <button type="button" className="button-subtle" onClick={handleResetFilters}
                        style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>
                        Resetear filtros
                    </button>
                    <button type="submit" className="button-primary">Buscar</button>
                </div>
            </SearchFiltersPanel>
            )}

            {loading && <Spinner />}
            {error   && <ErrorState message={error} onRetry={() => setSearchTrigger(prev => prev + 1)} />}

            {mode === 'LIST' && !loading && !error && !managingInstruments && !managingRoles && (
                <>
                    <div className="card">
                        <DataTable<UserDTO, SortableField>
                            columns={userColumns}
                            data={users}
                            sortState={sorting.state}
                            onSortChange={handleSort}
                            onRowClick={handleViewDetails}
                            expandedRowId={rowExpansion.expandedId}
                            isClosing={rowExpansion.isClosing}
                            renderExpandedContent={(user) => (
                                <UserDetailCard
                                    user={user}
                                    onBack={() => { rowExpansion.close(); setTimeout(() => setSelectedUser(null), 250) }}
                                    onToggleActive={handleToggleActive}
                                    onManageInstruments={openManageInstruments}
                                    onManageRoles={openManageRoles}
                                    backButtonLabel="Ocultar"
                                />
                            )}
                        />
                    </div>
                    <PaginationBar {...pagination.barProps} currentCount={users.length} />
                </>
            )}

            {mode === 'EDIT' && selectedUser && (
                <UserEditForm
                    selectedUser={selectedUser}
                    editPayload={editPayload}
                    onFieldChange={(field: any, value: any) => setEditPayload(prev => ({ ...prev, [field]: value }))}
                    onSubmit={handleSaveEdit}
                    onCancel={handleCancelForm}
                    saving={saving}
                />
            )}

            {mode === 'CREATE' && (
                <UserCreateForm
                    createPayload={createPayload}
                    roles={roles}
                    onFieldChange={(field: any, value: any) => setCreatePayload(prev => ({ ...prev, [field]: value }))}
                    onToggleRole={(name: string) => setCreatePayload(prev => ({
                        ...prev,
                        roles: prev.roles.includes(name)
                            ? prev.roles.filter(r => r !== name)
                            : [...prev.roles, name],
                    }))}
                    onSubmit={handleSubmitCreateUser}
                    onCancel={handleCancelForm}
                    saving={saving}
                />
            )}

            {selectedUser && managingRoles && (
                <UserRolesPanel
                    selectedUser={selectedUser}
                    roles={roles}
                    selectedRoleNames={selectedRoleNames}
                    onToggleRole={(name: string) => setSelectedRoleNames(prev =>
                        prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
                    )}
                    onSubmit={handleSaveUserRoles}
                    onCancel={() => { setManagingRoles(false); setSelectedRoleNames([]) }}
                    saving={saving}
                />
            )}

            {selectedUser && managingInstruments && (
                <UserInstrumentsPanel
                    selectedUser={selectedUser}
                    allGroupedInstruments={allGroupedInstruments}
                    selectedInstrumentIds={selectedInstrumentIds}
                    instrumentsLoading={instrumentsLoading}
                    onToggleInstrument={(id: number) => setSelectedInstrumentIds(prev =>
                        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                    )}
                    onSubmit={handleSaveUserInstruments}
                    onCancel={() => { setManagingInstruments(false); setSelectedInstrumentIds([]) }}
                    saving={saving}
                />
            )}

            <ConfirmDialog {...confirm.dialogProps} />
        </div>
    )
}

export default UsersPage