
export type BillingPaymentMethodDto = {
  id: string
  brand: string
  brandLabel: string
  last4: string
  expMonth: number
  expYear: number
  funding: string | null
  displayLabel: string
  isDefault: boolean
}

export type BillingInvoiceDto = {
  id: string
  number: string | null
  title: string
  amountPaidCents: number
  currency: string
  status: string
  createdAt: string
  invoicePdfUrl: string | null
  hostedInvoiceUrl: string | null
}

function titleCase(value: string): string {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

export function formatCardBrandLabel(brand: string): string {
  const normalized = brand.trim().toLowerCase()
  if (normalized === 'visa') return 'VISA'
  if (normalized === 'mastercard') return 'MC'
  if (normalized === 'amex' || normalized === 'american express') return 'AMEX'
  if (normalized === 'discover') return 'DISC'
  return brand.trim().slice(0, 4).toUpperCase() || 'CARD'
}

export function formatCardDisplayLabel(brand: string, funding: string | null | undefined): string {
  const brandName = titleCase(brand.trim() || 'Card')
  if (funding === 'credit' || funding === 'debit' || funding === 'prepaid') {
    return `${brandName} ${titleCase(funding)}`
  }
  return brandName
}

function normalizeLine(line: string): string {
  return line.trim().toLowerCase()
}

function lineLooksLikeLawHub(line: string): boolean {
  const n = normalizeLine(line)
  return n.includes('lawhub') || n.includes('lsac') || n.includes('prepplus') || n.includes('prep plus')
}

function lineLooksLikeLive(line: string): boolean {
  const n = normalizeLine(line)
  if (n.includes('better lsat live')) return true
  return /\blive\b/.test(n) && (n.includes('lsat') || n.includes('monthly') || n.includes('plan'))
}

function lineLooksLikeCore(line: string): boolean {
  const n = normalizeLine(line)
  return n.includes('better lsat core') || /\bcore\b/.test(n)
}

/**
 * Prefer plan names over raw Stripe line copy (LawHub often appears first on combo invoices).
 */
export function resolveInvoiceTitle(
  lineDescriptions: string[],
  planTierFallback?: 'core' | 'live' | null,
): string {
  const lines = lineDescriptions.map((line) => line.trim()).filter(Boolean)
  const hasLawHub = lines.some(lineLooksLikeLawHub)
  const hasLive = lines.some(lineLooksLikeLive)
  const hasCore = lines.some(lineLooksLikeCore)

  let planTitle: string | null = null
  if (hasLive || planTierFallback === 'live') planTitle = 'Live Monthly'
  else if (hasCore || planTierFallback === 'core') planTitle = 'Core Monthly'

  if (planTitle) {
    return hasLawHub ? `${planTitle} + LawHub` : planTitle
  }

  if (hasLawHub) return 'LawHub Advantage'
  if (lines[0]) {
    // Strip noisy Stripe quantity prefixes like "1 × …"
    return lines[0].replace(/^\d+\s*[x×]\s*/i, '').trim() || 'Pro Monthly'
  }
  return 'Pro Monthly'
}

export function mapStripeCardPaymentMethod(input: {
  id: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
  funding?: string | null
  isDefault: boolean
}): BillingPaymentMethodDto {
  const funding = input.funding ?? null
  return {
    id: input.id,
    brand: input.brand,
    brandLabel: formatCardBrandLabel(input.brand),
    last4: input.last4,
    expMonth: input.expMonth,
    expYear: input.expYear,
    funding,
    displayLabel: formatCardDisplayLabel(input.brand, funding),
    isDefault: input.isDefault,
  }
}

export function mapStripeInvoice(input: {
  id: string
  number: string | null
  amountPaid: number
  currency: string
  status: string | null
  created: number
  invoicePdf: string | null
  hostedInvoiceUrl: string | null
  lineDescriptions: string[]
  planTierFallback?: 'core' | 'live' | null
}): BillingInvoiceDto {
  return {
    id: input.id,
    number: input.number,
    title: resolveInvoiceTitle(input.lineDescriptions, input.planTierFallback),
    amountPaidCents: input.amountPaid,
    currency: input.currency,
    status: input.status ?? 'unknown',
    createdAt: new Date(input.created * 1000).toISOString(),
    invoicePdfUrl: input.invoicePdf,
    hostedInvoiceUrl: input.hostedInvoiceUrl,
  }
}
