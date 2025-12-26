import type { PageResponse } from './pagination'

// Enums cargados dinámicamente desde el backend
export type SurveyStatus = string
export type ResponseType = string
export type YesNoMaybeAnswer = string
export type SurveyType = string

export interface SurveyDTO {
  id: string
  version: number
  eventId: string
  title: string
  description?: string
  status: SurveyStatus
  responseType: ResponseType
  surveyType: SurveyType
  opensAt: string // ISO Instant
  closesAt: string // ISO Instant
  createdBy?: string
  createdAt?: string // ISO Instant
  updatedAt?: string // ISO Instant
}

export interface SurveyResponseDTO {
  id: string
  version: number
  surveyId: string
  userIamId: string
  answerYesNoMaybe: YesNoMaybeAnswer
  instrumentId?: string
  comment?: string
  answeredAt: string // ISO Instant
}

export interface CreateSurveyRequestDTO {
  eventId: string
  title: string
  description?: string
  responseType: ResponseType
  surveyType: SurveyType
  opensAt: string // ISO Instant
  closesAt: string // ISO Instant
}

export interface UpdateSurveyRequestDTO {
  title: string
  description?: string
  surveyType: SurveyType
  opensAt: string // ISO Instant
  closesAt: string // ISO Instant
}

export interface RespondYesNoMaybeRequestDTO {
  answer: YesNoMaybeAnswer
  instrumentId?: string
  comment?: string
}

export interface UpdateSurveyResponseRequestDTO {
  answer: YesNoMaybeAnswer
  instrumentId?: string
  comment?: string
}

export interface SurveySearchParams {
  page?: number
  size?: number
  qText?: string
  title?: string
  description?: string
  eventId?: string
  status?: SurveyStatus
  opensFrom?: string // ISO Instant
  opensTo?: string // ISO Instant
  closesFrom?: string // ISO Instant
  closesTo?: string // ISO Instant
  sort?: string[]
}

export type SurveySortableField = 
  | 'title'
  | 'status'
  | 'opensAt'
  | 'closesAt'
  | 'createdAt'

export type PaginatedResponseSurveyDTO = PageResponse<SurveyDTO>
export type PaginatedResponseSurveyResponseDTO = PageResponse<SurveyResponseDTO>