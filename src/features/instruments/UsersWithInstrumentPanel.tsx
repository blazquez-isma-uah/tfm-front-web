import type { UserDTO } from '../../types/users'
import type { InstrumentDTO } from '../../types/instruments'
import { DataTable } from '../../components/DataTable'
import { UserDetailCard } from '../users/UserDetailCard'
import { formatDate } from '../../utils/date'
import '../../styles/common.css'

/**
 * UsersWithInstrumentPanel — Lista de usuarios por instrumento con expansión.
 *
 * Componente presentacional: recibe datos, estado de expansión y callbacks
 * desde el contenedor, sin llamadas directas a la API.
 */

type UserSortableField = 'username' | 'firstName' | 'lastName' | 'email' | 'bandJoinDate'

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
    { key: 'firstName', header: 'Nombre',    sortable: true,  sortField: 'firstName' as UserSortableField, width: '15%' },
    {
      key: 'lastName',  header: 'Apellidos', sortable: true,  sortField: 'lastName'  as UserSortableField, width: '30%',
      render: (u: UserDTO) => [u.lastName, u.secondLastName].filter(Boolean).join(' '),
    },
    { key: 'email',  header: 'Email',         sortable: true,  sortField: 'email'         as UserSortableField, width: '22%' },
    {
      key: 'bandJoinDate', header: 'Alta en banda', sortable: true, sortField: 'bandJoinDate' as UserSortableField, width: '13%',
      render: (u: UserDTO) => formatDate(u.bandJoinDate),
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