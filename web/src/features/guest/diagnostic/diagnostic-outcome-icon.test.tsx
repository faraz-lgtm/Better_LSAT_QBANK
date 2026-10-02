import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import {
  DiagnosticOutcomeIcon,
  diagnosticOutcomeKind,
} from '@/features/guest/diagnostic/diagnostic-outcome-icon'

describe('diagnosticOutcomeKind', () => {
  it('maps correct / incorrect / empty', () => {
    expect(diagnosticOutcomeKind({ isCorrect: true })).toBe('correct')
    expect(diagnosticOutcomeKind({ isCorrect: false })).toBe('incorrect')
    expect(diagnosticOutcomeKind({ isCorrect: false, isUnanswered: true })).toBe('empty')
  })
})

describe('DiagnosticOutcomeIcon', () => {
  it('renders Figma card assets for correct, incorrect, and empty', () => {
    const { rerender } = render(<DiagnosticOutcomeIcon kind="correct" variant="card" />)
    expect(screen.getByRole('img', { name: 'Correct' })).toBeInTheDocument()
    expect(document.querySelector('img[src="/figma/diagnostic/outcome-correct.svg"]')).toBeTruthy()

    rerender(<DiagnosticOutcomeIcon kind="incorrect" variant="card" />)
    expect(screen.getByRole('img', { name: 'Incorrect' })).toBeInTheDocument()
    expect(document.querySelector('img[src="/figma/diagnostic/outcome-incorrect.svg"]')).toBeTruthy()

    rerender(<DiagnosticOutcomeIcon kind="empty" variant="card" />)
    expect(screen.getByRole('img', { name: 'Unanswered' })).toBeInTheDocument()
    expect(document.querySelector('img[src="/figma/diagnostic/outcome-empty.svg"]')).toBeTruthy()
  })

  it('renders pill variant with colored disc', () => {
    render(<DiagnosticOutcomeIcon kind="incorrect" variant="pill" />)
    expect(screen.getByRole('img', { name: 'Incorrect' })).toHaveClass('bg-[#df1c41]')
  })
})
