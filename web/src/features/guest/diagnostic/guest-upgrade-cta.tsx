import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useGuestPricingModal } from '@/features/guest/pricing/guest-pricing-modal-provider'
import { cn } from '@/lib/utils'

type GuestUpgradeCtaProps = {
  variant?: 'header' | 'banner' | 'sidebar-primary' | 'sidebar-secondary'
  className?: string
}

function GuestUpgradeCta({ variant = 'header', className }: GuestUpgradeCtaProps) {
  const { openPricingModal } = useGuestPricingModal()
  const handleUpgrade = () => openPricingModal()

  if (variant === 'banner') {
    return (
      <Button
        type="button"
        onClick={handleUpgrade}
        className={cn(
          'h-10 shrink-0 rounded-[10px] bg-[var(--primary)] px-5 text-xs font-bold uppercase tracking-[0.48px] text-white hover:bg-[var(--primary-600)]',
          className,
        )}
      >
        Subscribe
      </Button>
    )
  }

  if (variant === 'sidebar-primary') {
    // Figma `20593:34154`
    return (
      <Button
        type="button"
        onClick={handleUpgrade}
        className={cn('guest-upgrade-cta-primary', className)}
      >
        Upgrade to LSAT+
      </Button>
    )
  }

  if (variant === 'sidebar-secondary') {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={handleUpgrade}
        className={cn(
          'h-10 w-full rounded-[10px] border-[var(--primary)] bg-[var(--greyscale-0)] text-sm font-semibold tracking-[0.28px] text-[var(--primary)] hover:bg-[var(--primary-25)]',
          className,
        )}
      >
        Upgrade · $79/mo
      </Button>
    )
  }

  return (
    <Button
      type="button"
      onClick={handleUpgrade}
      className={cn('guest-upgrade-cta-primary hidden sm:inline-flex', className)}
    >
      Upgrade to LSAT+
    </Button>
  )
}

function GuestFreePlanUpgradeBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-[16px] border border-[#b8d4ff] bg-[var(--primary-25)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <p className="text-sm font-medium leading-[1.5] tracking-[0.28px] text-[var(--color-student-heading)]">
        Official Performance, Reports, and Score Tracker are now available –{' '}
        <span className="font-semibold text-[var(--primary)]">95.8%</span> for plan transition
      </p>
      <GuestUpgradeCta variant="banner" />
    </div>
  )
}

function GuestDiagnosticResultsActions() {
  const { openPricingModal } = useGuestPricingModal()
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
      <Button
        type="button"
        className="h-11 rounded-[12px] bg-[var(--primary)] px-6 text-sm font-semibold tracking-[0.28px] text-white hover:bg-[var(--primary-600)]"
        onClick={openPricingModal}
      >
        Upgrade to unlock full access
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-11 rounded-[12px] border-[var(--primary)] px-6 text-sm font-semibold tracking-[0.28px] text-[var(--primary)] hover:bg-[var(--primary-25)]"
        onClick={() => navigate('/app')}
      >
        Continue to app
      </Button>
    </div>
  )
}

export { GuestDiagnosticResultsActions, GuestFreePlanUpgradeBanner, GuestUpgradeCta }
