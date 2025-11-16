import validationConfig from '@shared/validationRules.json'

type LengthRule = { minLength: number; maxLength: number }

type ValidationConfig = {
  title: LengthRule
  adminPassword: LengthRule
  personName: LengthRule
  participantName: LengthRule
  game: { minParticipants: number }
}

export const validationRules: ValidationConfig = validationConfig as ValidationConfig

export type ValidationError = {
  key: string
  params?: Record<string, string | number>
  fieldKey?: string
}

export type ValidatorFn = (value: string) => ValidationError | null

const createLengthValidator = (rules: LengthRule, fieldKey: string): ValidatorFn => {
  return (value: string) => {
    const normalized = normalizeWhitespace(value)
    if (!normalized) {
      return { key: 'validation.required', fieldKey }
    }
    if (rules.minLength && normalized.length < rules.minLength) {
      return { key: 'validation.minLength', params: { min: rules.minLength }, fieldKey }
    }
    if (rules.maxLength && normalized.length > rules.maxLength) {
      return { key: 'validation.maxLength', params: { max: rules.maxLength }, fieldKey }
    }
    return null
  }
}

export const validators = {
  title: createLengthValidator(validationRules.title, 'fields.title'),
  adminPassword: createLengthValidator(validationRules.adminPassword, 'fields.adminPassword'),
  personName: createLengthValidator(validationRules.personName, 'fields.personName'),
  participantName: createLengthValidator(validationRules.participantName, 'fields.participantName'),
}

export type TranslateFn = (key: string, params?: Record<string, string | number>) => string

export function formatValidationError(error: ValidationError, t: TranslateFn): string {
  const params = { ...(error.params || {}) }
  if (error.fieldKey) {
    params.field = t(error.fieldKey)
  }
  return t(error.key, params)
}

export const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim()
