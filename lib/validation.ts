/** Shared form validation utilities for web-pro */

export type FieldError = string | null;
export type FormErrors<T extends string> = Partial<Record<T, FieldError>>;

/** Validate a required text field */
export function required(value: string | undefined | null, label: string): FieldError {
  if (!value || !value.trim()) return `${label} est obligatoire`;
  return null;
}

/** Min length constraint */
export function minLen(value: string, min: number, label: string): FieldError {
  if (value.trim().length < min) return `${label} doit contenir au moins ${min} caractères`;
  return null;
}

/** Max length constraint */
export function maxLen(value: string, max: number, label: string): FieldError {
  if (value.trim().length > max) return `${label} ne peut pas dépasser ${max} caractères`;
  return null;
}

/** Email format */
export function email(value: string): FieldError {
  if (!value.trim()) return null; // optional
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(value.trim())) return 'Adresse e-mail invalide';
  return null;
}

/** Phone format (international, accepts +, spaces, digits, parens, dashes) */
export function phone(value: string): FieldError {
  if (!value.trim()) return null; // optional
  const re = /^[+\d][\d\s().+-]{6,19}$/;
  if (!re.test(value.trim())) return 'Numéro de téléphone invalide';
  return null;
}

/** Date: must not be in the past */
export function futureDate(value: string, label: string): FieldError {
  if (!value) return null;
  const d = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d < today) return `${label} ne peut pas être dans le passé`;
  return null;
}

/** End date must be >= start date */
export function dateRange(start: string, end: string): FieldError {
  if (!start || !end) return null;
  if (new Date(end) < new Date(start)) return 'La date de fin doit être après la date de début';
  return null;
}

/** End time must be after start time */
export function timeRange(startTime: string, endTime: string): FieldError {
  if (!startTime || !endTime) return null;
  if (endTime <= startTime) return "L'heure de fin doit être après l'heure de début";
  return null;
}

/** Positive number */
export function positiveNumber(value: string | number, label: string): FieldError {
  const n = Number(value);
  if (isNaN(n) || n <= 0) return `${label} doit être un nombre positif`;
  return null;
}

/** Run all validators and return first error, or null */
export function firstError(...errors: FieldError[]): FieldError {
  return errors.find(e => e !== null) ?? null;
}

/** Collect all non-null errors from a record */
export function hasErrors<T extends string>(errors: FormErrors<T>): boolean {
  return Object.values(errors).some(e => e !== null && e !== undefined);
}
