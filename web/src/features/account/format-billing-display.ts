import type { BillingInvoice, BillingPaymentMethod } from '@/lib/api/billing'

export function formatMaskedCardNumber(last4: string): string {
  const digits = last4.replace(/\D/g, '').slice(-4)
  if (!digits) return '•••• •••• •••• ••••'
  return `•••• •••• •••• ${digits}`
}

export function formatCardExpiry(expMonth: number, expYear: number): string {
  const month = String(expMonth).padStart(2, '0')
  const year = String(expYear).slice(-2)
  return `Expires ${month} / ${year}`
}

export function formatInvoiceAmount(amountPaidCents: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amountPaidCents / 100)
  } catch {
    return `$${(amountPaidCents / 100).toFixed(2)}`
  }
}

export function formatInvoiceDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function formatInvoiceMeta(invoice: BillingInvoice): string {
  const dateLabel = formatInvoiceDate(invoice.createdAt)
  const number = invoice.number?.trim()
  if (number && dateLabel) return `${number} · ${dateLabel}`
  if (number) return number
  return dateLabel
}

export function invoiceStatusLabel(status: string): string {
  if (status === 'paid') return 'Paid'
  if (status === 'open') return 'Open'
  if (status === 'void') return 'Void'
  if (status === 'uncollectible') return 'Failed'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export type { BillingInvoice, BillingPaymentMethod }
