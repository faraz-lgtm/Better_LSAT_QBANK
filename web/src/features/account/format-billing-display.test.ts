import { describe, expect, it } from 'vitest'

import {
  checkoutPlanFromInvoiceTitle,
  formatCardExpiry,
  formatInvoiceAmount,
  formatInvoiceMeta,
  formatMaskedCardNumber,
  invoiceStatusLabel,
} from './format-billing-display'

describe('format-billing-display', () => {
  it('masks card last4', () => {
    expect(formatMaskedCardNumber('4242')).toBe('•••• •••• •••• 4242')
  })

  it('formats expiry', () => {
    expect(formatCardExpiry(9, 2028)).toBe('Expires 09 / 28')
  })

  it('formats invoice amount and meta', () => {
    expect(formatInvoiceAmount(3900, 'usd')).toBe('$39.00')
    expect(
      formatInvoiceMeta({
        id: 'in_1',
        number: 'INV-2026-008',
        title: 'Pro Monthly',
        amountPaidCents: 3900,
        currency: 'usd',
        status: 'paid',
        createdAt: '2026-08-24T12:00:00.000Z',
        invoicePdfUrl: null,
        hostedInvoiceUrl: null,
      }),
    ).toContain('INV-2026-008')
  })

  it('labels invoice status', () => {
    expect(invoiceStatusLabel('paid')).toBe('Paid')
  })

  it('maps billing history titles onto checkout plan intervals', () => {
    expect(checkoutPlanFromInvoiceTitle('3 Months + LawHub')).toBe('three_month')
    expect(checkoutPlanFromInvoiceTitle('6 Months')).toBe('six_month')
    expect(checkoutPlanFromInvoiceTitle('12 Months + LawHub')).toBe('yearly')
    expect(checkoutPlanFromInvoiceTitle('Monthly + LawHub')).toBe('monthly')
    expect(checkoutPlanFromInvoiceTitle('LawHub Advantage')).toBeNull()
  })
})
