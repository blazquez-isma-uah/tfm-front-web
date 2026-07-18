/**
 * Extrae un mensaje de error legible desde una respuesta de error de Axios
 * @param error - El error capturado (normalmente AxiosError)
 * @param defaultMessage - Mensaje por defecto si no se puede extraer uno específico
 * @returns Mensaje de error formateado
 */
export function extractErrorMessage(error: any, defaultMessage: string): string {
    // Sin respuesta HTTP (error de red, timeout, CORS…) → mensaje contextual.
    // error.message sería "Network Error" o "timeout of Xms exceeded", no apto para el usuario.
    if (!error?.response) {
        return defaultMessage
    }

    const data = error.response.data

    // Errores de validación por campo: mostramos el primero de forma clara y
    // contamos el resto, en vez de concatenar todos en una única línea larga
    // -- más legible en un toast, sobre todo en móvil.
    if (data?.details && typeof data.details === 'object') {
        const entries = Object.entries(data.details)
        if (entries.length > 0) {
            const [firstField, firstMsg] = entries[0]
            const remaining = entries.length - 1
            const suffix = remaining > 0
                ? ` (y ${remaining} campo${remaining > 1 ? 's' : ''} más)`
                : ''
            return `${firstField}: ${firstMsg}${suffix}`
        }
    }

    // Si hay un mensaje específico del servidor
    if (data?.message) {
        return data.message
    }

    // Error HTTP sin cuerpo de mensaje → mensaje por defecto
    return defaultMessage
}


/**
 * Extrae el errorCode estable del cuerpo de error, si el backend lo incluyó.
 * Útil para componentes que necesitan reaccionar a un tipo de error concreto
 * (por ejemplo, mostrar un botón "Recargar" ante OPTIMISTIC_LOCK_CONFLICT)
 * en vez de solo mostrar el mensaje en un toast. 
 * No todos los errores lo traen.
 */
export function extractErrorCode(error: any): string | undefined {
    return error?.response?.data?.errorCode
}