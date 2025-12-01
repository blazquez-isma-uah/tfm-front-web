import axios from 'axios'

export const api = axios.create({
    baseURL: '',
})

// Helper para montar cabeceras auth
export function authHeaders(token?: string) {
    return token
        ? {
            Authorization: `Bearer ${token}`,
        }
        : {}
}
