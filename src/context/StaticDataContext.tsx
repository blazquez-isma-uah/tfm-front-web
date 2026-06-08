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
      setRoles([]); setEventTypes([]); setEventStatuses([])
      setEventVisibilities([]); setSurveyStatuses([]); setResponseTypes([])
      setYesNoMaybeAnswers([]); setSurveyTypes([])
      return
    }

    let cancelled = false
    const load = async () => {
      setIsLoading(true)
      try {
        // Todas las llamadas en paralelo para minimizar la latencia total.
        const [
          rolesData, typesData, statusesData, visibilitiesData,
          surveyStatusesData, responseTypesData, yesNoData, surveyTypesData,
        ] = await Promise.all([
          getAllRoles(token),
          getAvailableEventTypes(token),
          getAvailableEventStatuses(token),
          getAvailableEventVisibilities(token),
          getAvailableSurveyStatuses(token),
          getAvailableResponseTypes(token),
          getAvailableYesNoMaybeAnswers(token),
          getAvailableSurveyTypes(token),
        ])
        if (cancelled) return
        setRoles(rolesData)
        setEventTypes(typesData)
        setEventStatuses(statusesData)
        setEventVisibilities(visibilitiesData)
        setSurveyStatuses(surveyStatusesData)
        setResponseTypes(responseTypesData)
        setYesNoMaybeAnswers(yesNoData)
        setSurveyTypes(surveyTypesData)
      } catch (e) {
        console.error('Error cargando datos estáticos del sistema:', e)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [isAuthenticated, token])

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
