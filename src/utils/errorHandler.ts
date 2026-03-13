/**
 * Extrae un mensaje de error legible desde una respuesta de error de Axios
 * @param error - El error capturado (normalmente AxiosError)
 * @param defaultMessage - Mensaje por defecto si no se puede extraer uno específico
 * @returns Mensaje de error formateado
 */
export function extractErrorMessage(error: any, defaultMessage: string): string {
    // Si hay detalles de validación
    if (error?.response?.data?.details && typeof error.response.data.details === 'object') {
        const validationErrors = Object.entries(error.response.data.details)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join(', ')
        return validationErrors
    }

    // Si hay un mensaje específico del servidor
    if (error?.response?.data?.message) {
        return error.response.data.message
    }

    // Sin respuesta HTTP (error de red, timeout, CORS…) → mensaje contextual
    // error.message sería "Network Error" o "timeout of Xms exceeded", no apto para el usuario
    if (!error?.response) {
        return defaultMessage
    }

    // Error HTTP sin cuerpo de mensaje → mensaje por defecto
    return defaultMessage
}
