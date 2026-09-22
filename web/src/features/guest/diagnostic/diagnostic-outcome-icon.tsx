import { cn } from '@/lib/utils'

export type DiagnosticOutcomeKind = 'correct' | 'incorrect' | 'empty'

type DiagnosticOutcomeIconProps = {
  kind: DiagnosticOutcomeKind
  /** `card` = 24px stroke under question number; `pill` = white glyph on colored 32px circle */
  variant?: 'card' | 'pill'
  className?: string
}

const CARD_SIZE = 24
const PILL_SIZE = 32
const PILL_GLYPH = { correct: 19, incorrect: 19, empty: 16 } as const

const CARD_SRC: Record<DiagnosticOutcomeKind, string> = {
  correct: '/figma/diagnostic/outcome-correct.svg',
  incorrect: '/figma/diagnostic/outcome-incorrect.svg',
  empty: '/figma/diagnostic/outcome-empty.svg',
}

const PILL_SRC: Record<DiagnosticOutcomeKind, string> = {
  correct: '/figma/diagnostic/pill-correct.svg',
  incorrect: '/figma/diagnostic/pill-incorrect.svg',
  empty: '/figma/diagnostic/outcome-empty.svg',
}

const PILL_BG: Record<DiagnosticOutcomeKind, string> = {
  correct: 'bg-[#40c4aa]',
  incorrect: 'bg-[#df1c41]',
  empty: 'bg-[#f2a4b3]',
}

const OUTCOME_LABEL: Record<DiagnosticOutcomeKind, string> = {
  correct: 'Correct',
  incorrect: 'Incorrect',
  empty: 'Unanswered',
}

function diagnosticOutcomeKind(args: {
  isCorrect: boolean
  isUnanswered?: boolean
}): DiagnosticOutcomeKind {
  if (args.isUnanswered) return 'empty'
  return args.isCorrect ? 'correct' : 'incorrect'
}

/** Figma diagnostic result icons — correct / incorrect / empty. */
function DiagnosticOutcomeIcon({
  kind,
  variant = 'card',
  className,
}: DiagnosticOutcomeIconProps) {
  const label = OUTCOME_LABEL[kind]

  if (variant === 'pill') {
    const glyph = PILL_GLYPH[kind]
    return (
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-full',
          PILL_BG[kind],
          className,
        )}
        style={{ width: PILL_SIZE, height: PILL_SIZE }}
        role="img"
        aria-label={label}
      >
        <span
          className="relative block shrink-0 overflow-clip"
          style={{ width: glyph, height: glyph }}
          aria-hidden
        >
          <img
            src={PILL_SRC[kind]}
            alt=""
            width={glyph}
            height={glyph}
            className="absolute inset-0 size-full max-w-none"
          />
        </span>
      </span>
    )
  }

  // Card: correct/incorrect are 24px stroke assets; empty sits on a pink disc (Figma score-pill glyph).
  if (kind === 'empty') {
    return (
      <span
        className={cn(
          'mx-auto inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f2a4b3]',
          className,
        )}
        style={{ width: CARD_SIZE, height: CARD_SIZE }}
        role="img"
        aria-label={label}
      >
        <span
          className="relative block shrink-0 overflow-hidden"
          style={{ width: 16, height: 16 }}
          aria-hidden
        >
          <img
            src={CARD_SRC.empty}
            alt=""
            width={16}
            height={16}
            className="absolute inset-0 size-full max-w-none object-contain"
          />
        </span>
      </span>
    )
  }

  return (
    <span
      className={cn('relative mx-auto block shrink-0 overflow-hidden', className)}
      style={{ width: CARD_SIZE, height: CARD_SIZE }}
      role="img"
      aria-label={label}
    >
      <img
        src={CARD_SRC[kind]}
        alt=""
        width={CARD_SIZE}
        height={CARD_SIZE}
        className="absolute inset-0 size-full max-w-none object-contain"
      />
    </span>
  )
}

export { DiagnosticOutcomeIcon, diagnosticOutcomeKind }
