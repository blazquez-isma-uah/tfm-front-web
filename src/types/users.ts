import type { PageResponse } from './pagination'

export interface UserDTO {
    id: number
    version: number
    username: string
    iamId: string
    firstName: string
    lastName: string
    secondLastName?: string
    email: string
    birthDate?: string // YYYY-MM-DD
    bandJoinDate?: string
    systemSignupDate?: string
    phone?: string
    notes?: string
    profilePictureUrl?: string
    active: boolean
    roles: string[]
    instruments: string[] // según tu esquema actual
}

export type PaginatedResponseUserDTO = PageResponse<UserDTO>
