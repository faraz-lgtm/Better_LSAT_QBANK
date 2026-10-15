import { assertEquals } from 'jsr:@std/assert@1'
import {
  formatCardBrandLabel,
  formatCardDisplayLabel,
  mapStripeCardPaymentMethod,
  mapStripeInvoice,
  resolveInvoiceTitle,
} from './billing-payment-mapper.ts'

Deno.test('formatCardBrandLabel maps common brands', () => {
  assertEquals(formatCardBrandLabel('visa'), 'VISA')
  assertEquals(formatCardBrandLabel('mastercard'), 'MC')
  assertEquals(formatCardBrandLabel('amex'), 'AMEX')
})

Deno.test('formatCardDisplayLabel includes funding when present', () => {
  assertEquals(formatCardDisplayLabel('visa', 'credit'), 'Visa Credit')
  assertEquals(formatCardDisplayLabel('mastercard', null), 'Mastercard')
})

Deno.test('mapStripeCardPaymentMethod builds account card DTO', () => {
  const dto = mapStripeCardPaymentMethod({
    id: 'pm_1',
    brand: 'visa',
    last4: '4242',
    expMonth: 9,
    expYear: 2028,
    funding: 'credit',
    isDefault: true,
  })
  assertEquals(dto.brandLabel, 'VISA')
  assertEquals(dto.last4, '4242')
  assertEquals(dto.displayLabel, 'Visa Credit')
  assertEquals(dto.isDefault, true)
})

Deno.test('resolveInvoiceTitle prefers plan over LawHub-first combo lines', () => {
  assertEquals(
    resolveInvoiceTitle(['LawHub Advantage', '1 x Better LSAT Core (at $70.00 / month)'], 'core', 'monthly'),
    'Monthly + LawHub',
  )
  assertEquals(
    resolveInvoiceTitle(['LawHub Advantage'], 'core', 'six_month'),
    '6 Months + LawHub',
  )
  assertEquals(
    resolveInvoiceTitle(['1 x Better LSAT Core (at $70.00 / month)'], 'core', 'three_month'),
    '3 Months',
  )
  assertEquals(
    resolveInvoiceTitle(['Better LSAT Core'], 'core', 'yearly'),
    'Yearly',
  )
  assertEquals(
    resolveInvoiceTitle(['1 x Better LSAT Core (at $70.00 / month)'], 'core'),
    'Monthly',
  )
  assertEquals(
    resolveInvoiceTitle(['Better LSAT Live'], null),
    'Live Monthly',
  )
  assertEquals(resolveInvoiceTitle([], 'live'), 'Live Monthly')
  assertEquals(resolveInvoiceTitle([], null), 'Pro Monthly')
})

Deno.test('mapStripeInvoice uses resolved plan titles', () => {
  const combo = mapStripeInvoice({
    id: 'in_1',
    number: 'INV-2026-008',
    amountPaid: 16900,
    currency: 'usd',
    status: 'paid',
    created: 1_724_500_000,
    invoicePdf: 'https://stripe.test/pdf',
    hostedInvoiceUrl: null,
    lineDescriptions: ['LawHub Advantage', 'Better LSAT Core'],
    planTierFallback: 'core',
    checkoutPlan: 'monthly',
  })
  assertEquals(combo.title, 'Monthly + LawHub')
  assertEquals(combo.amountPaidCents, 16900)

  const renewal = mapStripeInvoice({
    id: 'in_2',
    number: 'D3FRIGTV-0001',
    amountPaid: 7000,
    currency: 'usd',
    status: 'paid',
    created: 1_724_500_000,
    invoicePdf: null,
    hostedInvoiceUrl: null,
    lineDescriptions: ['1 x Better LSAT Core (at $70.00 / month)'],
    planTierFallback: 'core',
    checkoutPlan: 'monthly',
  })
  assertEquals(renewal.title, 'Monthly')

  const sixMonth = mapStripeInvoice({
    id: 'in_3',
    number: 'INV-006',
    amountPaid: 35400,
    currency: 'usd',
    status: 'paid',
    created: 1_724_500_000,
    invoicePdf: null,
    hostedInvoiceUrl: null,
    lineDescriptions: ['Better LSAT Core'],
    planTierFallback: 'core',
    checkoutPlan: 'six_month',
  })
  assertEquals(sixMonth.title, '6 Months')
})
