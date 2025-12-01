import type { PageResponse } from './pagination'

export interface InstrumentDTO {
    id: number
    version: number
    instrumentName: string
    voice: string
}

export interface InstrumentRequestDTO {
    instrumentName: string
    voice: string
}

export type PaginatedResponseInstrumentDTO = PageResponse<InstrumentDTO>
