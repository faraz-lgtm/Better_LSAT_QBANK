import { ChevronDown, ChevronUp } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  BtnBold,
  BtnBulletList,
  BtnItalic,
  BtnNumberedList,
  BtnUnderline,
  Editor,
  EditorProvider,
  Toolbar,
} from "react-simple-wysiwyg"

import { VideoExplanationModal } from "@/features/admin/components/video-explanation-modal"
import { ADMIN_QUESTION_VIDEO_SAVED } from "@/features/admin/lib/admin-question-video-messages"
import { sanitizeAdminHtml } from "@/features/admin/lib/sanitize-admin-html"
import { useAdminApi } from "@/features/admin/use-admin-api"
import { type AdminQuestionType } from "@/lib/api/admin"

type SaveState = "saved" | "saving" | "unsaved"
type SectionOption = {
  id: string
  sectionNumber: number
  sectionType: string | null
  title: string | null
  moduleCode?: string | null
  displayLabel?: string | null
  firstQuestionId: string | null
}

/** Maps blank / tag-only HTML to null for the API; keeps markup when there is visible text. */
function explanationForSave(html: string): string | null {
  const trimmed = html.trim()
  if (!trimmed) return null
  const textOnly = trimmed.replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").trim()
  if (!textOnly) return null
  return trimmed
}

function normalizeSectionType(input: unknown): "LR" | "RC" | "LG" | "" {
  if (typeof input !== "string") return ""
  const value = input.trim().toLowerCase()
  if (!value) return ""
  if (value === "lr" || value.includes("logical reasoning")) return "LR"
  if (value === "rc" || value.includes("reading comprehension")) return "RC"
  if (value === "lg" || value.includes("logic game") || value.includes("analytical reasoning")) return "LG"
  return ""
}

function optionLetterFromIndex(idx: number): string {
  return String.fromCharCode(65 + idx)
}

type ChoiceRowModel = {
  letter: string
  content: string
  explanationHtml: string
  rawChoice: unknown
}

function parseChoicesToModel(raw: unknown[]): ChoiceRowModel[] {
  return raw.map((choice, idx) => {
    const fallbackLetter = optionLetterFromIndex(idx)
    if (typeof choice === "string") {
      return {
        letter: fallbackLetter,
        content: sanitizeAdminHtml(choice),
        explanationHtml: "",
        rawChoice: choice,
      }
    }
    if (choice && typeof choice === "object") {
      const o = choice as Record<string, unknown>
      const letter = String(o.optionLetter ?? fallbackLetter)
      const expl = o.optionExplanation
      return {
        letter,
        content: sanitizeAdminHtml(o.optionContent),
        explanationHtml: typeof expl === "string" ? expl : "",
        rawChoice: { ...o },
      }
    }
    return {
      letter: fallbackLetter,
      content: "",
      explanationHtml: "",
      rawChoice: {},
    }
  })
}

function serializeChoiceRow(row: ChoiceRowModel): Record<string, unknown> {
  const expl = explanationForSave(row.explanationHtml)
  if (typeof row.rawChoice === "string") {
    const out: Record<string, unknown> = {
      optionLetter: row.letter,
      optionContent: row.rawChoice,
    }
    if (expl !== null) out.optionExplanation = expl
    return out
  }
  if (row.rawChoice && typeof row.rawChoice === "object") {
    const base = { ...(row.rawChoice as Record<string, unknown>) }
    base.optionLetter = row.letter
    if (expl === null) {
      delete base.optionExplanation
    } else {
      base.optionExplanation = expl
    }
    return base
  }
  const out: Record<string, unknown> = { optionLetter: row.letter, optionContent: "" }
  if (expl !== null) out.optionExplanation = expl
  return out
}

function AdminQuestionEditorPage() {
  const adminApi = useAdminApi()
  const navigate = useNavigate()
  const { prepTestId, sectionId, questionId } = useParams()
  const [question, setQuestion] = useState<Record<string, unknown> | null>(null)
  const [adjacent, setAdjacent] = useState<Record<string, unknown>>({})
  const [taxonomy, setTaxonomy] = useState<AdminQuestionType[]>([])
  const [sectionOptions, setSectionOptions] = useState<SectionOption[]>([])
  const [meta, setMeta] = useState<Record<string, unknown>>({})
  const [choicesModel, setChoicesModel] = useState<ChoiceRowModel[]>([])
  const [expandedLetter, setExpandedLetter] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<SaveState>("saved")
  const [error, setError] = useState<string | null>(null)
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const timer = useRef<number | null>(null)
  const choicesTimer = useRef<number | null>(null)
  const metaRef = useRef(meta)
  const choicesRef = useRef(choicesModel)

  useEffect(() => {
    metaRef.current = meta
  }, [meta])

  useEffect(() => {
    choicesRef.current = choicesModel
  }, [choicesModel])

  useEffect(() => {
    let alive = true
    async function load() {
      if (!adminApi || !questionId) return
      try {
        const data = (await adminApi.getQuestionEditorPayload(questionId)) as {
          question: Record<string, unknown>
          adjacent: Record<string, unknown>
          sectionOptions: SectionOption[]
          taxonomy: AdminQuestionType[]
        }
        if (!alive) return
        setQuestion(data.question)
        setChoicesModel(parseChoicesToModel((data.question.choices as unknown[]) ?? []))
        setExpandedLetter(null)
        setAdjacent(data.adjacent)
        setSectionOptions(data.sectionOptions ?? [])
        setTaxonomy(data.taxonomy)
        setMeta({
          explanation: data.question.explanation ?? "",
          video_url: data.question.video_url ?? "",
          difficulty: data.question.difficulty ?? "",
          question_type_id: data.question.question_type_id ?? "",
        })
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load question")
      }
    }
    void load()
    return () => {
      alive = false
    }
  }, [adminApi, questionId])

  useEffect(() => {
    function onMessage(ev: MessageEvent) {
      if (ev.origin !== window.location.origin) return
      const d = ev.data as { type?: string; questionId?: string; videoUrl?: string } | null
      if (!d || typeof d !== "object") return
      if (d.type !== ADMIN_QUESTION_VIDEO_SAVED) return
      if (String(d.questionId ?? "") !== String(questionId ?? "")) return
      const videoUrl = typeof d.videoUrl === "string" ? d.videoUrl : ""
      setMeta((prev) => ({ ...prev, video_url: videoUrl }))
      setSaveState("saved")
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [questionId])

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
      if (choicesTimer.current) window.clearTimeout(choicesTimer.current)
    }
  }, [])

  const parent = (question?.admin_sections as Record<string, unknown> | undefined) ?? {}
  const sectionType = normalizeSectionType(parent.section_type ?? parent.title)
  const typeOptions = useMemo(() => {
    if (!sectionType) return taxonomy
    const filtered = taxonomy.filter((row) => row.section_type === sectionType)
    return filtered.length > 0 ? filtered : taxonomy
  }, [taxonomy, sectionType])

  function scheduleSave(field: string, value: unknown) {
    setMeta((prev) => ({ ...prev, [field]: value }))
    setSaveState("unsaved")
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      if (!questionId || !adminApi) return
      setSaveState("saving")
      void adminApi
        .updateQuestionMeta(questionId, { [field]: value })
        .then(() => setSaveState("saved"))
        .catch((e) => {
          setError(e instanceof Error ? e.message : "Failed to save")
          setSaveState("unsaved")
        })
    }, 800)
  }

  function scheduleSaveChoices() {
    setSaveState("unsaved")
    if (choicesTimer.current) window.clearTimeout(choicesTimer.current)
    choicesTimer.current = window.setTimeout(() => {
      if (!questionId || !adminApi) return
      setSaveState("saving")
      const choicesPayload = choicesRef.current.map(serializeChoiceRow)
      void adminApi
        .updateQuestionMeta(questionId, { choices: choicesPayload })
        .then(() => setSaveState("saved"))
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Failed to save")
          setSaveState("unsaved")
        })
    }, 800)
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        if (!questionId || !adminApi) return
        if (timer.current) window.clearTimeout(timer.current)
        if (choicesTimer.current) window.clearTimeout(choicesTimer.current)
        timer.current = null
        choicesTimer.current = null
        setSaveState("saving")
        const choicesPayload = choicesRef.current.map(serializeChoiceRow)
        void adminApi
          .updateQuestionMeta(questionId, { ...metaRef.current, choices: choicesPayload })
          .then(() => setSaveState("saved"))
          .catch((err) => {
            setError(err instanceof Error ? err.message : "Failed to save")
            setSaveState("unsaved")
          })
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "ArrowRight" && adjacent.nextId) {
        e.preventDefault()
        navigate(`/admin/preptests/${prepTestId}/sections/${sectionId}/questions/${String(adjacent.nextId)}`)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "ArrowLeft" && adjacent.prevId) {
        e.preventDefault()
        navigate(`/admin/preptests/${prepTestId}/sections/${sectionId}/questions/${String(adjacent.prevId)}`)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [adminApi, adjacent.nextId, adjacent.prevId, navigate, prepTestId, questionId, sectionId])

  const correctAnswer = String(question?.correct_answer ?? "")
  const stimulusHtml = sanitizeAdminHtml(question?.stimulus_text)
  const stemHtml = sanitizeAdminHtml(question?.stem_text)
  const videoUrl = String(meta.video_url ?? "").trim()

  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text2)]">
          {adjacent.prevId ? (
            <Link className="text-[var(--accent)] underline" to={`/admin/preptests/${prepTestId}/sections/${sectionId}/questions/${String(adjacent.prevId)}`}>
              Prev
            </Link>
          ) : (
            <span className="text-[var(--text3)]">Prev</span>
          )}
          <span>
            Q{String(adjacent.current ?? "-")} of {String(adjacent.total ?? "-")}
          </span>
          {adjacent.nextId ? (
            <Link className="text-[var(--accent)] underline" to={`/admin/preptests/${prepTestId}/sections/${sectionId}/questions/${String(adjacent.nextId)}`}>
              Next
            </Link>
          ) : (
            <span className="text-[var(--text3)]">Next</span>
          )}
          {sectionOptions.length > 0 && (
            <select
              className="ml-auto rounded-[6px] border border-[var(--border)] bg-[var(--surface2)] px-2 py-1 text-xs text-[var(--text)]"
              value={String(sectionId ?? "")}
              onChange={(e) => {
                const selected = sectionOptions.find((row) => row.id === e.target.value)
                if (!selected?.firstQuestionId) return
                navigate(`/admin/preptests/${prepTestId}/sections/${selected.id}/questions/${selected.firstQuestionId}`)
              }}
            >
              {sectionOptions.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.displayLabel || row.title || row.sectionType || row.moduleCode || `Section ${row.sectionNumber}`}
                </option>
              ))}
            </select>
          )}
        </div>
        <article className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs text-[var(--text3)]">
            {String((parent.admin_prep_tests as Record<string, unknown> | undefined)?.title ?? "PrepTest")} · Section{" "}
            {String(parent.section_number ?? "-")} · Q{String(question?.question_number ?? "-")} · {String(parent.section_type ?? "")}
          </p>
          <div
            className="mt-3 space-y-2 text-sm leading-7 text-[var(--text2)] [&_p]:mb-2"
            dangerouslySetInnerHTML={{ __html: stimulusHtml }}
          />
          <div
            className="mt-3 border-t border-[var(--border)] pt-3 text-sm font-medium leading-6 text-[var(--text)] [&_p]:mb-2"
            dangerouslySetInnerHTML={{ __html: stemHtml }}
          />
          <ul className="mt-3 space-y-2">
            {choicesModel.map((choice, choiceIdx) => {
              const letter = choice.letter
              const isCorrect = letter === correctAnswer
              const expanded = expandedLetter === letter
              return (
                <li
                  key={letter}
                  className={`overflow-hidden rounded-[6px] border text-sm ${
                    isCorrect ? "border-[#1a4030] bg-[var(--teal-bg)] text-[var(--teal)]" : "border-[var(--border)] text-[var(--text2)]"
                  }`}
                >
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-label={expanded ? "Collapse option explanation" : "Expand option explanation"}
                    className={`flex w-full items-start gap-2 px-3 py-2 text-left ${
                      isCorrect ? "text-[var(--teal)]" : "text-[var(--text2)]"
                    }`}
                    onClick={() => setExpandedLetter((prev) => (prev === letter ? null : letter))}
                  >
                    <span className="shrink-0 font-mono font-semibold">{letter}.</span>
                    <span className="min-w-0 flex-1 [&_p]:mb-2" dangerouslySetInnerHTML={{ __html: choice.content }} />
                    <span className="shrink-0 self-center text-[var(--text3)]" aria-hidden>
                      {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </span>
                  </button>
                  {expanded && (
                    <div
                      className="border-t border-[var(--border)] bg-[var(--surface2)] p-3 text-[var(--text)]"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text3)]">Option explanation</p>
                      <div className="overflow-hidden rounded-[6px] border border-[var(--border)] bg-[var(--surface)] text-sm">
                        <EditorProvider>
                          <Toolbar>
                            <BtnBold />
                            <BtnItalic />
                            <BtnUnderline />
                            <BtnBulletList />
                            <BtnNumberedList />
                          </Toolbar>
                          <Editor
                            value={choice.explanationHtml || "<p></p>"}
                            onChange={(e) => {
                              const html = e.target.value
                              setChoicesModel((prev) => {
                                const next = prev.map((row, i) =>
                                  i === choiceIdx ? { ...row, explanationHtml: html } : row,
                                )
                                return next
                              })
                              scheduleSaveChoices()
                            }}
                            containerProps={{
                              style: {
                                minHeight: 160,
                                background: "transparent",
                              },
                            }}
                          />
                        </EditorProvider>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </article>
      </div>

      <aside className="h-fit space-y-3 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4 lg:sticky lg:top-3">
        <p className="text-sm font-semibold text-[var(--text)]">Question Metadata</p>
        <p className="text-xs text-[var(--text3)]">Status: {saveState}</p>
        {error && <p className="text-xs text-[var(--red)]">{error}</p>}

        <label className="block text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text3)]">Question Type</label>
        <select
          className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface2)] px-2 py-2 text-sm text-[var(--text)]"
          value={String(meta.question_type_id ?? "")}
          onChange={(e) => scheduleSave("question_type_id", e.target.value || null)}
        >
          <option value="">Select type</option>
          {typeOptions.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>

        <label className="block text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text3)]">Difficulty (1-5)</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              className={`rounded-[6px] border px-2 py-1 text-xs ${
                Number(meta.difficulty) === value
                  ? "border-[#2e3a10] bg-[var(--accent-bg)] text-[var(--accent)]"
                  : "border-[var(--border)] bg-[var(--surface2)] text-[var(--text3)]"
              }`}
              onClick={() => scheduleSave("difficulty", value)}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <span className="block text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text3)]">Video explanation</span>
          <p className="text-xs text-[var(--text2)]">
            {videoUrl ? (
              <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-[var(--accent)] underline">
                View video
              </a>
            ) : (
              "No video linked"
            )}
          </p>
          {prepTestId && sectionId && questionId && adminApi ? (
            <button
              type="button"
              className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface2)] px-2 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface)]"
              onClick={() => setVideoModalOpen(true)}
            >
              Add or change video…
            </button>
          ) : null}
        </div>
        {prepTestId && sectionId && questionId && adminApi ? (
          <VideoExplanationModal
            open={videoModalOpen}
            onOpenChange={setVideoModalOpen}
            questionId={questionId}
            prepTestId={prepTestId}
            sectionId={sectionId}
            currentVideoUrl={String(meta.video_url ?? "")}
            adminApi={adminApi}
            onVideoUrlSaved={(url) => {
              setMeta((prev) => ({ ...prev, video_url: url ?? "" }))
              setSaveState("saved")
            }}
          />
        ) : null}

        <label className="block text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text3)]">Explanation</label>
        <div className="overflow-hidden rounded-[6px] border border-[var(--border)] bg-[var(--surface2)] text-sm text-[var(--text)]">
          <EditorProvider>
            <Toolbar>
              <BtnBold />
              <BtnItalic />
              <BtnUnderline />
              <BtnBulletList />
              <BtnNumberedList />
            </Toolbar>
            <Editor
              value={String(meta.explanation ?? "") || "<p></p>"}
              onChange={(e) => scheduleSave("explanation", explanationForSave(e.target.value))}
              containerProps={{
                style: {
                  minHeight: 224,
                  background: "transparent",
                },
              }}
            />
          </EditorProvider>
        </div>
      </aside>
    </section>
  )
}

export { AdminQuestionEditorPage }
