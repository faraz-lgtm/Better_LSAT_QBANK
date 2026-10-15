import { assertEquals } from 'jsr:@std/assert@1'
import {
  checkoutPlanFromLineDescription,
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

Deno.test('checkoutPlanFromLineDescription maps catalog intervals', () => {
  assertEquals(
    checkoutPlanFromLineDescription('1 × Better LSAT Monthly (at $69.00 / month)'),
    'monthly',
  )
  assertEquals(
    checkoutPlanFromLineDescription('Better LSAT 3 Months'),
    'three_month',
  )
  assertEquals(
    checkoutPlanFromLineDescription('1 x Better LSAT 6 Months (at $354.00 / every 6 months)'),
    'six_month',
  )
  assertEquals(
    checkoutPlanFromLineDescription('Better LSAT Yearly'),
    'yearly',
  )
  assertEquals(checkoutPlanFromLineDescription('LawHub Advantage'), null)
})

Deno.test('resolveInvoiceTitle prefers catalog plan names over LawHub-first combo lines', () => {
  assertEquals(
    resolveInvoiceTitle(['LawHub Advantage', '1 x Better LSAT Core (at $70.00 / month)'], 'core'),
    'Monthly + LawHub',
  )
  assertEquals(
    resolveInvoiceTitle(['LawHub Advantage'], 'core'),
    'Monthly + LawHub',
  )
  assertEquals(
    resolveInvoiceTitle(['1 x Better LSAT Core (at $70.00 / month)'], 'core'),
    'Monthly',
  )
  assertEquals(
    resolveInvoiceTitle(['Better LSAT Live'], null),
    'Live',
  )
  assertEquals(
    resolveInvoiceTitle(['Better LSAT 3 Months'], 'core'),
    '3 Months',
  )
  assertEquals(
    resolveInvoiceTitle(['LawHub Advantage', 'Better LSAT Yearly'], null, 'yearly'),
    'Yearly + LawHub',
  )
  assertEquals(resolveInvoiceTitle([], 'live'), 'Live')
  assertEquals(resolveInvoiceTitle([], null), 'Monthly')
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
  })
  assertEquals(renewal.title, 'Monthly')

  const quarterly = mapStripeInvoice({
    id: 'in_3',
    number: 'D3FRIGTV-0002',
    amountPaid: 19200,
    currency: 'usd',
    status: 'paid',
    created: 1_724_500_000,
    invoicePdf: null,
    hostedInvoiceUrl: null,
    lineDescriptions: ['Better LSAT 3 Months'],
    planTierFallback: 'core',
    checkoutPlanHint: 'three_month',
  })
  assertEquals(quarterly.title, '3 Months')
})
