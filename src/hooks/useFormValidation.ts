import { useState, useCallback } from 'react'

/**
 * useFormValidation — Gestión de errores de validación para formularios.
 * 
 * Las reglas se definen fuera del componente (a nivel de módulo o con useMemo)
 * para evitar recreaciones en cada render.
 * 
 * Ejemplo:
 *   const { errors, validate, clearError } = useFormValidation<MyForm>({
 *     email: [rules.required(), rules.email()],
 *     username: [rules.required(), rules.minLength(3)],
 *   })
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

type RuleFn = (value: string) => string | null

export type ValidationRules<T> = Partial<Record<keyof T, RuleFn[]>>

export type ValidationErrors<T> = Partial<Record<keyof T, string>>

export type CrossValidateFn<T> = (
  values: Record<string, unknown>,
  addError: (field: keyof T, message: string) => void
) => void

type UseFormValidationReturn<T> = {
  errors: ValidationErrors<T>
  validate: (values: Record<string, unknown>) => boolean
  clearError: (field: keyof T) => void
  clearAll: () => void
  validateField: (field: keyof T, value: unknown) => void
}

// ─── Reglas predefinidas reutilizables ───────────────────────────────────────

export const rules = {
  // Campo obligatorio: falla si el valor (sin espacios) está vacío
  required: (msg = 'Este campo es obligatorio'): RuleFn =>
    (v) => v.trim() === '' ? msg : null,

  // Longitud mínima: falla si el valor tiene menos de n caracteres (ignora vacío)
  minLength: (n: number, msg?: string): RuleFn =>
    (v) => v.trim().length > 0 && v.trim().length < n
      ? (msg ?? `Mínimo ${n} caracteres`)
      : null,

  // Longitud máxima: falla si el valor excede n caracteres
  maxLength: (n: number, msg?: string): RuleFn =>
    (v) => v.trim().length > n
      ? (msg ?? `Máximo ${n} caracteres`)
      : null,

  // Email válido: regex simple para formato usuario@dominio.tld
  email: (msg = 'Introduce un email válido'): RuleFn =>
    (v) => v.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? msg : null,

  // Sin espacios: falla si el valor contiene algún espacio
  noSpaces: (msg = 'No puede contener espacios'): RuleFn =>
    (v) => /\s/.test(v) ? msg : null,

  // Patrón personalizado: valida contra una regex proporcionada
  pattern: (regex: RegExp, msg: string): RuleFn =>
    (v) => v.trim() !== '' && !regex.test(v) ? msg : null,

  // URL válida: usa el constructor URL del navegador para validar.
  // Solo acepta http:// y https://
  url: (msg = 'Introduce una URL válida'): RuleFn =>
    (v) => {
      if (v.trim() === '') return null  // campo vacío: lo gestiona rules.required
      try {
        const parsed = new URL(v.trim())
        return parsed.protocol === 'http:' || parsed.protocol === 'https:'
          ? null
          : msg
      } catch {
        // URL() lanza si el formato es inválido
        return msg
      }
    },
}


export function useFormValidation<T extends object>(
  validationRules: ValidationRules<T>,
  crossValidate?: CrossValidateFn<T>
): UseFormValidationReturn<T> {
  const [errors, setErrors] = useState<ValidationErrors<T>>({})

  // Valida todos los campos definidos en validationRules.
  // Devuelve true si no hay errores, false en caso contrario.
  const validate = (values: Record<string, unknown>): boolean => {
    const newErrors: ValidationErrors<T> = {}

    // Recorremos cada campo que tiene reglas de validación
    for (const field in validationRules) {
      const fieldRules = validationRules[field as keyof T]
      if (!fieldRules) continue

      const value = String(values[field] ?? '')

      // Ejecutamos las reglas en orden, parando en el primer error
      for (const rule of fieldRules) {
        const error = rule(value)
        if (error) {
          newErrors[field as keyof T] = error
          break
        }
      }
    }

    // Validación cruzada opcional (ej: fecha fin > fecha inicio)
    if (crossValidate) {
      crossValidate(values, (field, message) => {
        // No sobreescribimos errores de campo individuales ya detectados
        if (!newErrors[field]) {
          newErrors[field] = message
        }
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Valida un único campo. Útil para validar en onBlur.
  const validateField = useCallback((field: keyof T, value: unknown) => {
    const fieldRules = validationRules[field]
    if (!fieldRules) return

    const strValue = String(value ?? '')
    for (const rule of fieldRules) {
      const error = rule(strValue)
      if (error) {
        setErrors(prev => ({ ...prev, [field]: error }))
        return
      }
    }
    // Si no hay errores, limpiamos el error previo si existía
    setErrors(prev => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [validationRules])

  // Limpia el error de un campo concreto (llamar en onChange)
  const clearError = (field: keyof T) => {
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  // Limpia todos los errores
  const clearAll = () => setErrors({})

  return { errors, validate, clearError, clearAll, validateField }
}