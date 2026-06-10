import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '../features/auth/AuthContext'
import { getAllRoles } from '../api/rolesApi'
import {
  getAvailableEventTypes,
  getAvailableEventStatuses,
  getAvailableEventVisibilities,
} from '../api/eventsApi'
import {
  getAvailableSurveyStatuses,
  getAvailableResponseTypes,
  getAvailableYesNoMaybeAnswers,
  getAvailableSurveyTypes,
} from '../api/surveysApi'
import type { RoleResponse } from '../types/roles'
import type { EventType, EventStatus, EventVisibility } from '../types/events'
import type { SurveyStatus, ResponseType, YesNoMaybeAnswer, SurveyType } from '../types/surveys'

/**
 * StaticDataContext — Datos estáticos del sistema cargados una sola vez por sesión.
 *
 * Estos valores son constantes definidas en el backend (enums de Java) que no
 * cambian durante la sesión del usuario. Cargarlos en cada montaje de componente
 * genera llamadas innecesarias a Lambda en cada navegación.
 *
 * Se cargan una única vez cuando el usuario está autenticado y se mantienen
 * en memoria durante toda la sesión. Si el usuario cierra sesión y vuelve
 * a autenticarse, los datos se recargan automáticamente.
 */

type StaticDataContextValue = {
  roles: RoleResponse[]
  eventTypes: EventType[]
  eventStatuses: EventStatus[]
  eventVisibilities: EventVisibility[]
  surveyStatuses: SurveyStatus[]
  responseTypes: ResponseType[]
  yesNoMaybeAnswers: YesNoMaybeAnswer[]
  surveyTypes: SurveyType[]
  isLoading: boolean
}

const StaticDataContext = createContext<StaticDataContextValue | undefined>(undefined)

export const StaticDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth()

  const [roles, setRoles]                         = useState<RoleResponse[]>([])
  const [eventTypes, setEventTypes]               = useState<EventType[]>([])
  const [eventStatuses, setEventStatuses]         = useState<EventStatus[]>([])
  const [eventVisibilities, setEventVisibilities] = useState<EventVisibility[]>([])
  const [surveyStatuses, setSurveyStatuses]       = useState<SurveyStatus[]>([])
  const [responseTypes, setResponseTypes]         = useState<ResponseType[]>([])
  const [yesNoMaybeAnswers, setYesNoMaybeAnswers] = useState<YesNoMaybeAnswer[]>([])
  const [surveyTypes, setSurveyTypes]             = useState<SurveyType[]>([])
  const [isLoading, setIsLoading]                 = useState(false)

  useEffect(() => {
    // Solo cargamos cuando el usuario está autenticado y tenemos token.
    // Si cierra sesión (isAuthenticated=false), reseteamos los datos.
    if (!isAuthenticated || !token) {
      setIsLoading(false)
      setRoles([]); setEventTypes([]); setEventStatuses([])
      setEventVisibilities([]); setSurveyStatuses([]); setResponseTypes([])
      setYesNoMaybeAnswers([]); setSurveyTypes([])
      return
    }

    let cancelled = false
    let pending = 8
    const finishOne = () => {
      pending -= 1
      if (pending === 0 && !cancelled) setIsLoading(false)
    }

    // Carga un recurso con reintentos independientes y backoff creciente (3s, 6s, 9s).
    const loadResource = <T,>(fetcher: () => Promise<T>, setter: (value: T) => void, label: string, attempt = 1): void => {
      fetcher().then(value => {
        if (cancelled) return
        setter(value)
        finishOne()
      }).catch(err => {
        if (cancelled) return
        if (attempt < 3) {
          setTimeout(() => { if (!cancelled) loadResource(fetcher, setter, label, attempt + 1) }, attempt * 3000)
        } else {
          console.error(`Error cargando ${label}: se agotaron los reintentos`, err)
          finishOne()
        }
      })
    }

    setIsLoading(true)
    loadResource(() => getAllRoles(token), setRoles, 'roles')
    loadResource(() => getAvailableEventTypes(token), setEventTypes, 'tipos de evento')
    loadResource(() => getAvailableEventStatuses(token), setEventStatuses, 'estados de evento')
    loadResource(() => getAvailableEventVisibilities(token), setEventVisibilities, 'visibilidades de evento')
    loadResource(() => getAvailableSurveyStatuses(token), setSurveyStatuses, 'estados de encuesta')
    loadResource(() => getAvailableResponseTypes(token), setResponseTypes, 'tipos de respuesta')
    loadResource(() => getAvailableYesNoMaybeAnswers(token), setYesNoMaybeAnswers, 'respuestas sí/no/quizás')
    loadResource(() => getAvailableSurveyTypes(token), setSurveyTypes, 'tipos de encuesta')

    return () => { cancelled = true }
  }, [isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  const value: StaticDataContextValue = {
    roles, eventTypes, eventStatuses, eventVisibilities,
    surveyStatuses, responseTypes, yesNoMaybeAnswers, surveyTypes,
    isLoading,
  }

  return (
    <StaticDataContext.Provider value={value}>
      {children}
    </StaticDataContext.Provider>
  )
}

export const useStaticData = (): StaticDataContextValue => {
  const ctx = useContext(StaticDataContext)
  if (!ctx) throw new Error('useStaticData must be used within a StaticDataProvider')
  return ctx
}
