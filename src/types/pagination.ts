export interface PageableRequest {
    page?: number
    size?: number
    sort?: string[]
}

export interface PageResponse<T> {
    content: T[]
    page: number
    size: number
    totalElements: number
    totalPages: number
    first: boolean
    last: boolean
}
