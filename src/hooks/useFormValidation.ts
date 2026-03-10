import { useState, useCallback } from 'react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type RuleFn = (value: string) => string | null

/**
 * Reglas de validación por campo.
 * Cada campo puede tener un array de funciones validadoras.
 * Se ejecutan en orden y se detienen en el primer error.
 */
export type ValidationRules<T> = Partial<Record<keyof T, RuleFn[]>>

export type ValidationErrors<T> = Partial<Record<keyof T, string>>

export type CrossValidateFn<T> = (
  values: Record<string, unknown>,
  addError: (field: keyof T, message: string) => void
) => void

type UseFormValidationReturn<T> = {
  errors: ValidationErrors<T>
  /** Valida todos los campos. Devuelve true si no hay errores. */
  validate: (values: Record<string, unknown>) => boolean
  /** Limpia el error de un campo concreto (llamar en onChange) */
  clearError: (field: keyof T) => void
  /** Limpia todos los errores */
  clearAll: () => void
  /** Valida un único campo. Útil para validar en onBlur. */
  validateField: (field: keyof T, value: unknown) => void
}

// ─── Reglas predefinidas reutilizables ───────────────────────────────────────

export const rules = {
  required: (msg = 'Este campo es obligatorio'): RuleFn =>
    (v) => v.trim() === '' ? msg : null,

  minLength: (n: number, msg?: string): RuleFn =>
    (v) => v.trim().length > 0 && v.trim().length < n
      ? (msg ?? `Mínimo ${n} caracteres`)
      : null,

  maxLength: (n: number, msg?: string): RuleFn =>
    (v) => v.trim().length > n
      ? (msg ?? `Máximo ${n} caracteres`)
      : null,

  email: (msg = 'Introduce un email válido'): RuleFn =>
    (v) => v.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? msg : null,

  noSpaces: (msg = 'No puede contener espacios'): RuleFn =>
    (v) => /\s/.test(v) ? msg : null,

  pattern: (regex: RegExp, msg: string): RuleFn =>
    (v) => v.trim() !== '' && !regex.test(v) ? msg : null,

  url: (msg = 'Introduce una URL válida'): RuleFn =>
    (v) => {
      if (v.trim() === '') return null  // campo vacío: lo gestiona rules.required
      try {
        const parsed = new URL(v.trim())
        return parsed.protocol === 'http:' || parsed.protocol === 'https:'
          ? null
          : msg
      } catch {
        return msg
      }
    },
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useFormValidation — Gestión de errores de validación para formularios.
 *
 * Decisión de diseño: las reglas se definen fuera del componente
 * (a nivel de módulo o en el cuerpo del componente con useMemo) para
 * evitar que se recreen en cada render y provoquen re-renders innecesarios.
 *
 * @example
 *   const { errors, validate, clearError } = useFormValidation<MyForm>({
 *     email: [rules.required(), rules.email()],
 *     username: [rules.required(), rules.minLength(3), rules.noSpaces()],
 *   })
 */
export function useFormValidation<T extends object>(
  validationRules: ValidationRules<T>,
  crossValidate?: CrossValidateFn<T>
): UseFormValidationReturn<T> {
  const [errors, setErrors] = useState<ValidationErrors<T>>({})

  const validate = (values: Record<string, unknown>): boolean => {
    const newErrors: ValidationErrors<T> = {}

    for (const field in validationRules) {
      const fieldRules = validationRules[field as keyof T]
      if (!fieldRules) continue

      const value = String(values[field] ?? '')

      for (const rule of fieldRules) {
        const error = rule(value)
        if (error) {
          newErrors[field as keyof T] = error
          break // Primera regla que falla detiene la evaluación del campo
        }
      }
    }

    if (crossValidate) {
      crossValidate(values, (field, message) => {
        if (!newErrors[field]) {  // no sobreescribir errores de campo previos
          newErrors[field] = message
        }
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

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
    // Sin errores: limpiar si había uno previo
    setErrors(prev => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [validationRules])

  const clearError = (field: keyof T) => {
    setErrors((prev) => {
      if (!prev[field]) return prev // Sin cambios si ya no hay error
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const clearAll = () => setErrors({})

  return { errors, validate, clearError, clearAll, validateField }
}