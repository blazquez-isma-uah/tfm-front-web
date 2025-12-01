import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { getUsersPage } from '../../api/usersApi'
import type { UserDTO } from '../../types/users'

function UsersPage() {
    const { token, hasRole } = useAuth()
    const [users, setUsers] = useState<UserDTO[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [page, setPage] = useState(0)
    const [size] = useState(10)
    const [totalPages, setTotalPages] = useState(0)

    const isAdmin = hasRole('ADMIN')

    useEffect(() => {
        if (!token) return

        const load = async () => {
            setLoading(true)
            setError(null)
            try {
                const data = await getUsersPage({ page, size }, token)
                setUsers(data.content ?? [])
                setTotalPages(data.totalPages ?? 1)
            } catch (e: any) {
                console.error('Error en getUsersPage (detallado):', e)
                console.error('Response:', e?.response)
                setError('Error cargando usuarios')
            } finally {
                setLoading(false)
            }
        }

        load()
    }, [token, page, size])

    if (!isAdmin) {
        return (
            <div>
                <h1>Gestión de usuarios</h1>
                <p>No tienes permisos para ver esta sección.</p>
            </div>
        )
    }

    return (
        <div>
            <h1>Gestión de usuarios</h1>

            {loading && <p>Cargando usuarios...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {!loading && !error && (
                <>
                    <table
                        style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            marginTop: '1rem',
                            background: '#ffffff',
                            borderRadius: '0.5rem',
                            overflow: 'hidden',
                        }}
                    >
                        <thead style={{ background: '#e5e7eb' }}>
                            <tr>
                                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Username</th>
                                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Nombre</th>
                                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Apellidos</th>
                                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Email</th>
                                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Activo</th>
                                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Roles</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ padding: '0.75rem' }}>
                                        No hay usuarios en esta página.
                                    </td>
                                </tr>
                            )}
                            {users.map((u) => (
                                <tr key={u.id}>
                                    <td style={{ padding: '0.5rem', borderTop: '1px solid #e5e7eb' }}>
                                        {u.username}
                                    </td>
                                    <td style={{ padding: '0.5rem', borderTop: '1px solid #e5e7eb' }}>
                                        {u.firstName}
                                    </td>
                                    <td style={{ padding: '0.5rem', borderTop: '1px solid #e5e7eb' }}>
                                        {[u.lastName, u.secondLastName].filter(Boolean).join(' ')}
                                    </td>
                                    <td style={{ padding: '0.5rem', borderTop: '1px solid #e5e7eb' }}>
                                        {u.email}
                                    </td>
                                    <td style={{ padding: '0.5rem', borderTop: '1px solid #e5e7eb' }}>
                                        {u.active ? 'Sí' : 'No'}
                                    </td>
                                    <td style={{ padding: '0.5rem', borderTop: '1px solid #e5e7eb' }}>
                                        {(u.roles ?? []).join(', ')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                        <button
                            disabled={page === 0}
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                        >
                            Anterior
                        </button>
                        <span style={{ fontSize: '0.9rem' }}>
                            Página {page + 1} de {totalPages || 1}
                        </span>
                        <button
                            disabled={totalPages === 0 || page >= totalPages - 1}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            Siguiente
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}

export default UsersPage
