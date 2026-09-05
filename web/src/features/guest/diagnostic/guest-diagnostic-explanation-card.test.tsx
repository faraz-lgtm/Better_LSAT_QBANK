import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { GuestDiagnosticExplanationCard } from '@/features/guest/diagnostic/guest-diagnostic-explanation-card'
import type { MiniDiagnosticExplanation } from '@/lib/api/diagnostic'

const explanation: MiniDiagnosticExplanation = {
  sourceItemId: 'mini-diag-q1',
  questionNumber: 1,
  questionType: 'Main Conclusion',
  difficulty: 1,
  stimulusText: 'Stimulus text',
  stemText: 'Which conclusion?',
  correctAnswer: 'C',
  explanationHtml: '<p>Full write-up</p>',
  choices: [
    { letter: 'A', text: 'Choice A', explanation: 'Wrong because premise' },
    { letter: 'C', text: 'Choice C', explanation: 'Matches the conclusion' },
  ],
}

describe('GuestDiagnosticExplanationCard', () => {
  it('renders result stats only (explanations live on Review in Tester)', () => {
    render(
      <GuestDiagnosticExplanationCard
        number={1}
        explanation={explanation}
        isCorrect
        selectedAnswer="C"
        targetTimeSeconds={45}
        yourTimeSeconds={50}
      />,
    )

    expect(screen.getByText(/Mini Diagnostic · Q1 · Main Conclusion/)).toBeInTheDocument()
    expect(screen.getByText(/Target time:/)).toBeInTheDocument()
    expect(screen.getByText(/Your time:/)).toBeInTheDocument()
    expect(screen.getByText(/Answer popularity/i)).toBeInTheDocument()
    expect(screen.queryByText("Not enough answers yet")).not.toBeInTheDocument()
    expect(screen.getByText("C")).toBeInTheDocument()
    expect(screen.queryByText('Stimulus text')).not.toBeInTheDocument()
    expect(screen.queryByText('Which conclusion?')).not.toBeInTheDocument()
    expect(screen.queryByText(/Choice C/)).not.toBeInTheDocument()
    expect(screen.queryByText('Full write-up')).not.toBeInTheDocument()
  })
})
