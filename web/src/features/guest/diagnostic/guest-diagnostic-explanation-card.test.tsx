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
  it('renders question metadata, choices, and explanation html', () => {
    render(
      <GuestDiagnosticExplanationCard
        number={1}
        explanation={explanation}
        isCorrect
      />,
    )

    expect(screen.getByText(/Mini Diagnostic · Q1 · Main Conclusion/)).toBeInTheDocument()
    expect(screen.getByText('Stimulus text')).toBeInTheDocument()
    expect(screen.getByText('Which conclusion?')).toBeInTheDocument()
    expect(screen.getByText(/Choice C/)).toBeInTheDocument()
    expect(screen.getByText('Matches the conclusion')).toBeInTheDocument()
    expect(screen.getByText('Full write-up')).toBeInTheDocument()
  })
})
