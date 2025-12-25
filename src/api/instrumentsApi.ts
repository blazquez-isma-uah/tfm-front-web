import { api, authHeaders } from './httpClient'
import type { PaginatedResponseInstrumentDTO, InstrumentRequestDTO, InstrumentDTO } from '../types/instruments'
import type { PageableRequest } from '../types/pagination'
import type { UserDTO } from '../types/users'


export interface InstrumentSearchParams extends PageableRequest {
    instrumentName?: string
    voice?: string
}

// GET /api/instruments/search
export async function searchInstrumentsPage(
    params: InstrumentSearchParams,
    token?: string,
): Promise<PaginatedResponseInstrumentDTO> {
    const { page = 0, size = 10, sort, instrumentName, voice } = params

    const queryParams: Record<string, any> = {
        page,
        size,
    }

    if (instrumentName) queryParams.instrumentName = instrumentName
    if (voice) queryParams.voice = voice
    if (sort && sort.length > 0) {
        queryParams.sort = sort.length === 1 ? sort[0] : sort
    }

    // uso /api/instruments/search aunque los filtros sean opcionales
    const response = await api.get<PaginatedResponseInstrumentDTO>('/api/instruments/search', {
        params: queryParams,
        headers: authHeaders(token),
    })

    return response.data
}

// GET /api/instruments/{id}
export async function getInstrumentById(
    id: number,
    token?: string,
): Promise<InstrumentDTO> {
    const response = await api.get<InstrumentDTO>(`/api/instruments/${id}`, {
        headers: authHeaders(token),
    })
    return response.data
}

// POST /api/instruments
export async function createInstrument(
    body: InstrumentRequestDTO,
    token?: string,
): Promise<InstrumentDTO> {
    const response = await api.post<InstrumentDTO>('/api/instruments', body, {
        headers: {
            ...authHeaders(token),
        },
    })
    return response.data
}

// PUT /api/instruments/{id}
export async function updateInstrument(
    id: number,
    body: InstrumentRequestDTO,
    version: number,
    token?: string,
): Promise<InstrumentDTO> {
    const response = await api.put<InstrumentDTO>(`/api/instruments/${id}`, body, {
        headers: {
            ...authHeaders(token),
            'If-Match': `W/"${version}"`,
        },
    })
    return response.data
}

// DELETE /api/instruments/{id}
export async function deleteInstrument(
    id: number,
    version: number,
    token?: string,
): Promise<void> {
    await api.delete(`/api/instruments/${id}`, {
        headers: {
            ...authHeaders(token),
            'If-Match': `W/"${version}"`,
        },
    })
}

// Obtener todos los instrumentos (sin paginar, para listas desplegables, etc.)
// GET /api/instruments/search?page=0&size=1000
export async function getAllInstruments(
  token?: string,
): Promise<InstrumentDTO[]> {
  const response = await api.get<PaginatedResponseInstrumentDTO>(
    '/api/instruments/search',
    {
      params: { page: 0, size: 1000 }, // asumiendo que no se va a tener más de 1000
      headers: authHeaders(token),
    },
  )
  return response.data.content ?? []
}

// Asignar lista completa de instrumentos a un usuario
// PUT /api/instruments/user/{userId} con body = List<Long> (ids)
export async function setUserInstruments(
  userId: number,
  instrumentIds: number[],
  version: number,
  token?: string,
): Promise<UserDTO> {
  const response = await api.put(`/api/instruments/user/${userId}`, instrumentIds, {
    headers: {
      ...authHeaders(token),
      'If-Match': `W/"${version}"`,
    },
  })
    return response.data
}