import { useEffect, useMemo, useState } from "react"

import { useAdminApi } from "@/features/admin/use-admin-api"
import { type AdminQuestionType } from "@/lib/api/admin"

type YouTryListRow = {
  id: string
  source_label: string | null
  stem_text: string | null
  difficulty: number | null
  updated_at: string
}

function AdminYouTryPage() {
  const adminApi = useAdminApi()
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([])
  const [lessons, setLessons] = useState<Array<{ id: string; title: string }>>([])
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [selectedLessonId, setSelectedLessonId] = useState("")
  const [rows, setRows] = useState<YouTryListRow[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sectionType, setSectionType] = useState<"LR" | "RC" | "LG">("LR")
  const [questionTypes, setQuestionTypes] = useState<AdminQuestionType[]>([])
  const [questionTypeId, setQuestionTypeId] = useState("")
  const [difficulty, setDifficulty] = useState(3)
  const [sourceLabel, setSourceLabel] = useState("You Try")
  const [stimulusText, setStimulusText] = useState("")
  const [stemText, setStemText] = useState("")
  const [choices, setChoices] = useState(["", "", "", "", ""])
  const [correctAnswer, setCorrectAnswer] = useState("A")
  const [explanation, setExplanation] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [resultId, setResultId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingBuilder, setIsLoadingBuilder] = useState(false)

  const filtered = useMemo(() => questionTypes.filter((row) => row.section_type === sectionType), [questionTypes, sectionType])

  function resetBuilder() {
    setSelectedId(null)
    setSelectedCourseId("")
    setSelectedLessonId("")
    setSectionType("LR")
    setQuestionTypeId("")
    setDifficulty(3)
    setSourceLabel("You Try")
    setStimulusText("")
    setStemText("")
    setChoices(["", "", "", "", ""])
    setCorrectAnswer("A")
    setExplanation("")
    setVideoUrl("")
  }

  async function loadRows() {
    if (!adminApi) return
    const out = (await adminApi.listYouTryQuestions()) as YouTryListRow[]
    setRows(out)
  }

  async function openBuilder(questionId: string) {
    if (!adminApi) return
    setIsLoadingBuilder(true)
    setError(null)
    try {
      const row = (await adminApi.getYouTryQuestion(questionId)) as Record<string, unknown> | null
      if (!row) throw new Error("Question not found")
      setSelectedId(String(row.id))
      const sectionTypeFromTag =
        typeof (row as { question_types?: { section_type?: unknown } | null }).question_types?.section_type === "string"
          ? String((row as { question_types?: { section_type?: unknown } | null }).question_types?.section_type)
          : "LR"
      const sec = sectionTypeFromTag.toUpperCase()
      setSectionType(sec === "RC" || sec === "LG" ? (sec as "RC" | "LG") : "LR")
      setQuestionTypeId(String(row.question_type_id ?? ""))
      setDifficulty(Number(row.difficulty ?? 3))
      setSourceLabel(String(row.source_label ?? "You Try"))
      setStimulusText(String(row.stimulus_text ?? ""))
      setStemText(String(row.stem_text ?? ""))
      const nextChoices = Array.isArray(row.choices) ? row.choices.map(String).slice(0, 5) : []
      while (nextChoices.length < 5) nextChoices.push("")
      setChoices(nextChoices)
      setCorrectAnswer(String(row.correct_answer ?? "A"))
      setExplanation(String(row.explanation ?? ""))
      setVideoUrl(String(row.video_url ?? ""))

      const links = Array.isArray(row.lesson_questions)
        ? (row.lesson_questions as Array<{
            lesson_id?: string
            prep_lessons?: { id?: string; course_id?: string } | null
          }>)
        : []
      const firstLink = links[0]
      const linkedCourseId =
        typeof firstLink?.prep_lessons?.course_id === "string" ? String(firstLink.prep_lessons.course_id) : ""
      const linkedLessonId = typeof firstLink?.lesson_id === "string" ? String(firstLink.lesson_id) : ""
      setSelectedCourseId(linkedCourseId)
      setSelectedLessonId(linkedLessonId)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load You Try question")
    } finally {
      setIsLoadingBuilder(false)
    }
  }

  useEffect(() => {
    if (!adminApi) return
    let alive = true
    Promise.all([adminApi.listQuestionTypes(), adminApi.listYouTryQuestions(), adminApi.listCourses()])
      .then(([types, list, courseRows]) => {
        if (!alive) return
        setQuestionTypes(types)
        setRows((list as YouTryListRow[]) ?? [])
        setCourses(
          (courseRows as Array<{ id: string; title: string }>).map((row) => ({
            id: String(row.id),
            title: String(row.title ?? "Untitled course"),
          })),
        )
      })
      .catch((e) => {
        if (!alive) return
        setError(e instanceof Error ? e.message : "Failed to load You Try data")
      })
    return () => {
      alive = false
    }
  }, [adminApi])

  useEffect(() => {
    let alive = true
    if (!adminApi || !selectedCourseId) {
      setLessons([])
      setSelectedLessonId("")
      return
    }
    void adminApi
      .listLessons(selectedCourseId)
      .then((rows) => {
        if (!alive) return
        const next = (rows as Array<{ id: string; title: string }>).map((row) => ({
          id: String(row.id),
          title: String(row.title ?? "Untitled lesson"),
        }))
        setLessons(next)
        if (!next.some((row) => row.id === selectedLessonId)) {
          setSelectedLessonId("")
        }
      })
      .catch((e) => {
        if (!alive) return
        setLessons([])
        setSelectedLessonId("")
        setError(e instanceof Error ? e.message : "Failed to load lessons")
      })
    return () => {
      alive = false
    }
  }, [adminApi, selectedCourseId, selectedLessonId])

  async function saveBuilder() {
    if (!adminApi) return
    if (selectedCourseId && !selectedLessonId) {
      setError("Select a lesson to link this question to the selected course")
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      const payload = {
        sectionType,
        questionTypeId: questionTypeId || null,
        difficulty,
        sourceLabel,
        stimulusText,
        stemText,
        choices,
        correctAnswer,
        explanation,
        videoUrl: videoUrl || null,
      }
      let questionId = selectedId
      if (selectedId) {
        await adminApi.updateYouTryQuestion(selectedId, payload)
        questionId = selectedId
        setResultId(selectedId)
      } else {
        const row = (await adminApi.createYouTryQuestion(payload)) as { id?: string } | null
        questionId = String(row?.id ?? "")
        setResultId(questionId || "created")
      }
      if (selectedLessonId && questionId) {
        await adminApi.linkQuestionToLesson(selectedLessonId, questionId)
      }
      await loadRows()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save You Try question")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="admin-typo-h1">You Try questions</h1>
          <p className="admin-typo-subtitle mt-1">
            Manage existing platform-written questions or create a new one.
          </p>
        </div>
        <button type="button" className="admin-btn admin-btn-primary" onClick={() => resetBuilder()}>
          + New You Try Question
        </button>
      </div>
      {error && <p className="text-sm text-[var(--red)]">{error}</p>}
      {resultId && <p className="text-sm text-[var(--teal)]">Saved question: {resultId}</p>}

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="admin-surface p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">Existing You Try questions</p>
          <div className="space-y-2">
            {rows.map((row) => (
              <button
                key={row.id}
                type="button"
                className={`w-full rounded-md border px-3 py-2 text-left ${
                  selectedId === row.id
                    ? "border-[var(--accent)] bg-[var(--accent-bg)]"
                    : "border-[var(--border)] bg-[var(--surface2)]"
                }`}
                onClick={() => void openBuilder(row.id)}
              >
                <p className="text-sm font-medium text-[var(--text)]">{row.source_label ?? "You Try"}</p>
                <p className="mt-1 line-clamp-2 text-xs text-[var(--text3)]">{row.stem_text ?? "(No stem yet)"}</p>
                <p className="mt-1 text-[10px] text-[var(--text3)]">Difficulty: {row.difficulty ?? "-"}</p>
              </button>
            ))}
            {rows.length === 0 && <p className="text-xs text-[var(--text3)]">No You Try questions yet.</p>}
          </div>
        </div>

        <div className="admin-surface p-4">
          <div className="mb-3 border-b border-[var(--border)] pb-3 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">
            {selectedId ? "You Try - edit question" : "You Try - new question"}
          </div>
          {isLoadingBuilder ? (
            <p className="text-sm text-[var(--text3)]">Loading question...</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm">
                <div className="admin-label">Link to course (optional)</div>
                <select
                  className="admin-select"
                  value={selectedCourseId}
                  onChange={(e) => {
                    setSelectedCourseId(e.target.value)
                    setSelectedLessonId("")
                  }}
                >
                  <option value="">No course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <div className="admin-label">Link to lesson (required for course link)</div>
                <select
                  className="admin-select"
                  value={selectedLessonId}
                  onChange={(e) => setSelectedLessonId(e.target.value)}
                  disabled={!selectedCourseId}
                >
                  <option value="">{selectedCourseId ? "Select lesson" : "Select a course first"}</option>
                  {lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <div className="admin-label">Section type</div>
                <select className="admin-select" value={sectionType} onChange={(e) => setSectionType(e.target.value as "LR" | "RC" | "LG")}>
                  <option value="LR">LR</option>
                  <option value="RC">RC</option>
                  <option value="LG">LG</option>
                </select>
              </label>
              <label className="text-sm">
                <div className="admin-label">Question type tag</div>
                <select className="admin-select" value={questionTypeId} onChange={(e) => setQuestionTypeId(e.target.value)}>
                  <option value="">Select type</option>
                  {filtered.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <div className="admin-label">Difficulty</div>
                <input className="admin-input" type="number" min={1} max={5} value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))} />
              </label>
              <label className="text-sm">
                <div className="admin-label">Source label shown to student</div>
                <input className="admin-input" value={sourceLabel} onChange={(e) => setSourceLabel(e.target.value)} />
              </label>
              <label className="text-sm md:col-span-2">
                <div className="admin-label">Stimulus text</div>
                <textarea className="admin-textarea h-28" value={stimulusText} onChange={(e) => setStimulusText(e.target.value)} />
              </label>
              <label className="text-sm md:col-span-2">
                <div className="admin-label">Question stem</div>
                <input className="admin-input" value={stemText} onChange={(e) => setStemText(e.target.value)} />
              </label>
              <div className="md:col-span-2">
                <div className="admin-label">Answer choices - click Correct on right letter</div>
              </div>
              {choices.map((choice, idx) => {
                const letter = String.fromCharCode(65 + idx)
                return (
                  <label key={letter} className="text-sm">
                    <div className="admin-label">Choice {letter}</div>
                    <div className="mt-1 flex gap-2">
                      <input
                        className={`admin-input ${correctAnswer === letter ? "border-[var(--teal)] bg-[var(--teal-bg)]" : ""}`}
                        value={choice}
                        onChange={(e) =>
                          setChoices((prev) => {
                            const next = [...prev]
                            next[idx] = e.target.value
                            return next
                          })
                        }
                      />
                      <button
                        type="button"
                        className={`rounded px-2 text-xs ${
                          correctAnswer === letter
                            ? "border border-[var(--teal)] bg-[var(--teal-bg)] text-[var(--teal)]"
                            : "border border-[var(--border2)] bg-[var(--surface2)] text-[var(--text3)]"
                        }`}
                        onClick={() => setCorrectAnswer(letter)}
                      >
                        Correct
                      </button>
                    </div>
                  </label>
                )
              })}
              <label className="text-sm md:col-span-2">
                <div className="admin-label">Explanation</div>
                <textarea className="admin-textarea" value={explanation} onChange={(e) => setExplanation(e.target.value)} />
              </label>
              <label className="text-sm md:col-span-2">
                <div className="admin-label">Video URL</div>
                <input className="admin-input" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
              </label>
              <div className="md:col-span-2 mt-2 flex justify-end gap-2 border-t border-[var(--border)] pt-3">
                <button type="button" className="admin-btn admin-btn-ghost" onClick={() => resetBuilder()}>
                  Reset
                </button>
                <button type="button" className="admin-btn admin-btn-primary" onClick={() => void saveBuilder()} disabled={isSaving}>
                  {isSaving ? "Saving..." : selectedId ? "Save changes" : "Create question"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export { AdminYouTryPage }
