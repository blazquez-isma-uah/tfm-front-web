import { api, authHeaders } from './httpClient'
import type { PaginatedResponseInstrumentDTO, InstrumentRequestDTO, InstrumentDTO } from '../types/instruments'
import type { PageableRequest } from '../types/pagination'

export interface InstrumentSearchParams extends PageableRequest {
    instrumentName?: string
    voice?: string
}

export async function getInstrumentsPage(
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
        queryParams.sort = sort
    }

    // uso /api/instruments/search aunque los filtros sean opcionales
    const response = await api.get<PaginatedResponseInstrumentDTO>('/api/instruments/search', {
        params: queryParams,
        headers: authHeaders(token),
    })

    return response.data
}

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
