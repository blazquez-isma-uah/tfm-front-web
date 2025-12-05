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
    roleName?: string
}

export async function searchUsersPage(
    params: UserSearchParams,
    token?: string,
): Promise<PaginatedResponseUserDTO> {
    const { page = 0, size = 10, sort, username, firstName, lastName, secondLastName,
        email, active, roleName } = params

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
    if (roleName) queryParams.role = roleName

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

// PUT /api/users/{userId}
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