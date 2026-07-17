import { api, authHeaders } from './httpClient'
import type { PaginatedResponseUserDTO, UserDTO, MyProfileUpdateRequestDTO, PasswordUpdateRequestDTO } from '../types/users'
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
    }
    )
    return response.data
}

// ==================== My Profile ====================

// GET /api/users/me
export async function getMyProfile(token?: string): Promise<UserDTO> {
    const response = await api.get<UserDTO>('/api/users/me', {
        headers: authHeaders(token),
    })
    return response.data
}

// PUT /api/users/me
export async function updateMyProfile(
    payload: MyProfileUpdateRequestDTO,
    token?: string,
): Promise<UserDTO> {
    const response = await api.put<UserDTO>('/api/users/me', payload, {
        headers: authHeaders(token),
    })
    return response.data
}

// PUT /api/users/me/password
export async function updateMyPassword(
    payload: PasswordUpdateRequestDTO,
    token?: string,
): Promise<void> {
    await api.put('/api/users/me/password', payload, {
        headers: authHeaders(token),
    })
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

// ==================== Profile Picture ====================

// POST /api/users/picture/me/upload-url
export async function getMyPictureUploadUrl(token?: string): Promise<string> {
    const response = await api.post<{ uploadUrl: string }>(
        '/api/users/picture/me/upload-url',
        {},
        { headers: authHeaders(token) },
    )
    return response.data.uploadUrl
}

// POST /api/users/picture/{userId}/upload-url  (ADMIN)
export async function getUserPictureUploadUrl(userId: number, token?: string): Promise<string> {
    const response = await api.post<{ uploadUrl: string }>(
        `/api/users/picture/${userId}/upload-url`,
        {},
        { headers: authHeaders(token) },
    )
    return response.data.uploadUrl
}

// PUT /api/users/picture/me
export async function confirmMyPictureUpload(token?: string): Promise<void> {
    await api.put('/api/users/picture/me', {}, { headers: authHeaders(token) })
}

// PUT /api/users/picture/{userId}  (ADMIN)
export async function confirmUserPictureUpload(userId: number, token?: string): Promise<void> {
    await api.put(`/api/users/picture/${userId}`, {}, { headers: authHeaders(token) })
}

// GET /api/users/picture/me
export async function getMyPictureUrl(token?: string): Promise<string | null> {
    const response = await api.get<{ pictureUrl: string | null }>('/api/users/picture/me', {
        headers: authHeaders(token),
    })
    return response.data.pictureUrl
}

// GET /api/users/picture/{userId}
export async function getUserPictureUrl(userId: number, token?: string): Promise<string | null> {
    const response = await api.get<{ pictureUrl: string | null }>(`/api/users/picture/${userId}`, {
        headers: authHeaders(token),
    })
    return response.data.pictureUrl
}


// PUT contra la propia S3 -- fuera de la instancia `api`, sin cabeceras de autenticación ni baseURL: 
// la presigned URL ya lleva su propia autorización incrustada en el query string.
export async function uploadToPresignedUrl(uploadUrl: string, blob: Blob): Promise<void> {
    const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        body: blob,
    })
    if (!response.ok) {
        throw new Error(`Error al subir la imagen a S3 (status ${response.status})`)
    }
}

/**
 * Flujo completo de subida: comprime -> pide URL -> sube a S3 -> confirma.
 * Reutilizable tanto por el propio usuario como por un ADMIN sobre otro usuario.
 */
export async function uploadProfilePicture(
    file: File,
    isAdmin: boolean,
    targetUserId: number | undefined,
    token?: string,
): Promise<void> {
    const { compressImageToJpeg } = await import('../utils/imageCompression')
    const compressed = await compressImageToJpeg(file)

    const uploadUrl = isAdmin && targetUserId !== undefined
        ? await getUserPictureUploadUrl(targetUserId, token)
        : await getMyPictureUploadUrl(token)

    await uploadToPresignedUrl(uploadUrl, compressed)

    if (isAdmin && targetUserId !== undefined) {
        await confirmUserPictureUpload(targetUserId, token)
    } else {
        await confirmMyPictureUpload(token)
    }
}