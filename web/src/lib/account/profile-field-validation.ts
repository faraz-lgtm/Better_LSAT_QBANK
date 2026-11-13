/** Mirrors users edge `assertAccountNamePartsHaveNoDigits` for account-form UX. */
export function validateAccountNameParts(firstName: string, lastName: string): string | null {
  const first = firstName.trim()
  const last = lastName.trim()
  if (!first || !last) return "First and last name are required."
  if (/\d/.test(first) || /\d/.test(last)) return "Name cannot include numbers."
  return null
}

/** Live feedback while typing — digits in name parts only (required checked on submit). */
export function getAccountNameTypingError(firstName: string, lastName: string): string | null {
  if (/\d/.test(firstName) || /\d/.test(lastName)) return "Name cannot include numbers."
  return null
}

/** Mirrors users edge `normalizeAccountPhone` for account-form UX. */
export function validateAccountPhone(phone: string): string | null {
  const trimmed = phone.trim()
  if (!trimmed) return "Phone is required."
  if (/[A-Za-z]/.test(trimmed)) return "Phone number cannot include letters."
  if (!/^[\d\s()+.\-]+$/.test(trimmed)) return "Enter a valid phone number."
  if (trimmed.replace(/\D/g, "").length < 7) return "Enter a valid phone number."
  return null
}

/** Live feedback while typing — letters/symbols only (required/length checked on submit). */
export function getAccountPhoneTypingError(phone: string): string | null {
  if (!phone) return null
  if (/[A-Za-z]/.test(phone)) return "Phone number cannot include letters."
  if (!/^[\d\s()+.\-]+$/.test(phone)) return "Enter a valid phone number."
  return null
}
