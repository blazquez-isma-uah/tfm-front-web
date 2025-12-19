import { api, authHeaders } from './httpClient'
import type { PaginatedResponseUserDTO, UserDTO } from '../types/users'
import type { PageableRequest } from '../types/pagination'

export interface UserSearchParams extends PageableRequest {
    username?: string
    firstName?: string
    lastName?: string
    secondLastName?: string
    email?: string
    active?: boolean
    instrumentId?: number
    roleName?: string
    birthDateFrom?: string
    birthDateTo?: string
    bandJoinDateFrom?: string
    bandJoinDateTo?: string
}

export async function searchUsersPage(
    params: UserSearchParams,
    token?: string,
): Promise<PaginatedResponseUserDTO> {
    const { page = 0, size = 10, sort, username, firstName, lastName, secondLastName,
        email, active, instrumentId, roleName, birthDateFrom, birthDateTo, bandJoinDateFrom, bandJoinDateTo } = params

    const queryParams: Record<string, any> = {
        page,
        size,
    }

    if (username) queryParams.username = username
    if (firstName) queryParams.firstName = firstName
    if (lastName) queryParams.lastName = lastName
    if (secondLastName) queryParams.secondLastName = secondLastName
    if (email) queryParams.email = email
    if (active !== undefined) queryParams.active = active
    if (instrumentId !== undefined) queryParams.instrumentId = instrumentId
    if (roleName) queryParams.role = roleName
    if (birthDateFrom) queryParams.birthDateFrom = birthDateFrom
    if (birthDateTo) queryParams.birthDateTo = birthDateTo
    if (bandJoinDateFrom) queryParams.bandJoinDateFrom = bandJoinDateFrom
    if (bandJoinDateTo) queryParams.bandJoinDateTo = bandJoinDateTo

    if (sort && sort.length > 0) {
        queryParams.sort = sort.length === 1 ? sort[0] : sort
    }

    const response = await api.get<PaginatedResponseUserDTO>('/api/users/search', {
        params: queryParams,
        headers: authHeaders(token),
    })

    return response.data
}

// GET /api/users/{userId}
export async function getUserById(userId: number, token?: string): Promise<UserDTO> {
    const response = await api.get<UserDTO>(`/api/users/${userId}`, {
        headers: authHeaders(token),
    })
    return response.data
}

// GET /api/users/iam/{iamId}
export async function getUserByIamId(iamId: string, token?: string): Promise<UserDTO> {
    const response = await api.get<UserDTO>(`/api/users/iam/${iamId}`, {
        headers: authHeaders(token),
    })
    return response.data
}

export interface UserCreatePayload {
  email: string
  username: string
  password: string
  firstName: string
  lastName: string
  secondLastName?: string
  birthDate?: string
  bandJoinDate?: string
  systemSignupDate?: string
  phone?: string
  notes?: string
  profilePictureUrl?: string
  instrumentIds: number[]
  roles: string[]
}

// POST /api/users
export async function createUser(
  payload: UserCreatePayload,
  token: string,
): Promise<UserDTO> {
  const response = await api.post<UserDTO>('/api/users', payload, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data
}

export interface UserUpdatePayload {
    email: string
    firstName: string
    lastName: string
    secondLastName?: string
    birthDate?: string
    bandJoinDate?: string
    phone?: string
    notes?: string
    profilePictureUrl?: string
}

// PUT /api/users/{userId}
export async function updateUser(
    userId: number,
    payload: UserUpdatePayload,
    version: number,
    token?: string,
): Promise<UserDTO> {
    const response = await api.put<UserDTO>(`/api/users/${userId}`, payload, {
        headers: {
            ...authHeaders(token),
            'If-Match': `W/"${version}"`,
        },
    })
    return response.data
}

// DELETE /api/users/{userId}
export async function deleteUser(
    userId: number,
    version: number,
    token?: string,
): Promise<void> {
    await api.delete(`/api/users/${userId}`, {
        headers: {
            ...authHeaders(token),
            'If-Match': `W/"${version}"`,
        },
    })
}

// PUT /api/users/{userId}/enable
export async function enableUser(
    userId: number,
    version: number,
    token?: string,
): Promise<void> {
    await api.put(
        `/api/users/${userId}/enable`,
        {},
        {
            headers: {
                ...authHeaders(token),
                'If-Match': `W/"${version}"`,
            },
        },
    )
}

// PUT /api/users/{userId}/disable
export async function disableUser(
    userId: number,
    version: number,
    token?: string,
): Promise<void> {
    await api.put(
        `/api/users/${userId}/disable`,
        {},
        {
            headers: {
                ...authHeaders(token),
                'If-Match': `W/"${version}"`,
            },
        },
    )
}

// PUT /api/roles/user/{userId}
export async function setUserRoles(
    userId: number,
    roleNames: string[],
    version: number,
    token?: string,
): Promise<UserDTO> {
    const response = await api.put<UserDTO>(
        `/api/roles/user/${userId}`,
        roleNames,
        {
            headers: {
                ...authHeaders(token),
                'If-Match': `W/"${version}"`,
            },
        },
    )
    return response.data
}