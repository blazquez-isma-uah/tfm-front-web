import type { UserDTO } from '../types/users'
import type { InstrumentDTO } from '../types/instruments'
import { DataTable } from './DataTable'
import { UserDetailCard } from './UserDetailCard'
import '../styles/common.css'

/**
 * UsersWithInstrumentPanel — Muestra la lista de usuarios que tocan
 * un instrumento concreto, con expansión de fila para ver el detalle.
 *
 * RESPONSABILIDAD:
 * Solo renderiza. Toda la lógica (carga de usuarios, expansión de filas,
 * ordenación local) vive en InstrumentsPage y llega como props.
 *
 * DECISIÓN — Ordenación local (client-side) en lugar de server-side:
 * Los usuarios de un instrumento se cargan de una sola vez (page=0, size=100).
 * La ordenación se hace en memoria porque:
 * 1. El número de usuarios por instrumento es acotado (una banda tiene
 *    entre 10 y 100 miembros, no miles).
 * 2. Añadir parámetros de ordenación a la llamada requeriría un useEffect
 *    adicional o recargar datos, con latencia de red visible.
 * 3. La ordenación local es instantánea y suficiente para este dominio.
 * Esta decisión es diferente a la de UsersPage (server-side) porque allí
 * el total de usuarios puede ser grande y la paginación es obligatoria.
 *
 * DECISIÓN — Carga del detalle de usuario al expandir:
 * La lista inicial viene de searchUsersPage con datos básicos.
 * Al expandir, se hace getUserById para obtener el perfil completo
 * (instrumentos, roles, foto). Esto añade una llamada extra pero evita
 * cargar datos pesados para todas las filas de golpe.
 */

type UserSortableField = 'username' | 'firstName' | 'lastName' | 'email'

interface UsersWithInstrumentPanelProps {
  instrument: InstrumentDTO
  users: UserDTO[]
  usersLoading: boolean
  selectedUserDetail: UserDTO | null
  userDetailLoading: boolean
  expandedUserId: number | null
  isClosing: boolean
  sortState: { field: UserSortableField | null; direction: 'asc' | 'desc' }
  onSortChange: (field: UserSortableField) => void
  onRowClick: (user: UserDTO) => void
  onBack: () => void          // cierra el detalle del usuario (vuelve a la lista de usuarios)
  onBackToList: () => void    // vuelve a la lista de instrumentos
}

export function UsersWithInstrumentPanel({
  instrument,
  users,
  usersLoading,
  selectedUserDetail,
  userDetailLoading,
  expandedUserId,
  isClosing,
  sortState,
  onSortChange,
  onRowClick,
  onBack,
  onBackToList,
}: UsersWithInstrumentPanelProps) {
  const userColumns = [
    { key: 'username',  header: 'Username',  sortable: true,  sortField: 'username'  as UserSortableField, width: '20%' },
    { key: 'firstName', header: 'Nombre',    sortable: true,  sortField: 'firstName' as UserSortableField, width: '20%' },
    {
      key: 'lastName',  header: 'Apellidos', sortable: true,  sortField: 'lastName'  as UserSortableField, width: '30%',
      render: (u: UserDTO) => [u.lastName, u.secondLastName].filter(Boolean).join(' '),
    },
    { key: 'email',  header: 'Email',  sortable: true,  sortField: 'email'  as UserSortableField, width: '20%' },
    {
      key: 'active', header: 'Estado', sortable: false, width: '10%',
      render: (u: UserDTO) => (
        <span style={{
          color: u.active ? 'var(--color-success-dark)' : 'var(--color-gray-400)',
          fontSize: 'var(--font-size-xs)', fontWeight: 600,
        }}>
          {u.active ? '● Activo' : '○ Inactivo'}
        </span>
      ),
    },
  ]

  const title = `${instrument.instrumentName}${instrument.voice ? ` — ${instrument.voice}` : ''}`

  return (
    <div className="card" style={{ marginTop: '1rem' }}>
      <div className="section-title" style={{ marginBottom: 'var(--space-3)' }}>
        Usuarios · {title}
      </div>

      {usersLoading && (
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          Cargando usuarios...
        </p>
      )}

      {!usersLoading && users.length === 0 && (
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          Ningún usuario tiene asignado este instrumento.
        </p>
      )}

      {!usersLoading && users.length > 0 && (
        <DataTable<UserDTO, UserSortableField>
          columns={userColumns}
          data={users}
          sortState={sortState}
          onSortChange={onSortChange}
          onRowClick={onRowClick}
          expandedRowId={expandedUserId}
          isClosing={isClosing}
          renderExpandedContent={(user) => {
            if (userDetailLoading) {
              return (
                <div style={{ padding: '1rem', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                    Cargando detalles...
                  </p>
                </div>
              )
            }
            if (selectedUserDetail && selectedUserDetail.id === user.id) {
              return (
                <UserDetailCard
                  user={selectedUserDetail}
                  onBack={onBack}
                  showButtons={true}
                  backButtonLabel="Ocultar"
                />
              )
            }
            return null
          }}
        />
      )}

      {!selectedUserDetail && (
        <div className="button-row">
          <button type="button" className="button-secondary" onClick={onBackToList}>
            ← Volver a instrumentos
          </button>
        </div>
      )}
    </div>
  )
}