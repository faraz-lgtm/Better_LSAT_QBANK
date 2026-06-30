import { useEffect, useMemo, useState } from "react"
import { Eye } from "lucide-react"

import { AdminCurriculumTree } from "@/features/admin/components/course-builder/admin-curriculum-tree"
import { AdminLessonQuickAdd } from "@/features/admin/components/course-builder/admin-lesson-quick-add"
import { CurriculumMetaEditor } from "@/features/admin/components/course-builder/curriculum-meta-editor"
import { AdminLessonStatusDropdown } from "@/features/admin/components/admin-lesson-status-dropdown"
import { AdminTipTapEditor } from "@/features/admin/components/admin-tip-tap-editor"
import { LessonQuestionPreviewModal } from "@/features/admin/components/lesson-question-preview-modal"
import {
  flattenLessonsFromCurriculum,
  formatMinutesAsDuration,
  parseDurationInputToMinutes,
  type BuilderSelection,
} from "@/features/admin/lib/course-builder-utils"
import { formatSectionOptionLabel } from "@/features/admin/lib/admin-section-display"
import { normalizeLessonStatus, type PrepLessonStatus } from "@/features/admin/lib/prep-lesson-status"
import { useAdminApi } from "@/features/admin/use-admin-api"
import type {
  AdminBulkImportDryRunResult,
  PrepCourseCurriculum,
} from "@/lib/api/admin"
import {
  filterStudentVisiblePrepTestRows,
  sortPrepTestsByNumberAsc,
} from "@/lib/prep-test-visibility"
import {
  isRepWorkJson,
  parseRepWorkFromTextContent,
  serializeRepWorkContent,
  type RepWorkPair,
} from "@/lib/rep-work-content"

type CourseRow = {
  id: string
  slug: string
  title: string
  description: string | null
  is_published: boolean
}

type LessonRow = {
  id: string
  course_id: string
  section_id: string
  slug: string
  title: string
  summary: string | null
  video_url: string | null
  text_content: string | null
  duration_minutes: number | null
  lesson_type: PrepLessonStatus
  is_published: boolean
}

type PrepTestOption = {
  id: string
  module_id: string
  title: string
}

type PrepTestSection = {
  id: string
  section_number: number | null
  section_id: string | null
  section_type?: string | null
  title?: string | null
  admin_questions?: Array<{
    id: string
    question_number: number | null
  }>
}

type LessonQuestionRow = {
  id: string
  sort_order: number
  admin_questions?: {
    id: string
    question_number: number | null
    admin_sections?: {
      section_number: number | null
      section_type?: string | null
      title?: string | null
      admin_prep_tests?: {
        module_id?: string | null
        title?: string | null
      } | null
    } | null
  } | null
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== "string") {
        reject(new Error("Failed to read file"))
        return
      }
      const base64 = result.includes(",") ? result.split(",")[1] ?? "" : result
      resolve(base64)
    }
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}

const LESSON_TYPE_EDIT_LABEL: Record<PrepLessonStatus, string> = {
  video_text: "VIDEO + TEXT",
  active_drill: "ACTIVE DRILL",
  adaptive_drill: "ADAPTIVE DRILL",
  rep_work: "REP WORK",
}

function AdminRichBlock({
  label,
  labelClassName = "text-sm font-normal leading-6 tracking-[0.02em] text-[#1a1b25]",
  value,
  onChange,
  minHeight = 140,
}: {
  label: string
  labelClassName?: string
  value: string
  onChange: (html: string) => void
  minHeight?: number
}) {
  return (
    <div className="flex flex-col gap-4 rounded-[10px] border border-[#dfe1e7] bg-white p-4">
      <p className={labelClassName}>{label}</p>
      <AdminTipTapEditor value={value || "<p></p>"} onChange={onChange} minHeight={minHeight} />
    </div>
  )
}

type LessonFormState = {
  title: string
  slug: string
  videoUrl: string
  textContent: string
  durationMinutes: string
  lessonType: PrepLessonStatus
  repWorkInstructions: string
  repWorkPairs: RepWorkPair[]
}

function AdminCoursesPage() {
  const adminApi = useAdminApi()
  const [courses, setCourses] = useState<CourseRow[]>([])
  const [mode, setMode] = useState<"list" | "create" | "builder" | "bulk">("list")
  const [isSavingCourse, setIsSavingCourse] = useState(false)
  const [isSavingLesson, setIsSavingLesson] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null)
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [curriculum, setCurriculum] = useState<PrepCourseCurriculum>({ modules: [] })
  const [lessons, setLessons] = useState<LessonRow[]>([])
  const [builderSelection, setBuilderSelection] = useState<BuilderSelection | null>(null)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [moduleForm, setModuleForm] = useState({ title: "", durationInput: "" })
  const [sectionForm, setSectionForm] = useState({ title: "", durationInput: "" })
  const [isSavingModule, setIsSavingModule] = useState(false)
  const [isSavingSection, setIsSavingSection] = useState(false)
  const [selectedLessonId, setSelectedLessonId] = useState("")
  const [prepTestOptions, setPrepTestOptions] = useState<PrepTestOption[]>([])
  const [selectedPrepTestId, setSelectedPrepTestId] = useState("")
  const [sectionOptions, setSectionOptions] = useState<PrepTestSection[]>([])
  const [selectedSectionId, setSelectedSectionId] = useState("")
  const [questionOptions, setQuestionOptions] = useState<Array<{ id: string; question_number: number | null }>>([])
  const [selectedQuestionRef, setSelectedQuestionRef] = useState("")
  const [linkedQuestions, setLinkedQuestions] = useState<LessonQuestionRow[]>([])
  const [previewQuestionId, setPreviewQuestionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [bulkFile, setBulkFile] = useState<File | null>(null)
  const [bulkPreview, setBulkPreview] = useState<AdminBulkImportDryRunResult | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [bulkCommitting, setBulkCommitting] = useState(false)
  const [bulkError, setBulkError] = useState<string | null>(null)
  const [bulkInsertOnly, setBulkInsertOnly] = useState(true)
  const [courseForm, setCourseForm] = useState({
    title: "",
    slug: "",
    description: "",
    estimatedDuration: "",
  })
  const [lessonForm, setLessonForm] = useState<LessonFormState>({
    title: "",
    slug: "",
    videoUrl: "",
    textContent: "",
    durationMinutes: "",
    lessonType: "video_text",
    repWorkInstructions: "<p></p>",
    repWorkPairs: [{ question: "<p></p>", answer: "<p></p>" }],
  })

  useEffect(() => {
    let alive = true
    async function loadPrepTests() {
      if (!adminApi) return
      try {
        const fetched = await adminApi.listAllPrepTests()
        if (!alive) return
        const rows = sortPrepTestsByNumberAsc(
          filterStudentVisiblePrepTestRows(fetched as Array<Record<string, unknown>>),
        )
        setPrepTestOptions(
          rows.map((row) => ({
            id: String(row.id),
            module_id: String(row.module_id ?? ""),
            title: String(row.title ?? row.module_id ?? ""),
          })),
        )
      } catch {
        if (!alive) return
        setPrepTestOptions([])
      }
    }
    void loadPrepTests()
    return () => {
      alive = false
    }
  }, [adminApi])

  useEffect(() => {
    let alive = true
    async function loadCourses() {
      if (!adminApi) return
      try {
        if (alive) setIsLoading(true)
        const rows = (await adminApi.listCourses()) as CourseRow[]
        if (!alive) return
        setCourses(rows)
        if (!selectedCourseId && rows[0]) setSelectedCourseId(String(rows[0].id))
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load courses")
      } finally {
        if (alive) setIsLoading(false)
      }
    }
    void loadCourses()
    return () => {
      alive = false
    }
  }, [adminApi, selectedCourseId])

  useEffect(() => {
    let alive = true
    async function loadCurriculum() {
      if (!adminApi || !selectedCourseId || mode !== "builder") return
      try {
        const tree = await adminApi.listCurriculum(selectedCourseId)
        if (!alive) return
        setCurriculum(tree)
        const flat = flattenLessonsFromCurriculum(tree) as LessonRow[]
        setLessons(flat)
        if (flat[0] && !builderSelection) {
          setBuilderSelection({ kind: "lesson", id: flat[0].id })
          setSelectedLessonId(flat[0].id)
        }
        if (tree.modules[0]) {
          setExpandedModules((prev) => new Set([...prev, tree.modules[0].id]))
          const firstSection = tree.modules[0].sections[0]
          if (firstSection) {
            setExpandedSections((prev) => new Set([...prev, firstSection.id]))
          }
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load curriculum")
      }
    }
    void loadCurriculum()
    return () => {
      alive = false
    }
  }, [adminApi, selectedCourseId, mode])

  useEffect(() => {
    if (!builderSelection) return
    if (builderSelection.kind === "lesson") {
      setSelectedLessonId(builderSelection.id)
      return
    }
    setSelectedLessonId("")
    if (builderSelection.kind === "module") {
      const mod = curriculum.modules.find((m) => m.id === builderSelection.id)
      if (mod) {
        setModuleForm({
          title: mod.title,
          durationInput: formatMinutesAsDuration(mod.duration_minutes),
        })
      }
    }
    if (builderSelection.kind === "section") {
      for (const mod of curriculum.modules) {
        const sec = mod.sections.find((s) => s.id === builderSelection.id)
        if (sec) {
          setSectionForm({
            title: sec.title,
            durationInput: formatMinutesAsDuration(sec.duration_minutes),
          })
          break
        }
      }
    }
  }, [builderSelection, curriculum])

  const selectedCourse = useMemo(
    () => courses.find((course) => String(course.id) === selectedCourseId) ?? null,
    [courses, selectedCourseId],
  )
  const selectedLesson = useMemo(
    () => lessons.find((lesson) => String(lesson.id) === selectedLessonId) ?? null,
    [lessons, selectedLessonId],
  )

  const linkedQuestionCap = useMemo(() => {
    if (lessonForm.lessonType === "adaptive_drill") return 5
    if (lessonForm.lessonType === "active_drill") return 1
    return 0
  }, [lessonForm.lessonType])
  const showQuestionLinking = linkedQuestionCap > 0
  const canLinkMore = linkedQuestions.length < linkedQuestionCap

  useEffect(() => {
    if (!selectedLesson) return
    const lessonType = normalizeLessonStatus(selectedLesson.lesson_type)
    const base: LessonFormState = {
      title: selectedLesson.title ?? "",
      slug: selectedLesson.slug ?? "",
      videoUrl: selectedLesson.video_url ?? "",
      textContent: selectedLesson.text_content ?? "",
      durationMinutes: selectedLesson.duration_minutes != null ? String(selectedLesson.duration_minutes) : "",
      lessonType,
      repWorkInstructions: "<p></p>",
      repWorkPairs: [{ question: "<p></p>", answer: "<p></p>" }],
    }
    if (lessonType === "rep_work") {
      const parsed = parseRepWorkFromTextContent(selectedLesson.text_content)
      base.repWorkInstructions = parsed.instructions
      base.repWorkPairs = parsed.pairs
    }
    // Editor state is intentionally reset when the selected lesson row changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync local form to server row
    setLessonForm(base)
  }, [selectedLesson])

  useEffect(() => {
    let alive = true
    async function loadLinkedQuestions() {
      if (!adminApi || !selectedLessonId) {
        if (alive) setLinkedQuestions([])
        return
      }
      try {
        const rows = (await adminApi.listLessonQuestions(selectedLessonId)) as LessonQuestionRow[]
        if (!alive) return
        setLinkedQuestions(rows)
      } catch {
        if (!alive) return
        setLinkedQuestions([])
      }
    }
    void loadLinkedQuestions()
    return () => {
      alive = false
    }
  }, [adminApi, selectedLessonId])

  async function reloadCoursesAndSelect(courseId?: string) {
    if (!adminApi) return
    const rows = (await adminApi.listCourses()) as CourseRow[]
    setCourses(rows)
    if (courseId) {
      setSelectedCourseId(courseId)
      return
    }
    const fallback = rows[0]?.id ?? ""
    setSelectedCourseId(fallback)
  }

  async function reloadCurriculum(select?: BuilderSelection) {
    if (!adminApi || !selectedCourseId) return
    const tree = await adminApi.listCurriculum(selectedCourseId)
    setCurriculum(tree)
    const flat = flattenLessonsFromCurriculum(tree) as LessonRow[]
    setLessons(flat)
    if (select) {
      setBuilderSelection(select)
      if (select.kind === "lesson") setSelectedLessonId(select.id)
    }
    return tree
  }

  async function createCourse() {
    if (!adminApi) return
    if (!courseForm.title.trim()) {
      setError("Course title is required")
      return
    }
    const slug = courseForm.slug.trim() || slugify(courseForm.title)
    setIsSavingCourse(true)
    setError(null)
    try {
      const row = (await adminApi.createCourse({
        title: courseForm.title.trim(),
        slug,
        description: courseForm.description.trim(),
      })) as CourseRow | undefined
      if (!row) throw new Error("Course was not created")
      await reloadCoursesAndSelect(row.id)
      setCourseForm({ title: "", slug: "", description: "", estimatedDuration: "" })
      setMode("builder")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create course")
    } finally {
      setIsSavingCourse(false)
    }
  }

  async function updateCourse(courseId: string, patch: Record<string, unknown>) {
    if (!adminApi) return
    setError(null)
    try {
      await adminApi.updateCourse(courseId, patch)
      await reloadCoursesAndSelect(courseId)
      setEditingCourseId(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update course")
    }
  }

  async function deleteCourse(courseId: string) {
    if (!adminApi) return
    const confirmed = window.confirm("Delete this course and all lessons?")
    if (!confirmed) return
    setError(null)
    try {
      await adminApi.deleteCourse(courseId)
      await reloadCoursesAndSelect()
      if (selectedCourseId === courseId) setMode("list")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete course")
    }
  }

  async function addModule() {
    if (!adminApi || !selectedCourseId) return
    setError(null)
    try {
      const count = curriculum.modules.length
      const row = await adminApi.createModule({
        courseId: selectedCourseId,
        title: `Module ${count + 1}`,
      })
      if (!row) throw new Error("Module was not created")
      await reloadCurriculum({ kind: "module", id: row.id })
      setExpandedModules((prev) => new Set([...prev, row.id]))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create module")
    }
  }

  async function addSection(moduleId: string) {
    if (!adminApi) return
    setError(null)
    try {
      const mod = curriculum.modules.find((m) => m.id === moduleId)
      const count = mod?.sections.length ?? 0
      const row = await adminApi.createSection({
        moduleId,
        title: `Section ${count + 1}`,
      })
      if (!row) throw new Error("Section was not created")
      await reloadCurriculum({ kind: "section", id: row.id })
      setExpandedSections((prev) => new Set([...prev, row.id]))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create section")
    }
  }

  async function addLesson(sectionId: string) {
    if (!adminApi || !selectedCourseId) return
    let lessonCount = 0
    for (const mod of curriculum.modules) {
      for (const sec of mod.sections) {
        if (sec.id === sectionId) lessonCount = sec.lessons.length
      }
    }
    const baseTitle = `Lesson ${lessonCount + 1}`
    const baseSlug = `${selectedCourse?.slug ?? "course"}-lesson-${lessons.length + 1}`
    setError(null)
    try {
      const row = (await adminApi.createLesson({
        courseId: selectedCourseId,
        sectionId,
        title: baseTitle,
        slug: baseSlug,
        summary: "",
        videoUrl: "",
        textContent: "<p>Draft lesson content</p>",
        durationMinutes: undefined,
        lessonType: "video_text",
      })) as LessonRow | undefined
      if (!row) throw new Error("Lesson was not created")
      await reloadCurriculum({ kind: "lesson", id: row.id })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create lesson")
    }
  }

  async function saveModule() {
    if (!adminApi || builderSelection?.kind !== "module") return
    setIsSavingModule(true)
    setError(null)
    try {
      await adminApi.updateModule(builderSelection.id, {
        title: moduleForm.title.trim(),
        durationMinutes: parseDurationInputToMinutes(moduleForm.durationInput),
      })
      await reloadCurriculum(builderSelection)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save module")
    } finally {
      setIsSavingModule(false)
    }
  }

  async function deleteModule(moduleId: string) {
    if (!adminApi) return
    if (!window.confirm("Delete this module and all its sections and lessons?")) return
    setError(null)
    try {
      await adminApi.deleteModule(moduleId)
      setBuilderSelection(null)
      await reloadCurriculum()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete module")
    }
  }

  async function saveSection() {
    if (!adminApi || builderSelection?.kind !== "section") return
    setIsSavingSection(true)
    setError(null)
    try {
      await adminApi.updateSection(builderSelection.id, {
        title: sectionForm.title.trim(),
        durationMinutes: parseDurationInputToMinutes(sectionForm.durationInput),
      })
      await reloadCurriculum(builderSelection)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save section")
    } finally {
      setIsSavingSection(false)
    }
  }

  async function deleteSection(sectionId: string) {
    if (!adminApi) return
    if (!window.confirm("Delete this section and all its lessons?")) return
    setError(null)
    try {
      await adminApi.deleteSection(sectionId)
      setBuilderSelection(null)
      await reloadCurriculum()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete section")
    }
  }

  async function saveLesson(options?: { publish?: boolean }) {
    if (!adminApi || !selectedLessonId) return
    if (!lessonForm.title.trim()) {
      setError("Lesson title is required")
      return
    }
    setIsSavingLesson(true)
    setError(null)
    try {
      const textContent =
        lessonForm.lessonType === "rep_work"
          ? serializeRepWorkContent(lessonForm.repWorkInstructions, lessonForm.repWorkPairs)
          : lessonForm.textContent.trim() || "<p></p>"
      const payload: Record<string, unknown> = {
        title: lessonForm.title.trim(),
        slug: lessonForm.slug.trim() || slugify(lessonForm.title),
        videoUrl: lessonForm.videoUrl.trim() || null,
        textContent,
        lessonType: lessonForm.lessonType,
        durationMinutes: parseDurationInputToMinutes(lessonForm.durationMinutes),
      }
      if (options?.publish === true) payload.isPublished = true
      if (options?.publish === false) payload.isPublished = false
      await adminApi.updateLesson(selectedLessonId, payload)
      await reloadCurriculum({ kind: "lesson", id: selectedLessonId })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update lesson")
    } finally {
      setIsSavingLesson(false)
    }
  }

  async function loadPrepTestSections(prepTestId: string) {
    if (!adminApi || !prepTestId) return
    setSelectedSectionId("")
    setQuestionOptions([])
    setSelectedQuestionRef("")
    try {
      const detail = (await adminApi.getPrepTestDetail(prepTestId)) as {
        prepTest?: { admin_sections?: unknown[] }
      }
      const sections = (detail.prepTest?.admin_sections ?? []) as PrepTestSection[]
      setSectionOptions(sections)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load prep test sections")
    }
  }

  function onSelectSection(sectionId: string) {
    setSelectedSectionId(sectionId)
    const section = sectionOptions.find((item) => String(item.id) === sectionId)
    const questions = (section?.admin_questions ?? []) as Array<{ id: string; question_number: number | null }>
    setQuestionOptions(questions)
    setSelectedQuestionRef("")
  }

  async function deleteLesson(lessonId: string) {
    if (!adminApi || !selectedCourseId) return
    const confirmed = window.confirm("Delete this lesson?")
    if (!confirmed) return
    setError(null)
    try {
      await adminApi.deleteLesson(lessonId)
      const tree = await reloadCurriculum()
      const flat = tree ? (flattenLessonsFromCurriculum(tree) as LessonRow[]) : []
      const nextId = flat[0]?.id ?? ""
      setBuilderSelection(nextId ? { kind: "lesson", id: nextId } : null)
      setSelectedLessonId(nextId)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete lesson")
    }
  }

  async function runBulkDryRun() {
    if (!adminApi) return
    if (!bulkFile) {
      setBulkError("Upload a DOCX file before dry-run.")
      return
    }
    if (!bulkFile.name.toLowerCase().endsWith(".docx")) {
      setBulkError("Only .docx files are supported.")
      return
    }
    setBulkBusy(true)
    setBulkError(null)
    setBulkPreview(null)
    try {
      const fileBytesBase64 = await fileToBase64(bulkFile)
      const result = await adminApi.bulkImportDryRun({
        fileName: bulkFile.name,
        fileBytesBase64,
        insertOnly: bulkInsertOnly,
      })
      setBulkPreview(result)
    } catch (e) {
      setBulkError(e instanceof Error ? e.message : "Dry-run failed")
    } finally {
      setBulkBusy(false)
    }
  }

  async function commitBulkImport() {
    if (!adminApi || !bulkPreview) return
    if (bulkPreview.counts.invalidCount > 0) {
      setBulkError("Resolve invalid rows in dry-run before committing.")
      return
    }
    if (bulkInsertOnly && bulkPreview.counts.updateCount > 0) {
      setBulkError("Insert-only import cannot commit rows that would update existing lessons.")
      return
    }
    setBulkCommitting(true)
    setBulkError(null)
    try {
      const result = await adminApi.bulkImportCommit({
        importToken: bulkPreview.importToken,
      })
      await reloadCoursesAndSelect(String(result.courseId))
      const tree = await adminApi.listCurriculum(String(result.courseId))
      setCurriculum(tree)
      setLessons(flattenLessonsFromCurriculum(tree) as LessonRow[])
      setBulkPreview(null)
      setBulkFile(null)
      window.alert(
        `Bulk import completed.\nInserted: ${result.counts.inserted}\nUpdated: ${result.counts.updated}\nTotal lessons now: ${result.counts.finalLessonCount}`,
      )
    } catch (e) {
      setBulkError(e instanceof Error ? e.message : "Bulk import commit failed")
    } finally {
      setBulkCommitting(false)
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="admin-typo-h1">
            {mode === "create"
              ? "Create New Course"
              : mode === "builder"
                ? "Course Builder"
                : mode === "bulk"
                  ? "Bulk Import"
                  : "Courses"}
          </h1>
          <p className="admin-typo-subtitle mt-1">
            {mode === "create"
              ? "Set up the basic details for your new course before building the curriculum."
              : mode === "bulk"
                ? "Upload DOCX, run pre-vetting dry-run, then commit import."
              : "Build structured learning paths from lessons and PrepTest questions"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {mode !== "create" && mode !== "bulk" && (
            <button
              type="button"
              className="admin-btn admin-btn-ghost"
              onClick={() => {
                setMode("bulk")
                setBulkError(null)
              }}
            >
              Bulk import
            </button>
          )}
          {mode !== "create" && (
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={() => {
                setMode("create")
                setEditingCourseId(null)
                setCourseForm({ title: "", slug: "", description: "", estimatedDuration: "" })
              }}
            >
              + New course
            </button>
          )}
        </div>
      </div>
      {error && <p className="text-sm text-[var(--red)]">{error}</p>}
      {mode === "bulk" && (
        <div className="table-wrap">
          <div className="table-header">
            <div className="table-title">Bulk Import (DOCX)</div>
          </div>
          <div className="space-y-4 p-4">
            {bulkError ? <p className="text-sm text-[var(--red)]">{bulkError}</p> : null}
            <div className="grid gap-3 md:grid-cols-1">
              <div className="md:col-span-1">
                <label className="admin-label">DOCX syllabus file</label>
                <input
                  type="file"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="admin-input mt-1"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null
                    setBulkFile(file)
                    setBulkPreview(null)
                    setBulkError(null)
                  }}
                />
                <p className="mt-1 text-xs text-[var(--text3)]">{bulkFile ? `Selected: ${bulkFile.name}` : "No file selected"}</p>
              </div>
              <label className="flex items-center gap-2 text-sm text-[var(--text2)]">
                <input
                  type="checkbox"
                  checked={bulkInsertOnly}
                  onChange={(e) => {
                    setBulkInsertOnly(e.target.checked)
                    setBulkPreview(null)
                    setBulkError(null)
                  }}
                />
                Insert new lessons only (skip existing slugs, append sort order)
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="admin-btn admin-btn-primary" disabled={bulkBusy} onClick={() => void runBulkDryRun()}>
                {bulkBusy ? "Running dry-run..." : "Run dry-run preview"}
              </button>
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setMode("list")}>
                Back
              </button>
            </div>

            {bulkPreview ? (
              <div className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--surface2)] p-3">
                <div className="grid gap-2 text-xs sm:grid-cols-6">
                  <div><span className="font-semibold">Rows:</span> {bulkPreview.counts.totalRows}</div>
                  <div><span className="font-semibold">Valid:</span> {bulkPreview.counts.validCount}</div>
                  <div><span className="font-semibold">Insert:</span> {bulkPreview.counts.insertCount}</div>
                  <div><span className="font-semibold">Update:</span> {bulkPreview.counts.updateCount}</div>
                  <div><span className="font-semibold">Skipped:</span> {bulkPreview.counts.skippedCount ?? 0}</div>
                  <div><span className="font-semibold">Invalid:</span> {bulkPreview.counts.invalidCount}</div>
                </div>
                <div className="max-h-[50vh] overflow-auto rounded border border-[var(--border)] bg-white">
                  <table className="w-full min-w-[980px] text-xs">
                    <thead className="sticky top-0 bg-[#f6f8fa]">
                      <tr className="border-b border-[var(--border)]">
                        <th className="px-2 py-2 text-left">Status</th>
                        <th className="px-2 py-2 text-left">Sort</th>
                        <th className="px-2 py-2 text-left">Slug</th>
                        <th className="px-2 py-2 text-left">Title</th>
                        <th className="px-2 py-2 text-left">Type</th>
                        <th className="px-2 py-2 text-left">Summary</th>
                        <th className="px-2 py-2 text-left">Duration</th>
                        <th className="px-2 py-2 text-left">Published</th>
                        <th className="px-2 py-2 text-left">Errors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkPreview.rows.map((row, idx) => (
                        <tr key={`${row.lesson_slug}-${idx}`} className="border-b border-[var(--border)]">
                          <td className="px-2 py-2">
                            <span className={row.status === "invalid" ? "text-[var(--red)]" : row.status === "skipped" ? "text-[var(--text3)]" : row.status === "insert" ? "text-[#206d5b]" : "text-[#1f4c9a]"}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-2 py-2">{row.sort_order}</td>
                          <td className="px-2 py-2">{row.lesson_slug}</td>
                          <td className="px-2 py-2">{row.lesson_title}</td>
                          <td className="px-2 py-2">{row.lesson_type}</td>
                          <td className="max-w-[260px] truncate px-2 py-2" title={row.summary ?? ""}>{row.summary ?? "-"}</td>
                          <td className="px-2 py-2">{row.duration_minutes ?? "-"}</td>
                          <td className="px-2 py-2">{row.lesson_is_published ? "true" : "false"}</td>
                          <td className="max-w-[300px] px-2 py-2 text-[var(--red)]">{row.errors.join("; ") || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[var(--text3)]">Token expires at: {new Date(bulkPreview.expiresAt).toLocaleString()}</p>
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    disabled={bulkCommitting || bulkPreview.counts.invalidCount > 0}
                    onClick={() => void commitBulkImport()}
                  >
                    {bulkCommitting ? "Importing..." : "Commit import"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
      {mode === "list" && (
        <div className="table-wrap">
          <div className="table-header">
            <div className="table-title">All Courses</div>
          </div>
          <div className="p-4 space-y-3">
            {isLoading && <p className="text-xs text-[var(--text3)]">Loading courses...</p>}
            {!isLoading && courses.length === 0 && (
              <p className="text-sm text-[var(--text3)]">No courses yet. Create your first course.</p>
            )}
            {courses.map((course) => (
              <div key={course.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface2)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text)]">{course.title}</p>
                    <p className="text-xs text-[var(--text3)] mt-1">/{course.slug}</p>
                    {course.description && (
                      <p className="text-xs text-[var(--text2)] mt-2">{course.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="admin-btn admin-btn-ghost"
                      onClick={() => {
                        setEditingCourseId(course.id)
                        setCourseForm({
                          title: course.title,
                          slug: course.slug,
                          description: course.description ?? "",
                          estimatedDuration: "",
                        })
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-ghost"
                      onClick={() => void deleteCourse(course.id)}
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-primary"
                      onClick={() => {
                        setSelectedCourseId(course.id)
                        setMode("builder")
                      }}
                    >
                      Open Builder
                    </button>
                  </div>
                </div>
                {editingCourseId === course.id && (
                  <div className="grid gap-2 md:grid-cols-3 mt-4">
                    <input
                      className="admin-input"
                      value={courseForm.title}
                      onChange={(e) =>
                        setCourseForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                          slug: prev.slug || slugify(e.target.value),
                        }))
                      }
                      placeholder="Course title"
                    />
                    <input
                      className="admin-input"
                      value={courseForm.slug}
                      onChange={(e) => setCourseForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
                      placeholder="course-slug"
                    />
                    <input
                      className="admin-input"
                      value={courseForm.description}
                      onChange={(e) => setCourseForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Short description"
                    />
                    <div className="md:col-span-3 flex justify-end gap-2">
                      <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setEditingCourseId(null)}>
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn-primary"
                        onClick={() =>
                          void updateCourse(course.id, {
                            title: courseForm.title,
                            slug: courseForm.slug,
                            description: courseForm.description,
                          })
                        }
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === "create" && (
        <div className="table-wrap">
          <div className="table-header">
            <div className="table-title">Create New Course</div>
          </div>
          <div className="p-6 max-w-3xl space-y-5">
            <div>
              <label className="admin-label">Course Title</label>
              <input
                className="admin-input"
                placeholder="e.g., Advanced React Patterns"
                value={courseForm.title}
                onChange={(e) =>
                  setCourseForm((prev) => ({
                    ...prev,
                    title: e.target.value,
                    slug: prev.slug || slugify(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <label className="admin-label">Slug</label>
              <input
                className="admin-input"
                placeholder="advanced-react-patterns"
                value={courseForm.slug}
                onChange={(e) =>
                  setCourseForm((prev) => ({
                    ...prev,
                    slug: slugify(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <label className="admin-label">Short Description</label>
              <textarea
                className="admin-textarea"
                placeholder="Briefly describe what students will learn..."
                value={courseForm.description}
                onChange={(e) => setCourseForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div>
              <label className="admin-label">Estimated Duration</label>
              <input
                className="admin-input max-w-xs"
                placeholder="e.g., 4h 30m"
                value={courseForm.estimatedDuration}
                onChange={(e) => setCourseForm((prev) => ({ ...prev, estimatedDuration: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setMode("list")}>
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                disabled={isSavingCourse}
                onClick={() => void createCourse()}
              >
                {isSavingCourse ? "Creating..." : "Continue to Curriculum →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === "builder" && selectedCourse && (
        <div className="flex min-h-[min(720px,85vh)] flex-col overflow-hidden rounded-xl border border-[#dfe1e7] bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] lg:flex-row">
          <div className="lesson-list flex max-h-[40vh] w-full flex-col overflow-y-auto border-b border-[#dfe1e7] lg:max-h-none lg:w-[min(300px,34vw)] lg:shrink-0 lg:border-b-0 lg:border-r lg:border-[#dfe1e7]">
            <div className="lesson-head">
              <div>
                <p className="lesson-title">Curriculum</p>
                <p className="text-[10px] text-[var(--text3)] mt-1">{selectedCourse.title}</p>
              </div>
              <button
                type="button"
                className="admin-btn admin-btn-ghost !px-2 !py-1"
                onClick={() => setMode("list")}
              >
                Back
              </button>
            </div>
            <AdminCurriculumTree
              curriculum={curriculum}
              selection={builderSelection}
              expandedModules={expandedModules}
              expandedSections={expandedSections}
              onToggleModule={(moduleId) =>
                setExpandedModules((prev) => {
                  const next = new Set(prev)
                  if (next.has(moduleId)) next.delete(moduleId)
                  else next.add(moduleId)
                  return next
                })
              }
              onToggleSection={(sectionId) =>
                setExpandedSections((prev) => {
                  const next = new Set(prev)
                  if (next.has(sectionId)) next.delete(sectionId)
                  else next.add(sectionId)
                  return next
                })
              }
              onSelect={setBuilderSelection}
              onAddModule={() => void addModule()}
              onAddSection={(moduleId) => void addSection(moduleId)}
              onAddLesson={(sectionId) => void addLesson(sectionId)}
            />
          </div>
          <div className="flex min-h-0 min-w-0 flex-1">
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
              {builderSelection?.kind === "module" ? (
                <CurriculumMetaEditor
                  badge="Editing module"
                  titleLabel="Module Title"
                  title={moduleForm.title}
                  durationInput={moduleForm.durationInput}
                  isSaving={isSavingModule}
                  onTitleChange={(title) => setModuleForm((p) => ({ ...p, title }))}
                  onDurationChange={(durationInput) => setModuleForm((p) => ({ ...p, durationInput }))}
                  onSave={() => void saveModule()}
                  onDelete={() => void deleteModule(builderSelection.id)}
                  deleteLabel="Delete module"
                />
              ) : builderSelection?.kind === "section" ? (
                <CurriculumMetaEditor
                  badge="Editing section"
                  titleLabel="Section Title"
                  title={sectionForm.title}
                  durationInput={sectionForm.durationInput}
                  isSaving={isSavingSection}
                  onTitleChange={(title) => setSectionForm((p) => ({ ...p, title }))}
                  onDurationChange={(durationInput) => setSectionForm((p) => ({ ...p, durationInput }))}
                  onSave={() => void saveSection()}
                  onDelete={() => void deleteSection(builderSelection.id)}
                  deleteLabel="Delete section"
                />
              ) : !selectedLesson ? (
                <p className="text-sm text-[#666d80]">
                  {curriculum.modules.length === 0
                    ? "Add a module to start building your curriculum."
                    : "Select a module, section, or lesson to edit."}
                </p>
              ) : (
                <div className="mx-auto flex max-w-[736px] flex-col gap-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <span className="inline-flex items-center rounded-full border border-[#dfe1e7] px-[11px] py-[3px] text-[10px] font-bold uppercase leading-[15px] tracking-[0.05em] text-[#666d80]">
                      Editing {LESSON_TYPE_EDIT_LABEL[lessonForm.lessonType]}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium tracking-[0.02em] text-[#1a1b25]">Status:</span>
                      <span
                        className={
                          selectedLesson.is_published
                            ? "inline-flex rounded-full border border-[#b7eedf] bg-[#e8faf6] px-[11px] py-[3px] text-xs font-semibold leading-normal tracking-[0.02em] text-[#206d5b]"
                            : "inline-flex rounded-full border border-[#ffe5b7] bg-[#fff6e0] px-[11px] py-[3px] text-xs font-semibold leading-normal tracking-[0.02em] text-[#956321]"
                        }
                      >
                        {selectedLesson.is_published ? "Published" : "Not Published"}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-[10px] border border-[#dfe1e7] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="min-w-0 flex-1 text-sm font-normal leading-6 tracking-[0.02em] text-[#1a1b25]">
                        Lesson Title
                      </label>
                      <AdminLessonStatusDropdown
                        value={lessonForm.lessonType}
                        onChange={(lessonType) =>
                          setLessonForm((prev) => {
                            if (lessonType === "rep_work" && prev.lessonType !== "rep_work") {
                              return {
                                ...prev,
                                lessonType,
                                repWorkInstructions:
                                  prev.textContent?.trim() && !isRepWorkJson(prev.textContent)
                                    ? prev.textContent
                                    : "<p></p>",
                                repWorkPairs: [{ question: "<p></p>", answer: "<p></p>" }],
                              }
                            }
                            if (lessonType !== "rep_work" && prev.lessonType === "rep_work") {
                              const { instructions } = parseRepWorkFromTextContent(
                                serializeRepWorkContent(prev.repWorkInstructions, prev.repWorkPairs),
                              )
                              return { ...prev, lessonType, textContent: instructions }
                            }
                            return { ...prev, lessonType }
                          })
                        }
                      />
                    </div>
                    <input
                      className="admin-input mt-2"
                      value={lessonForm.title}
                      onChange={(e) =>
                        setLessonForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                          slug: prev.slug || slugify(e.target.value),
                        }))
                      }
                    />
                    <label className="admin-label mt-3">URL slug</label>
                    <input
                      className="admin-input"
                      value={lessonForm.slug}
                      onChange={(e) =>
                        setLessonForm((prev) => ({
                          ...prev,
                          slug: slugify(e.target.value),
                        }))
                      }
                    />
                    <label className="mt-3 block text-sm font-normal leading-6 tracking-[0.02em] text-[#1a1b25]">
                      Estimated Duration
                    </label>
                    <input
                      className="admin-input mt-2"
                      placeholder="e.g. 4h 30m"
                      value={lessonForm.durationMinutes}
                      onChange={(e) => setLessonForm((prev) => ({ ...prev, durationMinutes: e.target.value }))}
                    />
                    <p className="mt-1 text-xs text-[#666d80]">Stored as minutes; you can enter a number or values like 1h 30m.</p>
                  </div>

                  <div className="border-b border-[#dfe1e7]">
                    <span className="-mb-px inline-flex border-b-2 border-[#0d47a1] px-4 pb-2.5 pt-2 text-sm font-medium leading-5 text-[#0d47a1]">
                      Content Editor
                    </span>
                  </div>

                  <div id="lesson-instructions-anchor" className="flex flex-col gap-6">
                    {lessonForm.lessonType === "rep_work" ? (
                      <>
                        <AdminRichBlock
                          label="Instructions"
                          value={lessonForm.repWorkInstructions}
                          onChange={(html) => setLessonForm((p) => ({ ...p, repWorkInstructions: html }))}
                          minHeight={160}
                        />
                        {lessonForm.repWorkPairs.map((pair, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col gap-4 rounded-[10px] border border-[#dfe1e7] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                          >
                            <AdminRichBlock
                              label={`Question ${idx + 1}`}
                              labelClassName="text-sm font-medium leading-5 text-[#1a1b25]"
                              value={pair.question}
                              onChange={(html) =>
                                setLessonForm((p) => ({
                                  ...p,
                                  repWorkPairs: p.repWorkPairs.map((x, j) => (j === idx ? { ...x, question: html } : x)),
                                }))
                              }
                            />
                            <AdminRichBlock
                              label="Answer"
                              labelClassName="text-sm font-medium leading-5 text-[#1a1b25]"
                              value={pair.answer}
                              onChange={(html) =>
                                setLessonForm((p) => ({
                                  ...p,
                                  repWorkPairs: p.repWorkPairs.map((x, j) => (j === idx ? { ...x, answer: html } : x)),
                                }))
                              }
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          className="w-full rounded border border-[#f3f7ff] bg-[#f3f7ff] py-2.5 text-sm font-medium leading-5 text-[#0d47a1] transition-colors hover:bg-[#e8f0ff]"
                          onClick={() =>
                            setLessonForm((p) => ({
                              ...p,
                              repWorkPairs: [...p.repWorkPairs, { question: "<p></p>", answer: "<p></p>" }],
                            }))
                          }
                        >
                          + Add Question {lessonForm.repWorkPairs.length + 1}
                        </button>
                      </>
                    ) : (
                      <>
                        {lessonForm.lessonType === "video_text" && (
                          <div>
                            <label className="admin-label">Video URL (optional)</label>
                            <input
                              className="admin-input mt-1"
                              placeholder="https://"
                              value={lessonForm.videoUrl}
                              onChange={(e) => setLessonForm((prev) => ({ ...prev, videoUrl: e.target.value }))}
                            />
                          </div>
                        )}
                        <AdminRichBlock
                          label={lessonForm.lessonType === "video_text" ? "Lesson body" : "Instructions"}
                          value={lessonForm.textContent}
                          onChange={(html) => setLessonForm((p) => ({ ...p, textContent: html }))}
                          minHeight={lessonForm.lessonType === "video_text" ? 200 : 160}
                        />
                      </>
                    )}
                  </div>

                  {showQuestionLinking && (
                    <div id="lesson-link-questions" className="flex flex-col gap-3 rounded-[10px] border border-[#dfe1e7] p-4">
                      <div>
                        <label className="admin-label">Link PrepTest questions</label>
                        <p className="mt-1 text-xs text-[#666d80]">
                          {lessonForm.lessonType === "active_drill"
                            ? "Link exactly one question for this drill."
                            : "Link up to five questions for this adaptive drill."}{" "}
                          ({linkedQuestions.length}/{linkedQuestionCap} linked)
                        </p>
                      </div>
                      <div className="grid gap-2 md:grid-cols-4">
                        <select
                          className="admin-select"
                          value={selectedPrepTestId}
                          onChange={(e) => {
                            setSelectedPrepTestId(e.target.value)
                            void loadPrepTestSections(e.target.value)
                          }}
                        >
                          <option value="">Select PrepTest</option>
                          {prepTestOptions.map((pt) => (
                            <option key={pt.id} value={pt.id}>
                              {pt.module_id}
                            </option>
                          ))}
                        </select>
                        <select
                          className="admin-select"
                          value={selectedSectionId}
                          onChange={(e) => onSelectSection(e.target.value)}
                          disabled={!selectedPrepTestId}
                        >
                          <option value="">Select Section</option>
                          {sectionOptions.map((section) => (
                            <option key={String(section.id)} value={String(section.id)}>
                              {formatSectionOptionLabel(section)}
                            </option>
                          ))}
                        </select>
                        <select
                          className="admin-input"
                          value={selectedQuestionRef}
                          onChange={(e) => setSelectedQuestionRef(e.target.value)}
                          disabled={!selectedSectionId}
                        >
                          <option value="">Select Question</option>
                          {questionOptions.map((question) => (
                            <option key={question.id} value={question.id}>
                              Q{Number(question.question_number ?? 0)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="admin-btn admin-btn-ghost h-10 justify-center"
                          disabled={!selectedQuestionRef}
                          onClick={() => setPreviewQuestionId(selectedQuestionRef || null)}
                          aria-label="Preview selected question"
                          title="Preview selected question"
                        >
                          <Eye className="size-4" aria-hidden />
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          className="admin-btn admin-btn-primary"
                          disabled={!canLinkMore || !selectedQuestionRef}
                          onClick={() => {
                            if (!adminApi || !selectedLesson?.id || !selectedQuestionRef || !canLinkMore) return
                            const selectedLessonType = normalizeLessonStatus(selectedLesson.lesson_type)
                            const draftLessonType = normalizeLessonStatus(lessonForm.lessonType)
                            const persistTypePromise =
                              selectedLessonType !== draftLessonType
                                ? adminApi.updateLesson(selectedLesson.id, { lessonType: draftLessonType }).then(() => {
                                    setLessons((prev) =>
                                      prev.map((lesson) =>
                                        lesson.id === selectedLesson.id ? { ...lesson, lesson_type: draftLessonType } : lesson,
                                      ),
                                    )
                                  })
                                : Promise.resolve()
                            void persistTypePromise
                              .then(() => adminApi.linkQuestionToLesson(selectedLesson.id, selectedQuestionRef))
                              .then(() => {
                                setSelectedQuestionRef("")
                                return adminApi.listLessonQuestions(selectedLesson.id)
                              })
                              .then((rows) => {
                                setLinkedQuestions((rows as LessonQuestionRow[]) ?? [])
                              })
                              .catch((e) => {
                                setError(e instanceof Error ? e.message : "Failed to link question")
                              })
                          }}
                        >
                          Link
                        </button>
                        {!canLinkMore && (
                          <span className="text-xs text-[#666d80]">Remove a linked question to add another.</span>
                        )}
                        {canLinkMore && !selectedQuestionRef && (
                          <span className="text-xs text-[#666d80]">Choose PrepTest, section, and question.</span>
                        )}
                      </div>
                      <div className="overflow-hidden rounded-md border border-[#dfe1e7]">
                        <table className="w-full text-xs">
                          <thead className="border-b border-[#dfe1e7] bg-[#f6f8fa]">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium text-[#666d80]">Order</th>
                              <th className="px-3 py-2 text-left font-medium text-[#666d80]">PrepTest</th>
                              <th className="px-3 py-2 text-left font-medium text-[#666d80]">Section</th>
                              <th className="px-3 py-2 text-left font-medium text-[#666d80]">Question</th>
                              <th className="px-3 py-2 text-right font-medium text-[#666d80]">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {linkedQuestions.map((row) => {
                              const q = row.admin_questions
                              const section = q?.admin_sections
                              const prep = section?.admin_prep_tests
                              return (
                                <tr key={row.id} className="border-b border-[#dfe1e7]">
                                  <td className="px-3 py-2 text-[#1a1b25]">{row.sort_order}</td>
                                  <td className="px-3 py-2 text-[#1a1b25]">{prep?.module_id ?? prep?.title ?? "-"}</td>
                                  <td className="px-3 py-2 text-[#666d80]">
                                    {section && (section.section_number != null || section.section_type || section.title)
                                      ? formatSectionOptionLabel(section)
                                      : "-"}
                                  </td>
                                  <td className="px-3 py-2 text-[#666d80]">
                                    {q?.question_number ? `Q${q.question_number}` : q?.id ?? "-"}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <div className="flex flex-wrap justify-end gap-1">
                                      <button
                                        type="button"
                                        className="admin-btn admin-btn-ghost !px-2 !py-1"
                                        disabled={!q?.id}
                                        onClick={() => setPreviewQuestionId(q?.id ?? null)}
                                      >
                                        Preview
                                      </button>
                                      <button
                                        type="button"
                                        className="admin-btn admin-btn-ghost !px-2 !py-1"
                                        onClick={() => {
                                          if (!adminApi || !selectedLessonId) return
                                          void adminApi
                                            .unlinkQuestionFromLesson(row.id)
                                            .then(() => adminApi.listLessonQuestions(selectedLessonId))
                                            .then((rows) => {
                                              setLinkedQuestions((rows as LessonQuestionRow[]) ?? [])
                                            })
                                            .catch((e) => {
                                              setError(e instanceof Error ? e.message : "Failed to unlink question")
                                            })
                                        }}
                                      >
                                        Unlink
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                            {linkedQuestions.length === 0 && (
                              <tr>
                                <td className="px-3 py-3 text-[#666d80]" colSpan={5}>
                                  No questions linked yet.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#dfe1e7] pt-4">
                    <button
                      type="button"
                      className="text-sm font-medium text-[#df1c41] transition-opacity hover:opacity-80"
                      onClick={() => void deleteLesson(selectedLesson.id)}
                    >
                      Delete lesson
                    </button>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="admin-btn admin-btn-ghost"
                        disabled={isSavingLesson}
                        onClick={() => void saveLesson({ publish: false })}
                      >
                        {isSavingLesson ? "Saving…" : "Save draft"}
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn-primary"
                        disabled={isSavingLesson}
                        onClick={() => void saveLesson({ publish: true })}
                      >
                        {isSavingLesson ? "Saving…" : "Save & publish"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
          </div>
          {selectedLesson ? (
            <AdminLessonQuickAdd
              onAddVideo={() => {
                setLessonForm((p) => ({ ...p, lessonType: "video_text" }))
                document.getElementById("lesson-instructions-anchor")?.scrollIntoView({ behavior: "smooth" })
              }}
              onAddText={() => {
                document.getElementById("lesson-instructions-anchor")?.scrollIntoView({ behavior: "smooth" })
              }}
              onAddImage={() => {
                const raw = window.prompt("Image URL (https://…)", "https://")
                if (raw == null) return
                const url = raw.trim()
                if (!url) return
                setLessonForm((p) => ({
                  ...p,
                  textContent: `${p.textContent || "<p></p>"}<p><img src="${url}" alt="" /></p>`,
                }))
              }}
              onAddQuestion={() => {
                document.getElementById("lesson-link-questions")?.scrollIntoView({ behavior: "smooth" })
              }}
            />
          ) : null}
          </div>
        </div>
      )}
      <LessonQuestionPreviewModal
        open={previewQuestionId != null}
        onOpenChange={(open) => {
          if (!open) setPreviewQuestionId(null)
        }}
        questionId={previewQuestionId}
        adminApi={adminApi}
      />
    </section>
  )
}

export { AdminCoursesPage }
