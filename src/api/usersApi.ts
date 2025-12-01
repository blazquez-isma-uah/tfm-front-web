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
    instrumentId?: number
}

export async function getUsersPage(
    params: UserSearchParams,
    token?: string,
): Promise<PaginatedResponseUserDTO> {
    const { page = 0, size = 10, sort, ...filters } = params

    const queryParams: Record<string, any> = {
        page,
        size,
        ...filters,
    }

    if (sort && sort.length > 0) {
        queryParams.sort = sort
    }

    const response = await api.get<PaginatedResponseUserDTO>('/api/users', {
        params: queryParams,
        headers: authHeaders(token),
    })

    return response.data
}
