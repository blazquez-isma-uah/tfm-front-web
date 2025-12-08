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
import { PaginationBar } from '../../components/PaginationBar'
import { DataTable, type SortState } from '../../components/DataTable'

// ==== estilos compartidos con UsersPage (copiados) ====

const pageContainerStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '1.5rem 1.75rem',
}

const pageTitleStyle: React.CSSProperties = {
  fontSize: '1.8rem',
  fontWeight: 700,
  marginBottom: '1rem',
}

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: '0.75rem',
  border: '1px solid #e5e7eb',
  padding: '1rem 1.25rem',
  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)',
}

const toolbarStyle: React.CSSProperties = {
  ...cardStyle,
  marginBottom: '1rem',
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.75rem',
  alignItems: 'center',
}

const inputBaseStyle: React.CSSProperties = {
  padding: '0.45rem 0.6rem',
  borderRadius: '0.45rem',
  border: '1px solid #d1d5db',
  fontSize: '0.9rem',
  boxSizing: 'border-box',
}

const buttonBase: React.CSSProperties = {
  border: 'none',
  borderRadius: '999px',
  padding: '0.38rem 0.9rem',
  fontSize: '0.85rem',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.3rem',
}

const primaryButton: React.CSSProperties = {
  ...buttonBase,
  backgroundColor: '#2563eb',
  color: '#ffffff',
}

const secondaryButton: React.CSSProperties = {
  ...buttonBase,
  backgroundColor: '#e5e7eb',
  color: '#111827',
}

const subtleButton: React.CSSProperties = {
  ...buttonBase,
  backgroundColor: '#f3f4f6',
  color: '#111827',
}

const dangerButton: React.CSSProperties = {
  ...buttonBase,
  backgroundColor: '#fee2e2',
  color: '#b91c1c',
}

const formCardStyle: React.CSSProperties = {
  ...cardStyle,
  marginTop: '1.25rem',
}

const formGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '0.75rem 1rem',
}

const formFieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  fontSize: '0.85rem',
}

const labelTextStyle: React.CSSProperties = {
  fontWeight: 500,
  color: '#374151',
}

// =====================================================

type ViewMode = 'LIST' | 'CREATE' | 'EDIT'

type SortableField = 'instrumentName' | 'voice'

function InstrumentsPage() {
  const { token, hasRole } = useAuth()
  const isAdmin = hasRole('ADMIN')

  const [mode, setMode] = useState<ViewMode>('LIST')

  const [instruments, setInstruments] = useState<InstrumentDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const instrumentColumns = [
    {
      key: 'instrumentName',
      header: 'Nombre',
      sortable: true,
      sortField: 'instrumentName' as SortableField,
    },
    {
      key: 'voice',
      header: 'Voz',
      sortable: true,
      sortField: 'voice' as SortableField,
    },
    {
      key: 'actions',
      header: 'Acciones',
      sortable: false,
      width: 220,
      render: (i: InstrumentDTO) => (
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            style={secondaryButton}
            onClick={() => handleOpenEdit(i)}
          >
            Editar
          </button>
          <button
            type="button"
            style={dangerButton}
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

  if (!isAdmin) {
    return (
      <div style={pageContainerStyle}>
        <h1 style={pageTitleStyle}>Gestión de instrumentos</h1>
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
    <div style={pageContainerStyle}>
      <h1 style={pageTitleStyle}>Gestión de instrumentos</h1>

      {/* Toolbar búsqueda + nuevo */}
      <form onSubmit={handleSearchSubmit} style={toolbarStyle}>
        <input
          type="text"
          placeholder="Nombre"
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          style={{ ...inputBaseStyle, minWidth: '180px' }}
        />
        <input
          type="text"
          placeholder="Voz"
          value={filterVoice}
          onChange={(e) => setFilterVoice(e.target.value)}
          style={{ ...inputBaseStyle, minWidth: '140px' }}
        />

        <button type="submit" style={primaryButton}>
          Buscar
        </button>

        <div style={{ marginLeft: 'auto' }}>
          <button type="button" style={secondaryButton} onClick={handleOpenCreate}>
            + Nuevo instrumento
          </button>
        </div>
      </form>

      {loading && <p>Cargando instrumentos...</p>}
      {error && <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>}

      {/* LISTA */}
      {mode === 'LIST' && !loading && !error && (
        <>
          <div style={cardStyle}>
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
        <form onSubmit={handleCreateSubmit} style={formCardStyle}>
          <h2
            style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              marginBottom: '0.75rem',
            }}
          >
            Nuevo instrumento
          </h2>

          <div style={formGridStyle}>
            <div style={formFieldStyle}>
              <span style={labelTextStyle}>Nombre</span>
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
                style={inputBaseStyle}
              />
            </div>

            <div style={formFieldStyle}>
              <span style={labelTextStyle}>Voz</span>
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
                style={inputBaseStyle}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: '0.75rem',
              display: 'flex',
              gap: '0.5rem',
              justifyContent: 'flex-end',
            }}
          >
            <button type="submit" style={primaryButton}>
              Guardar
            </button>
            <button
              type="button"
              style={secondaryButton}
              onClick={switchToList}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* EDITAR */}
      {mode === 'EDIT' && editing && (
        <form onSubmit={handleEditSubmit} style={formCardStyle}>
          <h2
            style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              marginBottom: '0.75rem',
            }}
          >
            Editar instrumento
          </h2>

          <div style={formGridStyle}>
            <div style={formFieldStyle}>
              <span style={labelTextStyle}>Nombre</span>
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
                style={inputBaseStyle}
              />
            </div>

            <div style={formFieldStyle}>
              <span style={labelTextStyle}>Voz</span>
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
                style={inputBaseStyle}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: '0.75rem',
              display: 'flex',
              gap: '0.5rem',
              justifyContent: 'flex-end',
            }}
          >
            <button type="submit" style={primaryButton}>
              Guardar cambios
            </button>
            <button
              type="button"
              style={secondaryButton}
              onClick={switchToList}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default InstrumentsPage
