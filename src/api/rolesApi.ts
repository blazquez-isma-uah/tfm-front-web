import { api, authHeaders } from './httpClient'
import type { KeycloakRoleResponse } from '../types/roles'

export async function getAllRoles(token?: string): Promise<KeycloakRoleResponse[]> {
  const response = await api.get<KeycloakRoleResponse[]>('/api/roles', {
    headers: authHeaders(token),
  })
  return response.data
}
