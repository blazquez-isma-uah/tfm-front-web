import { type FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import {
    searchInstrumentsPage,
    createInstrument,
    deleteInstrument,
    updateInstrument,
} from '../../api/instrumentsApi'
import type { InstrumentDTO, InstrumentRequestDTO } from '../../types/instruments'
import { PaginationBar } from '../../components/PaginationBar'
import { DataTable, type SortState } from '../../components/DataTable'

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


    // Valores que ve el usuario en los inputs de búsqueda
    const [filterName, setFilterName] = useState('')
    const [filterVoice, setFilterVoice] = useState('')
    // Valores que realmente se usan en la llamada (solo actualizados al pulsar Buscar)
    const [searchName, setSearchName] = useState('')
    const [searchVoice, setSearchVoice] = useState('')
    // Ordenación
    const [sortField, setSortField] = useState<SortableField | null>(null)
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
    const sortState: SortState<SortableField> = {
        field: sortField,
        direction: sortDirection,
    }

    // columnas
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
            width: 200,
            render: (i: InstrumentDTO) => (
                <>
                    <button
                        type="button"
                        style={{ marginRight: '0.3rem' }}
                        onClick={() => handleOpenEdit(i)}
                    >
                        Editar
                    </button>
                    <button type="button" onClick={() => handleDelete(i)}>
                        Eliminar
                    </button>
                </>
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

    // Carga de la lista (solo depende de filtros efectivos + paginación)
    useEffect(() => {
        if (!token || !isAdmin) return

        const load = async () => {
            setLoading(true)
            setError(null)
            try {
                const sort = sortField != null ? [`${sortField},${sortDirection}`] : undefined

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
    }, [token, isAdmin, page, size, searchName, searchVoice, sortField, sortDirection])

    if (!isAdmin) {
        return (
            <div>
                <h1>Gestión de Instrumentos</h1>
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
        // Cerramos cualquier formulario y mostramos lista
        switchToList()
        // Reiniciamos paginación
        setPage(0)
        // Aplicamos filtros efectivos
        setSearchName(filterName.trim())
        setSearchVoice(filterVoice.trim())
    }

    const handleOpenCreate = () => {
        // limpiar filtros al abrir formulario
        setFilterName('')
        setFilterVoice('')
        setMode('CREATE')
        // formulario nuevo siempre limpio
        setNewInstrument({ instrumentName: '', voice: '' })
        // garantizamos que el de edición quede limpio
        setEditing(null)
        setEditData({ instrumentName: '', voice: '' })
    }

    const handleOpenEdit = (inst: InstrumentDTO) => {
        // limpiar filtros al abrir formulario
        setFilterName('')
        setFilterVoice('')
        setMode('EDIT')
        setEditing(inst)
        setEditData({
            instrumentName: inst.instrumentName,
            voice: inst.voice,
        })
        // por si acaso, dejamos el de nuevo limpio
        setNewInstrument({ instrumentName: '', voice: '' })
    }

    const handleCreateSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (!token) return

        try {
            setLoading(true)
            setError(null)
            await createInstrument(newInstrument, token)
            // Al guardar: volvemos a lista, reseteamos forms y recargamos desde la página 0
            switchToList()
            setPage(0)
            // Forzamos recarga con los filtros efectivos actuales (searchName/searchVoice)
            // el useEffect ya se encargará
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
            // Actualizamos en memoria la lista actual (sin perder filtros ni página)
            setInstruments((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
            // Volvemos a lista
            switchToList()
        } catch (e: any) {
            console.error('Error updating instrument', e)
            const status = e?.response?.status
            if (status === 412 || status === 428) {
                setError('El instrumento ha sido modificado por otro usuario. Recarga datos.')
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

    const handleSort = (field: 'instrumentName' | 'voice') => {
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

    const handlePageChange = (newPage: number) => {
        setPage(newPage)
    }

    const handlePageSizeChange = (newSize: number) => {
        // al cambiar tamaño de página, lo normal es ir a la primera
        setSize(newSize)
        setPage(0)
    }

    // ---- render ----

    return (
        <div>
            <h1>Gestión de Instrumentos</h1>

            {/* Toolbar con formulario de búsqueda + botón Nuevo */}
            <form
                onSubmit={handleSearchSubmit}
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    alignItems: 'center',
                    marginBottom: '1rem',
                }}
            >
                <input
                    type="text"
                    placeholder="Nombre"
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    style={{ padding: '0.4rem 0.6rem', minWidth: '180px' }}
                />
                <input
                    type="text"
                    placeholder="Voz"
                    value={filterVoice}
                    onChange={(e) => setFilterVoice(e.target.value)}
                    style={{ padding: '0.4rem 0.6rem', minWidth: '140px' }}
                />
                <button type="submit">Buscar</button>

                <div style={{ marginLeft: 'auto' }}>
                    <button type="button" onClick={handleOpenCreate}>
                        + Nuevo instrumento
                    </button>
                </div>
            </form>

            {loading && <p>Cargando instrumentos...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {/* LISTA */}
            {mode === 'LIST' && !loading && !error && (
                <>
                    <DataTable<InstrumentDTO, SortableField>
                        columns={instrumentColumns}
                        data={instruments}
                        sortState={sortState}
                        onSortChange={handleSort}
                    />
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

            {/* FORMULARIO NUEVO */}
            {mode === 'CREATE' && (
                <form
                    onSubmit={handleCreateSubmit}
                    style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        background: '#ffffff',
                        borderRadius: '0.5rem',
                    }}
                >
                    <h2>Nuevo instrumento</h2>
                    <div style={{ marginBottom: '0.5rem' }}>
                        <label>
                            Nombre<br />
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
                            />
                        </label>
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                        <label>
                            Voz<br />
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
                            />
                        </label>
                    </div>
                    <div style={{ marginTop: '0.5rem' }}>
                        <button type="submit">Guardar</button>
                        <button
                            type="button"
                            onClick={switchToList}
                            style={{ marginLeft: '0.5rem' }}
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {/* FORMULARIO EDITAR */}
            {mode === 'EDIT' && editing && (
                <form
                    onSubmit={handleEditSubmit}
                    style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        background: '#ffffff',
                        borderRadius: '0.5rem',
                    }}
                >
                    <h2>Editar instrumento</h2>
                    <div style={{ marginBottom: '0.5rem' }}>
                        <label>
                            Nombre<br />
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
                            />
                        </label>
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                        <label>
                            Voz<br />
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
                            />
                        </label>
                    </div>
                    <div style={{ marginTop: '0.5rem' }}>
                        <button type="submit">Guardar cambios</button>
                        <button
                            type="button"
                            onClick={switchToList}
                            style={{ marginLeft: '0.5rem' }}
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
