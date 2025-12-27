import type { InstrumentDTO } from './instruments'
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
    instruments?: InstrumentDTO[]
}

export interface MyProfileUpdateRequestDTO {
    firstName?: string
    lastName?: string
    secondLastName?: string
    phone?: string
    notes?: string
    profilePictureUrl?: string
    birthDate?: string // YYYY-MM-DD
}

export interface PasswordUpdateRequestDTO {
    newPassword: string
}

export type PaginatedResponseUserDTO = PageResponse<UserDTO>
