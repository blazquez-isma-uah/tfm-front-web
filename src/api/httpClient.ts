import axios from 'axios'

export const api = axios.create({
    baseURL: '',
    paramsSerializer: {
        serialize: (params) => {
            const searchParams = new URLSearchParams()
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (Array.isArray(value)) {
                        value.forEach((item) => searchParams.append(key, item))
                    } else {
                        searchParams.append(key, String(value))
                    }
                }
            })
            return searchParams.toString()
        },
    },
})

// Helper para montar cabeceras auth
export function authHeaders(token?: string) {
    return token
        ? {
            Authorization: `Bearer ${token}`,
        }
        : {}
}
