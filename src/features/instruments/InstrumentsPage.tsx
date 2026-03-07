import { type FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { extractErrorMessage } from '../../utils/errorHandler'
import {
  searchInstrumentsPage,
  createInstrument,
  deleteInstrument,
  updateInstrument,
} from '../../api/instrumentsApi'
import type { InstrumentDTO, InstrumentRequestDTO } from '../../types/instruments'
import { searchUsersPage, getUserById } from '../../api/usersApi'
import type { UserDTO } from '../../types/users'
import { PaginationBar } from '../../components/PaginationBar'
import { DataTable } from '../../components/DataTable'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { SearchFiltersPanel } from '../../components/Searchfilterspanel'
import { InstrumentForm } from '../../components/InstrumentForm'
import { UsersWithInstrumentPanel } from '../../components/UsersWithInstrumentPanel'
import { EditIcon, TrashIcon, EyeIcon } from '../../components/Icons'
import { usePagination, useSorting, useConfirmDialog, useRowExpansion } from '../../hooks'
import { useToast } from '../../context/toast/ToastContext'
import { ErrorState } from '../../components/ErrorState'
import { Spinner } from '../../components/Spinner'
import '../../styles/common.css'

/**
 * InstrumentsPage — Gestión de instrumentos (solo ADMIN).
 *
 * FASE 2 — Componentes extraídos:
 *   - InstrumentForm              formulario create/edit compartido (2 campos)
 *   - UsersWithInstrumentPanel    vista de usuarios por instrumento con expansión
 *
 * Componentes genéricos reutilizados de la refactorización de UsersPage:
 *   - SearchFiltersPanel          filtros colapsables con badge de activos
 *   - Icons                       botones icono con tooltip CSS puro
 *
 * HOOKS aplicados:
 *   - usePagination               tabla principal de instrumentos
 *   - useSorting<SortableField>   ordenación server-side de instrumentos
 *   - useSorting<UserSortField>   ordenación client-side de usuarios del panel
 *   - useConfirmDialog            confirmación de borrado
 *   - useRowExpansion<number>     expansión de fila en el panel de usuarios
 *
 * NOTA — Dos instancias de useSorting con comportamiento distinto:
 * La primera (sorting) pasa su campo a la API como parámetro de ordenación.
 * La segunda (userSorting) solo dispara un useEffect que ordena el array
 * en memoria, sin llamada a la API, porque la lista de usuarios por
 * instrumento se carga completa de una sola vez (tamaño acotado a ~100).
 */

type ViewMode        = 'LIST' | 'CREATE' | 'EDIT' | 'USERS'
type SortableField   = 'instrumentName' | 'voice'
type UserSortField   = 'username' | 'firstName' | 'lastName' | 'email' | 'bandJoinDate'

const EMPTY_PAYLOAD: InstrumentRequestDTO = { instrumentName: '', voice: '' }

function InstrumentsPage() {
  const { token, hasRole } = useAuth()
  const isAdmin = hasRole('ADMIN')
  const { showToast } = useToast()

  const [instruments, setInstruments] = useState<InstrumentDTO[]>([])
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  // ── Hooks reutilizables ───────────────────────────────────────────────────
  const pagination   = usePagination({ defaultSize: 10 })
  const sorting      = useSorting<SortableField>()
  const userSorting  = useSorting<UserSortField>()
  const confirm      = useConfirmDialog()
  const rowExpansion = useRowExpansion<number>()

  // ── Estado de vista ───────────────────────────────────────────────────────
  const [mode, setMode]                               = useState<ViewMode>('LIST')
  const [selectedInstrument, setSelectedInstrument]   = useState<InstrumentDTO | null>(null)

  // Panel de usuarios
  const [usersWithInstrument, setUsersWithInstrument] = useState<UserDTO[]>([])
  const [usersLoading, setUsersLoading]               = useState(false)
  const [selectedUserDetail, setSelectedUserDetail]   = useState<UserDTO | null>(null)
  const [userDetailLoading, setUserDetailLoading]     = useState(false)

  // Filtros
  const [filterName, setFilterName]       = useState('')
  const [filterVoice, setFilterVoice]     = useState('')
  const [searchName, setSearchName]       = useState('')
  const [searchVoice, setSearchVoice]     = useState('')
  const [searchTrigger, setSearchTrigger] = useState(0)

  // Formulario único para create y edit
  const [formPayload, setFormPayload] = useState<InstrumentRequestDTO>(EMPTY_PAYLOAD)
  const [editing, setEditing]         = useState<InstrumentDTO | null>(null)

  // Badge: cuántos filtros efectivos están activos
  const activeFiltersCount = [searchName, searchVoice].filter(Boolean).length

  // ── Columnas de instrumentos ──────────────────────────────────────────────
  // La columna de acciones usa botones icono con tooltip CSS puro.
  // e.stopPropagation() evita que el click active onRowClick del DataTable.
  // No hay onRowClick en esta tabla (no hay expansión de instrumentos),
  // pero se añade igualmente para robustez ante cambios futuros.
  const instrumentColumns = [
    {
      key: 'instrumentName', header: 'Nombre', sortable: true,
      sortField: 'instrumentName' as SortableField, width: '48%',
    },
    {
      key: 'voice', header: 'Voz', sortable: true,
      sortField: 'voice' as SortableField, width: '35%',
    },
    {
      key: 'actions', header: 'Acciones', sortable: false, width: '17%',
      render: (i: InstrumentDTO) => (
        <div className="actions-container">
          <span className="tooltip-wrap" data-tooltip="Ver usuarios">
            <button
              type="button" className="btn-icon btn-icon-neutral"
              aria-label="Ver usuarios con este instrumento"
              onClick={e => { e.stopPropagation(); handleViewUsers(i) }}
            >
              <EyeIcon />
            </button>
          </span>
          <span className="tooltip-wrap" data-tooltip="Editar">
            <button
              type="button" className="btn-icon btn-icon-edit"
              aria-label="Editar instrumento"
              onClick={e => { e.stopPropagation(); handleOpenEdit(i) }}
            >
              <EditIcon />
            </button>
          </span>
          <span className="tooltip-wrap" data-tooltip="Eliminar">
            <button
              type="button" className="btn-icon btn-icon-danger"
              aria-label="Eliminar instrumento"
              onClick={e => { e.stopPropagation(); handleDelete(i) }}
            >
              <TrashIcon />
            </button>
          </span>
        </div>
      ),
    },
  ]

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!token || !isAdmin) return
    const load = async () => {
      setLoading(true); setError(null)
      try {
        const sort = sorting.field != null
          ? [`${sorting.field},${sorting.direction}`]
          : undefined
        const data = await searchInstrumentsPage(
          {
            page: pagination.page, size: pagination.size,
            instrumentName: searchName  || undefined,
            voice:          searchVoice || undefined,
            sort,
          },
          token,
        )
        setInstruments(data.content ?? [])
        pagination.setTotals(data.totalPages ?? 1, data.totalElements ?? 0)
      } catch (e: any) {
        setError(extractErrorMessage(e, 'Error cargando instrumentos'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [
    token, isAdmin,
    pagination.page, pagination.size,
    searchName, searchVoice,
    sorting.field, sorting.direction,
    searchTrigger,
  ])

  // Ordenación client-side de la tabla de usuarios del panel.
  // Solo se ejecuta cuando cambia el campo o la dirección.
  // El array de entrada ya está en memoria; no hay llamada a la API.
  useEffect(() => {
    if (!userSorting.field || usersWithInstrument.length === 0) return

    const field = userSorting.field
    const dir   = userSorting.direction

    setUsersWithInstrument(prev => [...prev].sort((a, b) => {
      if (field === 'bandJoinDate') {
        const aVal = a.bandJoinDate ? new Date(a.bandJoinDate).getTime() : 0
        const bVal = b.bandJoinDate ? new Date(b.bandJoinDate).getTime() : 0
        if (aVal < bVal) return dir === 'asc' ? -1 : 1
        if (aVal > bVal) return dir === 'asc' ?  1 : -1
        return 0
      }
      const aVal = field === 'lastName'
        ? [a.lastName, a.secondLastName].filter(Boolean).join(' ').toLowerCase()
        : (a[field] ?? '').toLowerCase()
      const bVal = field === 'lastName'
        ? [b.lastName, b.secondLastName].filter(Boolean).join(' ').toLowerCase()
        : (b[field] ?? '').toLowerCase()

      if (aVal < bVal) return dir === 'asc' ? -1 : 1
      if (aVal > bVal) return dir === 'asc' ?  1 : -1
      return 0
    }))
  }, [userSorting.field, userSorting.direction])

  // ── Guard de permisos ─────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="page-container">
        <h1 className="page-title">Gestión de instrumentos</h1>
        <p>No tienes permisos para ver esta sección.</p>
      </div>
    )
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  const switchToList = () => {
    setMode('LIST'); setFormPayload(EMPTY_PAYLOAD); setEditing(null)
  }

  // ── Handlers de búsqueda ──────────────────────────────────────────────────

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault()
    pagination.goToPage(0)
    setSearchName(filterName.trim())
    setSearchVoice(filterVoice.trim())
    switchToList()
    setSearchTrigger(prev => prev + 1)
  }

  const handleResetFilters = () => {
    setFilterName(''); setFilterVoice('')
    setSearchName(''); setSearchVoice('')
    pagination.goToPage(0)
    switchToList()
    setSearchTrigger(prev => prev + 1)
  }

  const handleSort = (field: SortableField) => {
    pagination.goToPage(0); sorting.handleSortChange(field)
  }

  // ── CRUD instrumento ──────────────────────────────────────────────────────

  const handleOpenCreate = () => {
    setMode('CREATE'); setFormPayload(EMPTY_PAYLOAD); setEditing(null)
  }

  const handleOpenEdit = (inst: InstrumentDTO) => {
    setMode('EDIT'); setEditing(inst)
    setFormPayload({ instrumentName: inst.instrumentName, voice: inst.voice ?? '' })
  }

  const handleFormFieldChange = (field: keyof InstrumentRequestDTO, value: string) =>
    setFormPayload(prev => ({ ...prev, [field]: value }))

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault(); if (!token) return
    try {
      setLoading(true); setError(null)
      await createInstrument(formPayload, token)
      showToast('Instrumento creado correctamente', 'success')
      switchToList(); pagination.goToPage(0)
      setSearchTrigger(prev => prev + 1)
    } catch (err) {
      showToast(extractErrorMessage(err, 'Error creando instrumento'), 'error')
    } finally { setLoading(false) }
  }

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault(); if (!token || !editing) return
    try {
      setLoading(true); setError(null)
      const updated = await updateInstrument(editing.id, formPayload, editing.version, token)
      setInstruments(prev => prev.map(i => i.id === updated.id ? updated : i))
      showToast('Instrumento actualizado correctamente', 'success')
      switchToList()
      setSearchTrigger(prev => prev + 1)
    } catch (e: any) {
      const s = e?.response?.status
      showToast(
        s === 412 || s === 428
          ? 'El instrumento ha sido modificado. Recarga la lista antes de editar.'
          : extractErrorMessage(e, 'Error actualizando instrumento'),
        'error'
      )
    } finally { setLoading(false) }
  }

  const handleDelete = (inst: InstrumentDTO) => {
    if (!token) return
    const name = inst.instrumentName + (inst.voice ? ` — ${inst.voice}` : '')
    confirm.open({
      title:   `Eliminar "${name}"`,
      message: `¿Seguro que quieres borrar "${name}"?\nEsta acción no se puede deshacer.`,
      variant: 'danger',
      onConfirm: async () => {
        confirm.close()
        try {
          setLoading(true); setError(null)
          await deleteInstrument(inst.id, inst.version, token)
          showToast('Instrumento eliminado correctamente', 'success')
          setInstruments(prev => prev.filter(i => i.id !== inst.id))
          setSearchTrigger(prev => prev + 1)
        } catch (e: any) {
          const s = e?.response?.status
          showToast(
            s === 412 || s === 428
              ? 'El instrumento ha cambiado. Recarga la lista antes de borrar.'
              : extractErrorMessage(e, 'Error borrando instrumento'),
            'error'
          )
        } finally { setLoading(false) }
      },
    })
  }

  // ── Handlers del panel de usuarios ────────────────────────────────────────

  const handleViewUsers = async (inst: InstrumentDTO) => {
    if (!token) return
    setSelectedInstrument(inst); setMode('USERS')
    setUsersLoading(true); setError(null)
    setSelectedUserDetail(null); rowExpansion.forceClose()
    try {
      const data = await searchUsersPage({ instrumentId: inst.id, page: 0, size: 100 }, token)
      setUsersWithInstrument(data.content ?? [])
    } catch (e) {
      showToast(extractErrorMessage(e, 'Error cargando usuarios del instrumento'), 'error')
    } finally { setUsersLoading(false) }
  }

  const handleUserRowClick = async (user: UserDTO) => {
    if (!token) return
    if (rowExpansion.expandedId === user.id) {
      rowExpansion.close()
      setTimeout(() => setSelectedUserDetail(null), 250)
      return
    }
    rowExpansion.toggle(user.id ?? null)
    setUserDetailLoading(true)
    try {
      setSelectedUserDetail(await getUserById(user.id, token))
    } catch (e) {
      showToast(extractErrorMessage(e, 'Error cargando detalles del usuario'), 'error')
    } finally { setUserDetailLoading(false) }
  }

  const handleBackToUsersList = () => {
    rowExpansion.close()
    setTimeout(() => setSelectedUserDetail(null), 250)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      <h1 className="page-title">Gestión de instrumentos</h1>

      {!error && (
      <SearchFiltersPanel
        activeFiltersCount={activeFiltersCount}
        onSubmit={handleSearchSubmit}
        actionButton={
          <button type="button" className="button-secondary" onClick={handleOpenCreate}>
            + Nuevo instrumento
          </button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.5rem' }}>
          <div className="search-grid">
            <div className="form-field">
              <span className="label-text">Nombre</span>
              <input
                type="text" placeholder="Buscar por nombre"
                value={filterName} onChange={e => setFilterName(e.target.value)}
                className="input-full-width"
              />
            </div>
            <div className="form-field">
              <span className="label-text">Voz</span>
              <input
                type="text" placeholder="Buscar por voz"
                value={filterVoice} onChange={e => setFilterVoice(e.target.value)}
                className="input-full-width"
              />
            </div>
          </div>
        </div>

        <div className="search-actions-row" style={{ justifyContent: 'space-between' }}>
          <button
            type="button" className="button-subtle" onClick={handleResetFilters}
            style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}
          >
            Resetear filtros
          </button>
          <button type="submit" className="button-primary">Buscar</button>
        </div>
      </SearchFiltersPanel>
      )}

      {loading && <Spinner />}
      {error   && <ErrorState message={error} onRetry={() => setSearchTrigger(prev => prev + 1)} />}

      {mode === 'LIST' && !loading && !error && (
        <>
          <div className="card">
            <DataTable<InstrumentDTO, SortableField>
              columns={instrumentColumns}
              data={instruments}
              sortState={sorting.state}
              onSortChange={handleSort}
              onRowClick={handleViewUsers}
              getRowTitle={() => 'Ver usuarios con este instrumento'}
            />
          </div>
          <PaginationBar {...pagination.barProps} currentCount={instruments.length} />
        </>
      )}

      {(mode === 'CREATE' || mode === 'EDIT') && (
        <InstrumentForm
          editing={editing}
          payload={formPayload}
          onFieldChange={handleFormFieldChange}
          onSubmit={mode === 'CREATE' ? handleCreateSubmit : handleEditSubmit}
          onCancel={switchToList}
          saving={loading}
        />
      )}

      {mode === 'USERS' && selectedInstrument && (
        <UsersWithInstrumentPanel
          instrument={selectedInstrument}
          users={usersWithInstrument}
          usersLoading={usersLoading}
          selectedUserDetail={selectedUserDetail}
          userDetailLoading={userDetailLoading}
          expandedUserId={rowExpansion.expandedId}
          isClosing={rowExpansion.isClosing}
          sortState={userSorting.state}
          onSortChange={userSorting.handleSortChange}
          onRowClick={handleUserRowClick}
          onBack={handleBackToUsersList}
          onBackToList={switchToList}
        />
      )}

      <ConfirmDialog {...confirm.dialogProps} />
    </div>
  )
}

export default InstrumentsPage