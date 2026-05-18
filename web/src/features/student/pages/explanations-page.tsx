import { useCallback, useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentSubnavStrip } from "@/features/student/components/student-subnav-strip"
import {
  createExplanationsApi,
  type ExplanationDetailPayload,
  type ExplanationsSummaryRow,
} from "@/lib/api/explanations"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { BookOpen, Loader2, PlayCircle, Video } from "lucide-react"

type SectionFilter = "all" | "lr" | "rc" | "lg"

function formatQuestionLine(row: ExplanationsSummaryRow): string {
  const qn = row.questionNumber != null ? `Q${row.questionNumber}` : "Q?"
  const sec = row.sectionType ?? "—"
  return `${row.prepTestTitle} · ${sec} · ${qn}`
}

function ExplanationsPage() {
  const [rows, setRows] = useState<ExplanationsSummaryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>("all")
  const [prepTestFilter, setPrepTestFilter] = useState<string>("all")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogHeadline, setDialogHeadline] = useState("")
  const [dialogDetail, setDialogDetail] = useState<ExplanationDetailPayload | null>(null)
  const [dialogLoading, setDialogLoading] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)

  const explanationsApi = useMemo(() => {
    try {
      return createExplanationsApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    let alive = true
    async function load() {
      if (!explanationsApi) {
        if (alive) {
          setLoadError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
          setLoading(false)
        }
        return
      }
      try {
        const list = await explanationsApi.listExplanations()
        if (!alive) return
        setRows(list)
      } catch (e) {
        if (!alive) return
        setLoadError(e instanceof Error ? e.message : "Failed to load explanations")
      } finally {
        if (alive) setLoading(false)
      }
    }
    void load()
    return () => {
      alive = false
    }
  }, [explanationsApi])

  const prepTestOptions = useMemo(() => {
    const titles = new Set<string>()
    for (const r of rows) {
      if (r.prepTestTitle.trim()) titles.add(r.prepTestTitle)
    }
    return [...titles].sort((a, b) => a.localeCompare(b))
  }, [rows])

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (prepTestFilter !== "all" && r.prepTestTitle !== prepTestFilter) return false
      if (sectionFilter === "all") return true
      const st = (r.sectionType ?? "").toLowerCase()
      return st === sectionFilter
    })
  }, [rows, prepTestFilter, sectionFilter])

  const openDetail = useCallback(
    async (row: ExplanationsSummaryRow) => {
      if (!explanationsApi) return
      setDialogOpen(true)
      setDialogHeadline(formatQuestionLine(row))
      setDialogDetail(null)
      setDialogError(null)
      setDialogLoading(true)
      try {
        const d = await explanationsApi.getExplanationDetail(row.questionId)
        setDialogDetail(d)
      } catch (e) {
        setDialogError(e instanceof Error ? e.message : "Failed to load explanation")
      } finally {
        setDialogLoading(false)
      }
    },
    [explanationsApi],
  )

  return (
    <>
      <StudentSubnavStrip
        crumbs={[
          { label: "Learn", href: "/app/prep-course" },
          { label: "Explanations" },
        ]}
      />
      <StudentMain>
        <div className="mb-6 flex flex-col gap-4 border-b border-[#dfe1e7] pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#082c6b] md:text-3xl">LSAT Question Explanations</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#666d80]">
              Written and video explanations your team has published for PrepTest questions. Filter by section or PrepTest.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={sectionFilter === "all" ? "default" : "outline"}
                size="sm"
                className="rounded-xl"
                onClick={() => setSectionFilter("all")}
              >
                All
              </Button>
              <Button
                type="button"
                variant={sectionFilter === "lr" ? "default" : "outline"}
                size="sm"
                className="rounded-xl"
                onClick={() => setSectionFilter("lr")}
              >
                LR
              </Button>
              <Button
                type="button"
                variant={sectionFilter === "rc" ? "default" : "outline"}
                size="sm"
                className="rounded-xl"
                onClick={() => setSectionFilter("rc")}
              >
                RC
              </Button>
              <Button
                type="button"
                variant={sectionFilter === "lg" ? "default" : "outline"}
                size="sm"
                className="rounded-xl"
                onClick={() => setSectionFilter("lg")}
              >
                LG
              </Button>
            </div>
            <label className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#666d80]">
              <span>PrepTest</span>
              <select
                className="rounded-xl border border-[#dfe1e7] bg-white px-3 py-1.5 text-sm font-semibold text-[#082c6b] outline-none focus-visible:ring-2 focus-visible:ring-[#0d47a1]/30"
                value={prepTestFilter}
                onChange={(e) => setPrepTestFilter(e.target.value)}
              >
                <option value="all">All PrepTests</option>
                {prepTestOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {loadError ? <p className="mb-4 text-sm text-[#95122b]">{loadError}</p> : null}

        {loading ? (
          <p className="ds-body-sm ds-text-muted flex items-center gap-2">
            <Loader2 className="size-4 animate-spin shrink-0" aria-hidden />
            Loading explanations…
          </p>
        ) : null}

        {!loading && !loadError && rows.length === 0 ? (
          <p className="max-w-xl text-sm text-[#666d80]">
            No published explanations yet. When an admin adds written or video explanation content to PrepTest questions, they will appear here.
          </p>
        ) : null}

        {!loading && !loadError && rows.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-[#dfe1e7] bg-white shadow-[0px_5px_10px_0px_rgba(13,13,18,0.04)]">
            <div className="grid grid-cols-[1fr_100px_120px_140px] gap-2 border-b border-[#dfe1e7] bg-[#f3f7ff] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#666d80] md:grid-cols-[1fr_120px_140px_160px]">
              <span>Question</span>
              <span className="hidden sm:inline">Section</span>
              <span>Topic</span>
              <span className="text-right">Media</span>
            </div>
            <ul className="divide-y divide-[#dfe1e7]">
              {filteredRows.length === 0 ? (
                <li className="px-4 py-6 text-sm text-[#666d80]">No rows match the current filters.</li>
              ) : (
                filteredRows.map((row) => {
                  const qn = row.questionNumber != null ? `Q${row.questionNumber}` : "Q?"
                  const sec = row.sectionType ?? "—"
                  return (
                    <li
                      key={row.questionId}
                      className="grid grid-cols-1 gap-2 px-4 py-4 sm:grid-cols-[1fr_120px_140px_160px] sm:items-center"
                    >
                      <div className="flex min-w-0 flex-col">
                        <span className="font-semibold text-[#082c6b]">
                          {row.prepTestTitle} · {sec} · {qn}
                        </span>
                        <span className="text-sm text-[#666d80] sm:hidden">{row.topicName}</span>
                      </div>
                      <span className="hidden text-sm font-medium text-[#082c6b] sm:inline">{sec}</span>
                      <span className="hidden text-sm text-[#666d80] sm:inline">{row.topicName}</span>
                      <div className="flex justify-end gap-2">
                        {row.hasVideo ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-xl border-[#0d47a1] text-[#0d47a1]"
                            onClick={() => void openDetail(row)}
                          >
                            <Video className="size-4" />
                            <span className="ml-1 hidden md:inline">Watch</span>
                          </Button>
                        ) : null}
                        {row.hasWrittenExplanation ? (
                          <Button
                            type="button"
                            size="sm"
                            className="rounded-xl bg-[#0d47a1] text-white hover:bg-[#0d47a1]/90"
                            onClick={() => void openDetail(row)}
                          >
                            <BookOpen className="size-4" />
                            <span className="ml-1 hidden md:inline">Read</span>
                          </Button>
                        ) : null}
                        {!row.hasVideo && !row.hasWrittenExplanation ? (
                          <span className="text-xs text-[#666d80]">No media yet</span>
                        ) : null}
                      </div>
                    </li>
                  )
                })
              )}
            </ul>
          </div>
        ) : null}

        <p className="mt-4 flex items-center gap-2 text-xs text-[#666d80]">
          <PlayCircle className="size-4 shrink-0 text-[#0d47a1]" aria-hidden />
          Content is managed in the admin question editor for each PrepTest. You do not need to have attempted a question to view its
          explanation here.
        </p>

        <DialogRoot open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="text-[#082c6b]">{dialogHeadline}</DialogTitle>
              <DialogDescription className="sr-only">Explanation content for this question.</DialogDescription>
            </DialogHeader>
            {dialogLoading ? (
              <p className="flex items-center gap-2 text-sm text-[#666d80]">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Loading…
              </p>
            ) : null}
            {dialogError ? <p className="text-sm text-[#95122b]">{dialogError}</p> : null}
            {!dialogLoading && !dialogError && dialogDetail ? (
              <div className="space-y-6">
                {dialogDetail.explanationHtml ? (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-[#082c6b]">Written explanation</h3>
                    {/* Admin-authored HTML from the question bank */}
                    <div
                      className="max-w-none space-y-2 text-sm leading-relaxed text-[#333] [&_a]:text-[#0d47a1] [&_img]:max-w-full [&_p]:my-2"
                      dangerouslySetInnerHTML={{ __html: dialogDetail.explanationHtml }}
                    />
                  </div>
                ) : null}
                {dialogDetail.videoUrl ? (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-[#082c6b]">Video</h3>
                    <video controls className="max-h-[50vh] w-full rounded-lg bg-black" src={dialogDetail.videoUrl} />
                  </div>
                ) : null}
                {!dialogDetail.explanationHtml && !dialogDetail.videoUrl ? (
                  <p className="text-sm text-[#666d80]">No explanation content is available for this question yet.</p>
                ) : null}
              </div>
            ) : null}
          </DialogContent>
        </DialogRoot>
      </StudentMain>
    </>
  )
}

export { ExplanationsPage }
