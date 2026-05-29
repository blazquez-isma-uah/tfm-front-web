import { api, authHeaders } from './httpClient'
import type { RoleResponse } from '../types/roles'

export async function getAllRoles(token?: string): Promise<RoleResponse[]> {
  const response = await api.get<RoleResponse[]>('/api/roles', {
    headers: authHeaders(token),
  })
  return response.data
}
