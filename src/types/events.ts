import type { PageResponse } from './pagination'

// Enums cargados dinámicamente desde el backend
export type EventType = string
export type EventStatus = string
export type EventVisibility = string

export interface EventDTO {
    id: string
    version: number
    title: string
    description?: string
    location?: string
    type: EventType
    status: EventStatus
    visibility: EventVisibility
    startAt: string // ISO-8601 Instant (UTC)
    endAt: string // ISO-8601 Instant (UTC)
}

export interface EventCreateRequestDTO {
    title: string
    description?: string
    location?: string
    type: EventType
    status?: EventStatus
    visibility: EventVisibility
    startAt: string // ISO-8601 Instant (UTC)
    endAt: string // ISO-8601 Instant (UTC)
}

export interface CalendarEventItemDTO {
    id: string
    title: string
    start: string // ISO-8601 Instant (UTC)
    end: string // ISO-8601 Instant (UTC)
    allDay: boolean
    type: EventType
    status: EventStatus
    location?: string
}

export type PaginatedResponseEventDTO = PageResponse<EventDTO>
