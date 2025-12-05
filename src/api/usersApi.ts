import { api, authHeaders } from './httpClient'
import type { PaginatedResponseUserDTO } from '../types/users'
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
