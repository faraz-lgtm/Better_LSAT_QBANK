import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { useAdminApi } from "@/features/admin/use-admin-api"

function completionClass(question: Record<string, unknown>) {
  const hasExplanation = Boolean(question.explanation)
  const hasType = Boolean(question.question_type_id)
  if (!hasExplanation && !hasType) return "border-l-4 border-l-[#c23131]"
  if (hasExplanation && hasType) return "border-l-4 border-l-[#1f8b4c]"
  return "border-l-4 border-l-[#c78410]"
}

function AdminPrepTestDetailPage() {
  const adminApi = useAdminApi()
  const navigate = useNavigate()
  const { prepTestId } = useParams()
  const [prepTest, setPrepTest] = useState<Record<string, unknown> | null>(null)
  const [stats, setStats] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(true)

  useEffect(() => {
    let alive = true
    async function openNextIncomplete() {
      if (!adminApi || !prepTestId) return
      try {
        const nextQuestion = await adminApi.getNextQuestionForPrepTest(prepTestId)
        if (!alive) return
        navigate(
          `/admin/preptests/${prepTestId}/sections/${nextQuestion.sectionId}/questions/${nextQuestion.id}`,
          { replace: true },
        )
      } catch (e) {
        if (!alive) return
        setError(e instanceof Error ? e.message : "Failed to open next incomplete question")
        setRedirecting(false)
      }
    }
    void openNextIncomplete()
    return () => {
      alive = false
    }
  }, [adminApi, navigate, prepTestId])

  useEffect(() => {
    let alive = true
    async function load() {
      if (!adminApi || !prepTestId) return
      if (redirecting) return
      try {
        const data = (await adminApi.getPrepTestDetail(prepTestId)) as {
          prepTest: Record<string, unknown>
          stats: Record<string, number>
        }
        if (!alive) return
        setPrepTest(data.prepTest)
        setStats(data.stats)
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load prep test")
      }
    }
    void load()
    return () => {
      alive = false
    }
  }, [adminApi, prepTestId, redirecting])

  const sections = useMemo(() => {
    const value = prepTest?.admin_sections
    return (Array.isArray(value) ? value : []) as Array<Record<string, unknown>>
  }, [prepTest])

  return (
    <section className="space-y-4">
      {redirecting && (
        <p className="text-sm text-[var(--text3)]">Opening next incomplete question...</p>
      )}
      <h1 className="text-2xl font-semibold text-[#082c6b]">{String(prepTest?.title ?? "PrepTest Detail")}</h1>
      {error && <p className="text-sm text-[#95122b]">{error}</p>}
      <div className="grid gap-2 rounded-xl border border-[#dfe1e7] bg-white p-3 text-sm md:grid-cols-3">
        <p>Explanations: {stats.explained ?? 0}/{stats.total ?? 0}</p>
        <p>Tagged: {stats.tagged ?? 0}/{stats.total ?? 0}</p>
        <p>Difficulty: {stats.difficultySet ?? 0}/{stats.total ?? 0}</p>
      </div>
      <div className="space-y-3">
        {sections.map((section) => {
          const questions = (section.admin_questions as Array<Record<string, unknown>> | undefined) ?? []
          return (
            <article key={String(section.id)} className="rounded-xl border border-[#dfe1e7] bg-white p-3">
              <h2 className="text-base font-semibold text-[#082c6b]">
                Section {String(section.section_number ?? "-")} · {String(section.section_type ?? "Unknown")}
              </h2>
              <ul className="mt-3 space-y-2">
                {questions.map((question) => (
                  <li key={String(question.id)} className={`rounded border border-[#ecf0f6] px-3 py-2 ${completionClass(question)}`}>
                    <Link
                      className="text-[#0d47a1] underline"
                      to={`/admin/preptests/${String(prepTest?.id)}/sections/${String(section.id)}/questions/${String(question.id)}`}
                    >
                      Q{String(question.question_number ?? "-")} open editor
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export { AdminPrepTestDetailPage }
