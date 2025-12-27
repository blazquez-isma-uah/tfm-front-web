import { api, authHeaders } from './httpClient'
import type {
  SurveyDTO,
  SurveyResponseDTO,
  CreateSurveyRequestDTO,
  UpdateSurveyRequestDTO,
  RespondYesNoMaybeRequestDTO,
  UpdateSurveyResponseRequestDTO,
  SurveySearchParams,
  SurveyStatus,
  ResponseType,
  YesNoMaybeAnswer,
  SurveyType,
  PaginatedResponseSurveyDTO,
  PaginatedResponseSurveyResponseDTO,
} from '../types/surveys'

// ==================== CRUD Surveys ====================

export async function searchSurveysPage(
  params: SurveySearchParams,
  token: string,
): Promise<PaginatedResponseSurveyDTO> {
  const queryParams = new URLSearchParams()
  
  if (params.page !== undefined) queryParams.append('page', params.page.toString())
  if (params.size !== undefined) queryParams.append('size', params.size.toString())
  if (params.qText) queryParams.append('qText', params.qText)
  if (params.title) queryParams.append('title', params.title)
  if (params.description) queryParams.append('description', params.description)
  if (params.eventId) queryParams.append('eventId', params.eventId)
  if (params.status) queryParams.append('status', params.status)
  if (params.surveyType) queryParams.append('surveyType', params.surveyType)
  if (params.opensFrom) queryParams.append('opensFrom', params.opensFrom)
  if (params.opensTo) queryParams.append('opensTo', params.opensTo)
  if (params.closesFrom) queryParams.append('closesFrom', params.closesFrom)
  if (params.closesTo) queryParams.append('closesTo', params.closesTo)
  
  if (params.sort) {
    params.sort.forEach((s) => queryParams.append('sort', s))
  }

  const response = await api.get<PaginatedResponseSurveyDTO>(
    `/api/surveys/search?${queryParams.toString()}`,
    {
        headers: authHeaders(token),
    },
  )
  return response.data
}

export async function getSurveyById(
  surveyId: string,
  token: string,
): Promise<SurveyDTO> {
  const response = await api.get<SurveyDTO>(
    `/api/surveys/${surveyId}`,
    {
      headers: authHeaders(token),
    },
  )
  return response.data
}

export async function createSurvey(
  payload: CreateSurveyRequestDTO,
  token: string,
): Promise<SurveyDTO> {
  const response = await api.post<SurveyDTO>(
    '/api/surveys',
    payload,
    {
      headers: authHeaders(token),
    },
  )
  return response.data
}

export async function updateSurvey(
  surveyId: string,
  payload: UpdateSurveyRequestDTO,
  version: number,
  token: string,
): Promise<SurveyDTO> {
  const response = await api.put<SurveyDTO>(
    `/api/surveys/${surveyId}`,
    payload,
    {
      headers: {
            ...authHeaders(token),
            'If-Match': `"${version}"`,
        },
    },
  )
  return response.data
}

export async function deleteSurvey(
  surveyId: string,
  version: number,
  token: string,
): Promise<void> {
  await api.delete(`/api/surveys/${surveyId}`, {
    headers: {
            ...authHeaders(token),
            'If-Match': `"${version}"`,
        },
  })
}

export async function openSurvey(
  surveyId: string,
  version: number,
  token: string,
): Promise<SurveyDTO> {
  const response = await api.post<SurveyDTO>(
    `/api/surveys/${surveyId}/open`,
    {},
    {
      headers: {
            ...authHeaders(token),
            'If-Match': `"${version}"`,
        },
    },
  )
  return response.data
}

export async function closeSurvey(
  surveyId: string,
  version: number,
  token: string,
): Promise<SurveyDTO> {
  const response = await api.post<SurveyDTO>(
    `/api/surveys/${surveyId}/close`,
    {},
    {
      headers: {
            ...authHeaders(token),
            'If-Match': `"${version}"`,
        },
    },
  )
  return response.data
}

export async function cancelSurvey(
  surveyId: string,
  version: number,
  token: string,
): Promise<SurveyDTO> {
  const response = await api.post<SurveyDTO>(
    `/api/surveys/${surveyId}/cancel`,
    {},
    {
      headers: {
            ...authHeaders(token),
            'If-Match': `"${version}"`,
        },
    },
  )
  return response.data
}

// ==================== Survey Responses ====================

export async function respondToSurvey(
  surveyId: string,
  payload: RespondYesNoMaybeRequestDTO,
  version: number,
  token: string,
): Promise<SurveyResponseDTO> {
  const response = await api.post<SurveyResponseDTO>(
    `/api/surveys/responses/${surveyId}`,
    payload,
    {
      headers: {
            ...authHeaders(token),
            'If-Match': `"${version}"`,
        },
    },
  )
  return response.data
}

export async function getMyResponse(
  surveyId: string,
  token: string,
): Promise<SurveyResponseDTO> {
  const response = await api.get<SurveyResponseDTO>(
    `/api/surveys/responses/${surveyId}/me`,
    {
      headers: authHeaders(token),
    },
  )
  return response.data
}

export async function updateMyResponse(
  surveyId: string,
  payload: UpdateSurveyResponseRequestDTO,
  version: number,
  token: string,
): Promise<SurveyResponseDTO> {
  const response = await api.put<SurveyResponseDTO>(
    `/api/surveys/responses/${surveyId}/me`,
    payload,
    {
      headers: {
            ...authHeaders(token),
            'If-Match': `"${version}"`,
        },
    },
  )
  return response.data
}

export async function deleteMyResponse(
  surveyId: string,
  version: number,
  token: string,
): Promise<void> {
  await api.delete(`/api/surveys/responses/${surveyId}/me`, {
    headers: {
            ...authHeaders(token),
            'If-Match': `"${version}"`,
        },
  })
}

export async function getYesNoMaybeResults(
  surveyId: string,
  token: string,
): Promise<Record<YesNoMaybeAnswer, number>> {
  const response = await api.get<Record<YesNoMaybeAnswer, number>>(
    `/api/surveys/responses/yesNoMaybeResults/${surveyId}`,
    {
      headers: authHeaders(token),
    },
  )
  return response.data
}

export async function getCompleteResults(
  surveyId: string,
  page: number,
  size: number,
  token: string,
): Promise<PaginatedResponseSurveyResponseDTO> {
  const response = await api.get<PaginatedResponseSurveyResponseDTO>(
    `/api/surveys/responses/completeResults/${surveyId}?page=${page}&size=${size}`,
    {
      headers: authHeaders(token),
    },
  )
  return response.data
}

// ==================== Available Options ====================

export async function getAvailableSurveyStatuses(
  token: string,
): Promise<SurveyStatus[]> {
  const response = await api.get<SurveyStatus[]>(
    '/api/surveys/available-statuses',
    {
      headers: authHeaders(token),
    },
  )
  return response.data
}

export async function getAvailableResponseTypes(
  token: string,
): Promise<ResponseType[]> {
  const response = await api.get<ResponseType[]>(
    '/api/surveys/available-responseTypes',
    {
      headers: authHeaders(token),
    },
  )
  return response.data
}

export async function getAvailableYesNoMaybeAnswers(
  token: string,
): Promise<YesNoMaybeAnswer[]> {
  const response = await api.get<YesNoMaybeAnswer[]>(
    '/api/surveys/available-yesNoMaybeAnswers',
    {
      headers: authHeaders(token),
    },
  )
  return response.data
}

export async function getAvailableSurveyTypes(
  token: string,
): Promise<SurveyType[]> {
  const response = await api.get<SurveyType[]>(
    '/api/surveys/available-surveyTypes',
    {
      headers: authHeaders(token),
    },
  )
  return response.data
}

// ==================== My Surveys ====================

export interface MySurveysParams {
  page?: number
  size?: number
  status?: SurveyStatus
  surveyType?: SurveyType
  opensFrom?: string // ISO Instant
  opensTo?: string // ISO Instant
  closesFrom?: string // ISO Instant
  closesTo?: string // ISO Instant
  sort?: string[]
}

/**
 * Obtiene las encuestas que el usuario actual ha respondido
 */
export async function getMyAnsweredSurveys(
  params: MySurveysParams,
  token: string,
): Promise<PaginatedResponseSurveyDTO> {
  const queryParams = new URLSearchParams()
  
  if (params.page !== undefined) queryParams.append('page', params.page.toString())
  if (params.size !== undefined) queryParams.append('size', params.size.toString())
  if (params.status) queryParams.append('status', params.status)
  if (params.surveyType) queryParams.append('surveyType', params.surveyType)
  if (params.opensFrom) queryParams.append('opensFrom', params.opensFrom)
  if (params.opensTo) queryParams.append('opensTo', params.opensTo)
  if (params.closesFrom) queryParams.append('closesFrom', params.closesFrom)
  if (params.closesTo) queryParams.append('closesTo', params.closesTo)
  
  if (params.sort) {
    params.sort.forEach((s) => queryParams.append('sort', s))
  }

  const response = await api.get<PaginatedResponseSurveyDTO>(
    `/api/surveys/answered/me?${queryParams.toString()}`,
    {
      headers: authHeaders(token),
    },
  )
  return response.data
}

/**
 * Obtiene las encuestas que el usuario actual NO ha respondido
 */
export async function getMyNotAnsweredSurveys(
  params: MySurveysParams,
  token: string,
): Promise<PaginatedResponseSurveyDTO> {
  const queryParams = new URLSearchParams()
  
  if (params.page !== undefined) queryParams.append('page', params.page.toString())
  if (params.size !== undefined) queryParams.append('size', params.size.toString())
  if (params.status) queryParams.append('status', params.status)
  if (params.surveyType) queryParams.append('surveyType', params.surveyType)
  if (params.opensFrom) queryParams.append('opensFrom', params.opensFrom)
  if (params.opensTo) queryParams.append('opensTo', params.opensTo)
  if (params.closesFrom) queryParams.append('closesFrom', params.closesFrom)
  if (params.closesTo) queryParams.append('closesTo', params.closesTo)
  
  if (params.sort) {
    params.sort.forEach((s) => queryParams.append('sort', s))
  }

  const response = await api.get<PaginatedResponseSurveyDTO>(
    `/api/surveys/notAnswered/me?${queryParams.toString()}`,
    {
      headers: authHeaders(token),
    },
  )
  return response.data
}
