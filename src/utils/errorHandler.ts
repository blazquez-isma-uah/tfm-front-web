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
    
    // Si hay un mensaje del error de Axios
    if (error?.message) {
        return error.message
    }
    
    // Mensaje por defecto
    return defaultMessage
}
