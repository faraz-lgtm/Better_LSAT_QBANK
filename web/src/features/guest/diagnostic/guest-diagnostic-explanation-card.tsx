import type { MiniDiagnosticExplanation } from '@/lib/api/diagnostic'
import { HtmlContent } from '@/lib/html/html-content'
import { cn } from '@/lib/utils'

type GuestDiagnosticExplanationCardProps = {
  number: number
  explanation: MiniDiagnosticExplanation
  isCorrect: boolean
  selectedAnswer?: string | null
}

function GuestDiagnosticExplanationCard({
  number,
  explanation,
  isCorrect,
  selectedAnswer,
}: GuestDiagnosticExplanationCardProps) {
  const normalizedSelected = selectedAnswer?.trim().toUpperCase() ?? null

  return (
    <article className="border-t border-[#dfe1e7] bg-white p-6">
      <div className="flex items-start gap-6">
        <div
          className={cn(
            'flex size-14 shrink-0 items-center justify-center rounded-[14px] text-2xl font-bold text-white',
            isCorrect ? 'bg-[#00bc54]' : 'bg-[#df1c41]',
          )}
        >
          {number}
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <p className="text-lg font-semibold text-[#062357]">
              Mini Diagnostic · Q{number}
              {explanation.questionType ? ` · ${explanation.questionType}` : ''}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full border border-[#dfe1e7] bg-[#f6f8fa] px-2 py-0.5 text-[10px]">LR</span>
              {explanation.questionType ? (
                <span className="rounded-full border border-[#dfe1e7] bg-[#f6f8fa] px-2 py-0.5 text-[10px]">
                  {explanation.questionType}
                </span>
              ) : null}
              {explanation.difficulty ? (
                <span className="rounded-full border border-[#dfe1e7] bg-[#f6f8fa] px-2 py-0.5 text-[10px]">
                  Level {explanation.difficulty}
                </span>
              ) : null}
            </div>
          </div>

          {explanation.stimulusText ? (
            <div className="rounded-[12px] border border-[#dfe1e7] bg-[#f9f9fb] p-4 text-sm leading-[1.6] text-[#062357]">
              {explanation.stimulusText}
            </div>
          ) : null}

          <p className="text-base font-medium leading-[1.6] text-[#062357]">{explanation.stemText}</p>

          <div className="space-y-2">
            {explanation.choices.map((choice) => {
              const letter = choice.letter.toUpperCase()
              const isCorrectChoice = explanation.correctAnswer === letter
              const isSelected = normalizedSelected === letter
              return (
                <div
                  key={letter}
                  className={cn(
                    'rounded-[12px] border px-4 py-3',
                    isCorrectChoice
                      ? 'border-[#00bc54] bg-[#e8fff1]'
                      : isSelected
                        ? 'border-[#df1c41] bg-[#fff0f3]'
                        : 'border-[#dfe1e7] bg-white',
                  )}
                >
                  <p className="text-sm font-semibold text-[#062357]">
                    {letter}) {choice.text}
                  </p>
                  {choice.explanation ? (
                    <p className="mt-1 text-sm leading-[1.5] text-[#666d80]">{choice.explanation}</p>
                  ) : null}
                </div>
              )
            })}
          </div>

          {explanation.explanationHtml ? (
            <div className="rounded-[12px] border border-[#dfe1e7] bg-[#f9f9fb] p-4">
              <HtmlContent
                html={explanation.explanationHtml}
                className="explanation-detail-body max-w-none text-[#062357]"
              />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export { GuestDiagnosticExplanationCard }
