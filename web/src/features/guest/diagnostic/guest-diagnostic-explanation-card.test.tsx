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
  it('renders redesigned result stats card (explanations live on Review in Tester)', () => {
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

    expect(screen.getByTestId('diagnostic-explanation-card')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Q1' })).toBeInTheDocument()
    expect(screen.getByText('LR')).toBeInTheDocument()
    expect(screen.getByText('Main Conclusion')).toBeInTheDocument()
    expect(screen.getByText('Timing')).toBeInTheDocument()
    expect(screen.getByText(/Target time:/)).toBeInTheDocument()
    expect(screen.getByText('00:45')).toBeInTheDocument()
    expect(screen.getByText(/Your time:/)).toBeInTheDocument()
    expect(screen.getByText('00:50')).toBeInTheDocument()
    expect(screen.getByText('(00:05 over)')).toBeInTheDocument()
    expect(screen.getByText('Difficulty')).toBeInTheDocument()
    expect(screen.getByText('Easiest')).toBeInTheDocument()
    expect(screen.getByText(/Answer popularity/i)).toBeInTheDocument()
    expect(screen.queryByText('Not enough answers yet')).not.toBeInTheDocument()
    expect(screen.getByText('C')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Correct' })).toBeInTheDocument()
    expect(screen.queryByText('Stimulus text')).not.toBeInTheDocument()
    expect(screen.queryByText('Which conclusion?')).not.toBeInTheDocument()
    expect(screen.queryByText(/Choice C/)).not.toBeInTheDocument()
    expect(screen.queryByText('Full write-up')).not.toBeInTheDocument()
  })

  it('shows incorrect outcome styling when the answer is wrong', () => {
    render(
      <GuestDiagnosticExplanationCard
        number={2}
        explanation={{ ...explanation, difficulty: 4, questionType: 'Flaw' }}
        isCorrect={false}
        selectedAnswer="A"
        targetTimeSeconds={105}
        yourTimeSeconds={4}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Q2' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Incorrect' })).toBeInTheDocument()
    expect(screen.getByText('Flaw')).toBeInTheDocument()
    expect(screen.getByText('01:45')).toBeInTheDocument()
    expect(screen.getByText('00:04')).toBeInTheDocument()
    expect(screen.getByText('(01:41 under)')).toBeInTheDocument()
    expect(screen.getByText('Hard')).toBeInTheDocument()
  })
})
