import { api, authHeaders } from './httpClient'
import type {
    EventDTO,
    EventCreateRequestDTO,
    PaginatedResponseEventDTO,
    EventType,
    EventStatus,
    EventVisibility,
} from '../types/events'
import type { PageableRequest } from '../types/pagination'

export interface EventSearchParams extends PageableRequest {
    q?: string // Texto libre
    title?: string
    description?: string
    location?: string
    type?: EventType
    status?: EventStatus
    visibility?: EventVisibility
    startAtFrom?: string // ISO-8601
    startAtTo?: string // ISO-8601
    endAtFrom?: string // ISO-8601
    endAtTo?: string // ISO-8601
}

export async function searchEventsPage(
    params: EventSearchParams,
    token?: string,
): Promise<PaginatedResponseEventDTO> {
    const {
        page = 0,
        size = 10,
        sort,
        q,
        title,
        description,
        location,
        type,
        status,
        visibility,
        startAtFrom,
        startAtTo,
        endAtFrom,
        endAtTo,
    } = params

    const queryParams: Record<string, any> = {
        page,
        size,
    }

    if (sort) queryParams.sort = sort
    if (q) queryParams.q = q
    if (title) queryParams.title = title
    if (description) queryParams.description = description
    if (location) queryParams.location = location
    if (type) queryParams.type = type
    if (status) queryParams.status = status
    if (visibility) queryParams.visibility = visibility
    if (startAtFrom) queryParams.startAtFrom = startAtFrom
    if (startAtTo) queryParams.startAtTo = startAtTo
    if (endAtFrom) queryParams.endAtFrom = endAtFrom
    if (endAtTo) queryParams.endAtTo = endAtTo

    const { data } = await api.get<PaginatedResponseEventDTO>(
        '/api/events/search',
        {
            params: queryParams,
            headers: authHeaders(token),
        },
    )
    return data
}

export async function getEventById(
    id: string,
    token?: string,
): Promise<EventDTO> {
    const { data } = await api.get<EventDTO>(`/api/events/${id}`, {
        headers: authHeaders(token),
    })
    return data
}

export async function createEvent(
    event: EventCreateRequestDTO,
    token?: string,
): Promise<EventDTO> {
    const { data } = await api.post<EventDTO>('/api/events', event, {
        headers: authHeaders(token),
    })
    return data
}

export async function updateEvent(
    id: string,
    version: number,
    event: EventCreateRequestDTO,
    token?: string,
): Promise<EventDTO> {
    const { data } = await api.put<EventDTO>(`/api/events/${id}`, event, {
        headers: {
            ...authHeaders(token),
            'If-Match': `"${version}"`,
        },
    })
    return data
}

export async function deleteEvent(
    id: string,
    version: number,
    token?: string,
): Promise<void> {
    await api.delete(`/api/events/${id}`, {
        headers: {
            ...authHeaders(token),
            'If-Match': `"${version}"`,
        },
    })
}

export async function getAvailableEventTypes(
    token?: string,
): Promise<EventType[]> {
    const { data } = await api.get<EventType[]>('/api/events/available-types', {
        headers: authHeaders(token),
    })
    return data
}

export async function getAvailableEventStatuses(
    token?: string,
): Promise<EventStatus[]> {
    const { data } = await api.get<EventStatus[]>(
        '/api/events/available-statuses',
        {
            headers: authHeaders(token),
        },
    )
    return data
}

export async function getAvailableEventVisibilities(
    token?: string,
): Promise<EventVisibility[]> {
    const { data } = await api.get<EventVisibility[]>(
        '/api/events/available-visibilities',
        {
            headers: authHeaders(token),
        },
    )
    return data
}
