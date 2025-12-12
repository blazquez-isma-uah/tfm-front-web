import { type FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import {
  searchInstrumentsPage,
  createInstrument,
  deleteInstrument,
  updateInstrument,
} from '../../api/instrumentsApi'
import type {
  InstrumentDTO,
  InstrumentRequestDTO,
} from '../../types/instruments'
import { searchUsersPage, getUserById } from '../../api/usersApi'
import type { UserDTO } from '../../types/users'
import { PaginationBar } from '../../components/PaginationBar'
import { DataTable, type SortState } from '../../components/DataTable'
import { UserDetailCard } from '../../components/UserDetailCard'
import { formatDate } from '../../utils/date'
import '../../styles/common.css'

type ViewMode = 'LIST' | 'CREATE' | 'EDIT' | 'USERS'

type SortableField = 'instrumentName' | 'voice'
type UserSortableField = 'username' | 'firstName' | 'lastName' | 'email'

function InstrumentsPage() {
  const { token, hasRole } = useAuth()
  const isAdmin = hasRole('ADMIN')

  const [mode, setMode] = useState<ViewMode>('LIST')

  const [instruments, setInstruments] = useState<InstrumentDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estados para ver usuarios por instrumento
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentDTO | null>(null)
  const [usersWithInstrument, setUsersWithInstrument] = useState<UserDTO[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserDTO | null>(null)
  const [userDetailLoading, setUserDetailLoading] = useState(false)
  const [userSortField, setUserSortField] = useState<UserSortableField | null>(null)
  const [userSortDirection, setUserSortDirection] = useState<'asc' | 'desc'>('asc')

  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const [searchTrigger, setSearchTrigger] = useState(0)

  // filtros visibles
  const [filterName, setFilterName] = useState('')
  const [filterVoice, setFilterVoice] = useState('')
  // filtros efectivos
  const [searchName, setSearchName] = useState('')
  const [searchVoice, setSearchVoice] = useState('')

  // ordenación
  const [sortField, setSortField] = useState<SortableField | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const sortState: SortState<SortableField> = {
    field: sortField,
    direction: sortDirection,
  }

  const userSortState: SortState<UserSortableField> = {
    field: userSortField,
    direction: userSortDirection,
  }

  const userColumns = [
    {
      key: 'username',
      header: 'Username',
      sortable: true,
      sortField: 'username' as UserSortableField,
      width: '20%',
    },
    {
      key: 'firstName',
      header: 'Nombre',
      sortable: true,
      sortField: 'firstName' as UserSortableField,
      width: '20%',
    },
    {
      key: 'lastName',
      header: 'Apellidos',
      sortable: true,
      sortField: 'lastName' as UserSortableField,
      width: '30%',
      render: (u: UserDTO) =>
        [u.lastName, u.secondLastName].filter(Boolean).join(' '),
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      sortField: 'email' as UserSortableField,
      width: '20%',
    },
    {
      key: 'active',
      header: 'Activo',
      sortable: false,
      width: '10%',
      render: (u: UserDTO) => (u.active ? 'Sí' : 'No'),
    },
  ]

  const instrumentColumns = [
    {
      key: 'instrumentName',
      header: 'Nombre',
      sortable: true,
      sortField: 'instrumentName' as SortableField,
      width: '40%',
    },
    {
      key: 'voice',
      header: 'Voz',
      sortable: true,
      sortField: 'voice' as SortableField,
      width: '20%',
    },
    {
      key: 'actions',
      header: 'Acciones',
      sortable: false,
      width: '40%',
      render: (i: InstrumentDTO) => (
        <div className="actions-container-wide">
          <button
            type="button"
            className="button-subtle"
            onClick={() => handleViewUsers(i)}
          >
            Usuarios
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={() => handleOpenEdit(i)}
          >
            Editar
          </button>
          <button
            type="button"
            className="button-danger"
            onClick={() => handleDelete(i)}
          >
            Eliminar
          </button>
        </div>
      ),
    },
  ]

  // Form "Nuevo"
  const [newInstrument, setNewInstrument] = useState<InstrumentRequestDTO>({
    instrumentName: '',
    voice: '',
  })

  // Form "Editar"
  const [editing, setEditing] = useState<InstrumentDTO | null>(null)
  const [editData, setEditData] = useState<InstrumentRequestDTO>({
    instrumentName: '',
    voice: '',
  })

  useEffect(() => {
    if (!token || !isAdmin) return

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const sort =
          sortField != null ? [`${sortField},${sortDirection}`] : undefined

        const data = await searchInstrumentsPage(
          {
            page,
            size,
            instrumentName: searchName || undefined,
            voice: searchVoice || undefined,
            sort,
          },
          token,
        )
        setInstruments(data.content ?? [])
        setTotalPages(data.totalPages ?? 1)
        setTotalElements(data.totalElements ?? 0)
      } catch (e: any) {
        console.error('Error loading instruments', e)
        setError('Error cargando instrumentos')
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
    searchName,
    searchVoice,
    sortField,
    sortDirection,
    searchTrigger,
  ])

  // Ordenar usuarios localmente
  useEffect(() => {
    if (!userSortField) return

    const sorted = [...usersWithInstrument].sort((a, b) => {
      let aVal: any = a[userSortField]
      let bVal: any = b[userSortField]

      if (userSortField === 'lastName') {
        aVal = [a.lastName, a.secondLastName].filter(Boolean).join(' ').toLowerCase()
        bVal = [b.lastName, b.secondLastName].filter(Boolean).join(' ').toLowerCase()
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = (bVal || '').toLowerCase()
      }

      if (aVal < bVal) return userSortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return userSortDirection === 'asc' ? 1 : -1
      return 0
    })

    setUsersWithInstrument(sorted)
  }, [userSortField, userSortDirection])

  if (!isAdmin) {
    return (
      <div className="page-container">
        <h1 className="page-title">Gestión de instrumentos</h1>
        <p>No tienes permisos para ver esta sección.</p>
      </div>
    )
  }

  // ---- helpers de UI ----

  const resetForms = () => {
    setNewInstrument({ instrumentName: '', voice: '' })
    setEditing(null)
    setEditData({ instrumentName: '', voice: '' })
  }

  const switchToList = () => {
    setMode('LIST')
    resetForms()
  }

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault()
    switchToList()
    setPage(0)
    setSearchName(filterName.trim())
    setSearchVoice(filterVoice.trim())
    setSearchTrigger((prev) => prev + 1)
  }

  const handleOpenCreate = () => {
    setFilterName('')
    setFilterVoice('')
    setMode('CREATE')
    setNewInstrument({ instrumentName: '', voice: '' })
    setEditing(null)
    setEditData({ instrumentName: '', voice: '' })
  }

  const handleOpenEdit = (inst: InstrumentDTO) => {
    setFilterName('')
    setFilterVoice('')
    setMode('EDIT')
    setEditing(inst)
    setEditData({
      instrumentName: inst.instrumentName,
      voice: inst.voice,
    })
    setNewInstrument({ instrumentName: '', voice: '' })
  }

  const handleViewUsers = async (inst: InstrumentDTO) => {
    if (!token) return

    setSelectedInstrument(inst)
    setMode('USERS')
    setUsersLoading(true)
    setError(null)
    setSelectedUserDetail(null)

    try {
      const data = await searchUsersPage(
        {
          instrumentId: inst.id,
          page: 0,
          size: 100, // Mostrar muchos usuarios
        },
        token,
      )
      setUsersWithInstrument(data.content ?? [])
    } catch (e) {
      console.error('Error cargando usuarios del instrumento', e)
      setError('Error cargando usuarios del instrumento')
    } finally {
      setUsersLoading(false)
    }
  }

  const handleUserRowClick = async (user: UserDTO) => {
    if (!token) return

    setUserDetailLoading(true)
    try {
      const fullUser = await getUserById(user.id, token)
      setSelectedUserDetail(fullUser)
    } catch (e) {
      console.error('Error cargando detalles del usuario', e)
      setError('Error cargando detalles del usuario')
    } finally {
      setUserDetailLoading(false)
    }
  }

  const handleUserSort = (field: UserSortableField) => {
    if (userSortField === field) {
      setUserSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setUserSortField(field)
      setUserSortDirection('asc')
    }
  }

  const handleBackToUsersList = () => {
    setSelectedUserDetail(null)
  }

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!token) return

    try {
      setLoading(true)
      setError(null)
      await createInstrument(newInstrument, token)
      switchToList()
      setPage(0)
      setSearchTrigger((prev) => prev + 1)
    } catch (err) {
      console.error('Error creando instrumento', err)
      setError('Error creando instrumento')
    } finally {
      setLoading(false)
    }
  }

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!token || !editing) return

    try {
      setLoading(true)
      setError(null)
      const updated = await updateInstrument(
        editing.id,
        editData,
        editing.version,
        token,
      )
      setInstruments((prev) =>
        prev.map((i) => (i.id === updated.id ? updated : i)),
      )
      switchToList()
      setSearchTrigger((prev) => prev + 1)
    } catch (e: any) {
      console.error('Error updating instrument', e)
      const status = e?.response?.status
      if (status === 412 || status === 428) {
        setError(
          'El instrumento ha sido modificado por otro usuario. Recarga datos.',
        )
      } else {
        setError('Error actualizando instrumento')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (inst: InstrumentDTO) => {
    if (!token) return
    const ok = window.confirm(
      `¿Seguro que quieres borrar el instrumento "${inst.instrumentName}" (${inst.voice})?`,
    )
    if (!ok) return

    try {
      setLoading(true)
      setError(null)
      await deleteInstrument(inst.id, inst.version, token)
      setInstruments((prev) => prev.filter((i) => i.id !== inst.id))
      setSearchTrigger((prev) => prev + 1)
    } catch (e: any) {
      console.error('Error deleting instrument', e)
      const status = e?.response?.status
      if (status === 412 || status === 428) {
        setError('El instrumento ha cambiado. Recarga la lista antes de borrar.')
      } else {
        setError('Error borrando instrumento')
      }
    } finally {
      setLoading(false)
    }
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

  // ---- render ----

  return (
    <div className="page-container">
      <h1 className="page-title">Gestión de instrumentos</h1>

      {/* Toolbar búsqueda + nuevo */}
      <form onSubmit={handleSearchSubmit} className="toolbar">
        <input
          type="text"
          placeholder="Nombre"
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          className="input-base"
          style={{ minWidth: '180px' }}
        />
        <input
          type="text"
          placeholder="Voz"
          value={filterVoice}
          onChange={(e) => setFilterVoice(e.target.value)}
          className="input-base"
          style={{ minWidth: '140px' }}
        />

        <button type="submit" className="button-primary">
          Buscar
        </button>

        <div className="ml-auto">
          <button type="button" className="button-secondary" onClick={handleOpenCreate}>
            + Nuevo instrumento
          </button>
        </div>
      </form>

      {loading && <p>Cargando instrumentos...</p>}
      {error && <p className="error-message">{error}</p>}

      {/* LISTA */}
      {mode === 'LIST' && !loading && !error && (
        <>
          <div className="card">
            <DataTable<InstrumentDTO, SortableField>
              columns={instrumentColumns}
              data={instruments}
              sortState={sortState}
              onSortChange={handleSort}
            />
          </div>
          <PaginationBar
            page={page}
            totalPages={totalPages}
            pageSize={size}
            currentCount={instruments.length}
            totalElements={totalElements}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      )}

      {/* NUEVO */}
      {mode === 'CREATE' && (
        <form onSubmit={handleCreateSubmit} className="form-card">
          <h2 className="section-title">
            Nuevo instrumento
          </h2>

          <div className="form-grid">
            <div className="form-field">
              <span className="label-text">Nombre</span>
              <input
                type="text"
                value={newInstrument.instrumentName}
                onChange={(e) =>
                  setNewInstrument((prev) => ({
                    ...prev,
                    instrumentName: e.target.value,
                  }))
                }
                required
                className="input-base"
              />
            </div>

            <div className="form-field">
              <span className="label-text">Voz</span>
              <input
                type="text"
                value={newInstrument.voice}
                onChange={(e) =>
                  setNewInstrument((prev) => ({
                    ...prev,
                    voice: e.target.value,
                  }))
                }
                required
                className="input-base"
              />
            </div>
          </div>

          <div className="button-row">
            <button type="submit" className="button-primary">
              Guardar
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={switchToList}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* EDITAR */}
      {mode === 'EDIT' && editing && (
        <form onSubmit={handleEditSubmit} className="form-card">
          <h2 className="section-title">
            Editar instrumento
          </h2>

          <div className="form-grid">
            <div className="form-field">
              <span className="label-text">Nombre</span>
              <input
                type="text"
                value={editData.instrumentName}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    instrumentName: e.target.value,
                  }))
                }
                required
                className="input-base"
              />
            </div>

            <div className="form-field">
              <span className="label-text">Voz</span>
              <input
                type="text"
                value={editData.voice}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    voice: e.target.value,
                  }))
                }
                required
                className="input-base"
              />
            </div>
          </div>

          <div className="button-row">
            <button type="submit" className="button-primary">
              Guardar cambios
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={switchToList}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* VER USUARIOS */}
      {mode === 'USERS' && selectedInstrument && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h2 className="section-title">
            Usuarios con {selectedInstrument.instrumentName} {selectedInstrument.voice}
          </h2>

          {usersLoading && <p>Cargando usuarios...</p>}

          {!usersLoading && usersWithInstrument.length === 0 && (
            <p>No hay usuarios asignados a este instrumento.</p>
          )}

          {!usersLoading && usersWithInstrument.length > 0 && !selectedUserDetail && (
            <DataTable<UserDTO, UserSortableField>
              columns={userColumns}
              data={usersWithInstrument}
              sortState={userSortState}
              onSortChange={handleUserSort}
              onRowClick={handleUserRowClick}
            />
          )}

          {userDetailLoading && (
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
              <p>Cargando detalles del usuario...</p>
            </div>
          )}

          {selectedUserDetail && !userDetailLoading && (
            <UserDetailCard
              user={selectedUserDetail}
              onBack={handleBackToUsersList}
              showButtons={true}
            />
          )}

          {!selectedUserDetail && (
            <div className="button-row-1rem">
              <button
                type="button"
                className="button-secondary"
                onClick={switchToList}
              >
                Volver a la lista
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default InstrumentsPage
