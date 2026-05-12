import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"

import "@/features/admin/admin-theme.css"
import { AnnotationToolbar } from "@/features/admin/components/annotation-toolbar"
import { AnnotationTextBox } from "@/features/admin/components/annotation-text-box"
import { Button } from "@/components/ui/button"
import { ADMIN_QUESTION_VIDEO_SAVED } from "@/features/admin/lib/admin-question-video-messages"
import { drawAllAnnotations, drawAnnotation, drawShapePreview } from "@/features/admin/lib/annotations/draw"
import { hitTest } from "@/features/admin/lib/annotations/hit-test"
import type {
  Annotation,
  AnnotationTool,
  PenAnnotation,
  ShapeAnnotation,
  TextAnnotation,
} from "@/features/admin/lib/annotations/types"
import {
  buildQuestionPreviewLeftHtml,
  choicesToPreviewRows,
  firstOrSelf,
} from "@/features/admin/lib/question-content-preview"
import { sanitizeAdminHtml } from "@/features/admin/lib/sanitize-admin-html"
import { useAnnotationState } from "@/features/admin/hooks/use-annotation-state"
import { useAdminApi } from "@/features/admin/use-admin-api"

type LessonQuestionScopeRow = {
  admin_questions?: {
    id: string
    admin_sections?: {
      id?: string
      prep_test_id?: string | null
      admin_prep_tests?: { id?: string } | null
    } | null
  } | null
}

function mapLessonQuestionsToScope(rows: unknown[]): Array<{ prepTestId: string; sectionId: string; questionId: string }> {
  const out: Array<{ prepTestId: string; sectionId: string; questionId: string }> = []
  for (const row of rows) {
    const r = row as LessonQuestionScopeRow
    const q = r.admin_questions
    const sec = q?.admin_sections
    if (!q?.id || !sec?.id) continue
    const prepTestId = sec.prep_test_id ?? sec.admin_prep_tests?.id
    if (!prepTestId) continue
    out.push({ prepTestId, sectionId: sec.id, questionId: q.id })
  }
  return out
}

function pickRecorderMime(): string | undefined {
  const candidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) return c
  }
  return undefined
}

function extensionFromBlob(blob: Blob): string {
  const t = blob.type || ""
  if (t.includes("mp4")) return "mp4"
  if (t.includes("quicktime")) return "mov"
  if (t.includes("matroska")) return "mkv"
  return "webm"
}

type RecordingPipeline = {
  /** Stream passed to `MediaRecorder` (may differ from raw display stream when mic is mixed). */
  recordStream: MediaStream
  cleanup: () => void
}

/** Chromium `getDisplayMedia` hints (not in older `lib.dom` typings). */
type ChromiumDisplayMediaHints = DisplayMediaStreamOptions & {
  systemAudio?: "include" | "exclude"
  preferCurrentTab?: boolean
  selfBrowserSurface?: "include" | "exclude"
  surfaceSwitching?: "include" | "exclude"
  monitorTypeSurfaces?: "include" | "exclude"
}

/** Prefer tab audio, current tab in list, and tab / window / entire screen all available. */
function displayMediaCaptureOptions(): DisplayMediaStreamOptions {
  const opts: ChromiumDisplayMediaHints = {
    video: true,
    audio: true,
    systemAudio: "include",
    preferCurrentTab: true,
    selfBrowserSurface: "include",
    surfaceSwitching: "include",
    monitorTypeSurfaces: "include",
  }
  return opts
}

/**
 * Tab capture does not include the microphone. Mix display audio (if any) + mic into one track.
 */
async function createRecordingPipeline(): Promise<RecordingPipeline> {
  const display = await navigator.mediaDevices.getDisplayMedia(displayMediaCaptureOptions())

  const videoTrack = display.getVideoTracks()[0]
  if (!videoTrack) {
    display.getTracks().forEach((t) => t.stop())
    throw new Error("No display video track")
  }

  let mic: MediaStream | null = null
  try {
    mic = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    })
  } catch {
    /* user denied or no mic — continue with display-only audio */
  }

  const displayAudioTrack = display.getAudioTracks()[0]
  const micTrack = mic?.getAudioTracks()[0]

  if (!micTrack) {
    if (displayAudioTrack) {
      return {
        recordStream: display,
        cleanup: () => {
          display.getTracks().forEach((t) => t.stop())
          mic?.getTracks().forEach((t) => t.stop())
        },
      }
    }
    const videoClone = videoTrack.clone()
    return {
      recordStream: new MediaStream([videoClone]),
      cleanup: () => {
        videoClone.stop()
        display.getTracks().forEach((t) => t.stop())
        mic?.getTracks().forEach((t) => t.stop())
      },
    }
  }

  const ctx = new AudioContext()
  if (ctx.state === "suspended") {
    await ctx.resume()
  }
  const dest = ctx.createMediaStreamDestination()
  if (displayAudioTrack) {
    ctx.createMediaStreamSource(new MediaStream([displayAudioTrack])).connect(dest)
  }
  ctx.createMediaStreamSource(new MediaStream([micTrack])).connect(dest)
  const mixedAudio = dest.stream.getAudioTracks()[0]
  if (!mixedAudio) {
    await ctx.close()
    display.getTracks().forEach((t) => t.stop())
    mic?.getTracks().forEach((t) => t.stop())
    throw new Error("Could not build audio mix")
  }

  const videoClone = videoTrack.clone()
  const recordStream = new MediaStream([videoClone, mixedAudio])
  return {
    recordStream,
    cleanup: () => {
      videoClone.stop()
      display.getTracks().forEach((t) => t.stop())
      mic?.getTracks().forEach((t) => t.stop())
      void ctx.close()
    },
  }
}

type DragState =
  | {
      kind: "pen"
      pointerId: number
      points: Array<{ x: number; y: number }>
      highlight: boolean
    }
  | {
      kind: "shape"
      pointerId: number
      shapeKind: ShapeAnnotation["kind"]
      start: { x: number; y: number }
    }
  | {
      kind: "move"
      pointerId: number
      id: string
      grab: { x: number; y: number }
      snapshot: Annotation
    }

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `a-${Date.now()}-${Math.random()}`
}

function applyMoveDelta(ann: Annotation, dx: number, dy: number): Partial<Annotation> {
  if (ann.kind === "text") {
    return {
      position: { x: ann.position.x + dx, y: ann.position.y + dy },
    }
  }
  if (ann.kind === "pen" || ann.kind === "highlight") {
    return {
      points: ann.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
    }
  }
  if (ann.kind === "rect" || ann.kind === "ellipse" || ann.kind === "line" || ann.kind === "arrow") {
    return {
      start: { x: ann.start.x + dx, y: ann.start.y + dy },
      end: { x: ann.end.x + dx, y: ann.end.y + dy },
    }
  }
  return {}
}

function AdminQuestionVideoRecordPage() {
  const adminApi = useAdminApi()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { prepTestId, sectionId, questionId } = useParams()
  const lessonId = searchParams.get("lessonId")?.trim() ?? ""
  const lessonDrill = searchParams.get("lessonDrill")?.trim() ?? ""
  const [scopedQuestions, setScopedQuestions] = useState<Array<{ prepTestId: string; sectionId: string; questionId: string }>>([])
  const [question, setQuestion] = useState<Record<string, unknown> | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [annotateMode, setAnnotateMode] = useState(false)
  const [toolsHidden, setToolsHidden] = useState(false)
  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [savedUrl, setSavedUrl] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const {
    state: annState,
    add,
    update,
    delete: deleteAnn,
    select,
    setTool,
    setColor,
    setStrokeWidth,
    setFontSize,
    undo,
    redo,
    clear,
    pushHistoryMarker,
    canUndo,
    canRedo,
  } = useAnnotationState()

  const wrapRef = useRef<HTMLDivElement>(null)
  const staticCanvasRef = useRef<HTMLCanvasElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const annotationsRef = useRef(annState.annotations)
  const dragRef = useRef<DragState | null>(null)
  const dragDocCleanupRef = useRef<(() => void) | null>(null)
  const strokeWidthRef = useRef(annState.strokeWidth)
  const annUiRef = useRef(annState)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const recordingCleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    let alive = true
    async function load() {
      if (!adminApi || !questionId) return
      try {
        const data = await adminApi.getQuestionEditorPayload(questionId)
        if (!alive) return
        setQuestion(data.question as Record<string, unknown>)
      } catch (e) {
        if (alive) setLoadError(e instanceof Error ? e.message : "Failed to load question")
      }
    }
    void load()
    return () => {
      alive = false
    }
  }, [adminApi, questionId])

  useEffect(() => {
    let alive = true
    async function loadScope() {
      if (!adminApi || !lessonId) {
        if (alive) setScopedQuestions([])
        return
      }
      try {
        const rows = await adminApi.listLessonQuestions(lessonId)
        if (!alive) return
        let mapped = mapLessonQuestionsToScope(rows)
        if (lessonDrill === "active") {
          mapped = mapped.slice(0, 1)
        }
        setScopedQuestions(mapped)
      } catch {
        if (alive) setScopedQuestions([])
      }
    }
    void loadScope()
    return () => {
      alive = false
    }
  }, [adminApi, lessonId, lessonDrill])

  useEffect(() => {
    if (!lessonId || scopedQuestions.length === 0 || !questionId) return
    const ok = scopedQuestions.some((x) => x.questionId === questionId)
    if (!ok) {
      const t = scopedQuestions[0]!
      navigate(
        `/admin/preptests/${t.prepTestId}/sections/${t.sectionId}/questions/${t.questionId}/record?${searchParams.toString()}`,
        { replace: true },
      )
    }
  }, [lessonId, scopedQuestions, questionId, navigate, searchParams])

  useEffect(() => {
    if (!toastMsg) return
    const t = window.setTimeout(() => setToastMsg(null), 2500)
    return () => window.clearTimeout(t)
  }, [toastMsg])

  useLayoutEffect(() => {
    annotationsRef.current = annState.annotations
    strokeWidthRef.current = annState.strokeWidth
    annUiRef.current = annState
  }, [annState])

  const copyVideoUrl = useCallback(async () => {
    if (!savedUrl) return
    try {
      await navigator.clipboard.writeText(savedUrl)
      setToastMsg("Copied to clipboard")
    } catch {
      setToastMsg("Could not copy")
    }
  }, [savedUrl])

  const redrawStatic = useCallback(() => {
    const canvas = staticCanvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!ctx || !canvas) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawAllAnnotations(ctx, annotationsRef.current)
  }, [])

  const clearPreview = useCallback(() => {
    const canvas = previewCanvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!ctx || !canvas) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }, [])

  const resizeCanvases = useCallback(() => {
    const wrap = wrapRef.current
    const staticC = staticCanvasRef.current
    const previewC = previewCanvasRef.current
    if (!wrap || !staticC || !previewC) return
    const rect = wrap.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    for (const canvas of [staticC, previewC]) {
      canvas.width = Math.max(1, Math.floor(rect.width * dpr))
      canvas.height = Math.max(1, Math.floor(rect.height * dpr))
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      const ctx = canvas.getContext("2d")
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    redrawStatic()
    clearPreview()
  }, [clearPreview, redrawStatic])

  useLayoutEffect(() => {
    resizeCanvases()
    const ro = new ResizeObserver(() => resizeCanvases())
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [resizeCanvases, question])

  useEffect(() => {
    redrawStatic()
  }, [annState.annotations, redrawStatic])

  const detachDocumentDrag = useCallback(() => {
    const fn = dragDocCleanupRef.current
    if (fn) {
      fn()
      dragDocCleanupRef.current = null
    }
  }, [])

  useEffect(() => () => detachDocumentDrag(), [detachDocumentDrag])

  const clientToOverlay = useCallback((clientX: number, clientY: number) => {
    const canvas = previewCanvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return { x: clientX - rect.left, y: clientY - rect.top }
  }, [])

  const attachDocumentDrag = useCallback(
    (pointerId: number) => {
      detachDocumentDrag()
      const onMove = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return
        const drag = dragRef.current
        if (!drag) return
        const p = clientToOverlay(ev.clientX, ev.clientY)
        const ui = annUiRef.current

        if (drag.kind === "pen") {
          drag.points.push(p)
          const canvas = previewCanvasRef.current
          const ctx = canvas?.getContext("2d")
          if (!ctx || drag.points.length < 2) return
          ctx.clearRect(0, 0, canvas!.width, canvas!.height)
          const ann: PenAnnotation = {
            kind: drag.highlight ? "highlight" : "pen",
            id: "__p__",
            color: ui.color,
            width: ui.strokeWidth,
            points: drag.points,
          }
          drawAnnotation(ctx, ann)
          return
        }

        if (drag.kind === "shape") {
          const canvas = previewCanvasRef.current
          const ctx = canvas?.getContext("2d")
          if (!ctx || !canvas) return
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          drawShapePreview(ctx, drag.shapeKind, drag.start, p, ui.color, ui.strokeWidth)
          return
        }

        if (drag.kind === "move") {
          const dx = p.x - drag.grab.x
          const dy = p.y - drag.grab.y
          const patch = applyMoveDelta(drag.snapshot, dx, dy)
          update(drag.id, patch, true)
        }
      }

      const onUp = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return
        const drag = dragRef.current
        dragRef.current = null
        detachDocumentDrag()
        if (!drag) return
        const p = clientToOverlay(ev.clientX, ev.clientY)
        const ui = annUiRef.current

        if (drag.kind === "pen") {
          clearPreview()
          let pts = drag.points
          if (pts.length === 1) pts = [...pts, { x: pts[0]!.x + 0.01, y: pts[0]!.y }]
          if (pts.length < 2) return
          const ann: PenAnnotation = {
            kind: drag.highlight ? "highlight" : "pen",
            id: newId(),
            color: ui.color,
            width: ui.strokeWidth,
            points: pts,
          }
          add(ann)
          return
        }

        if (drag.kind === "shape") {
          clearPreview()
          const w = Math.abs(p.x - drag.start.x)
          const h = Math.abs(p.y - drag.start.y)
          if (w < 2 && h < 2 && drag.shapeKind !== "line" && drag.shapeKind !== "arrow") return
          const ann: ShapeAnnotation = {
            kind: drag.shapeKind,
            id: newId(),
            color: ui.color,
            width: ui.strokeWidth,
            start: drag.start,
            end: p,
          }
          add(ann)
          return
        }

        /* move: history marker was pushed at pointerdown; live updates used skipHistory */
      }

      document.addEventListener("pointermove", onMove, { passive: true })
      document.addEventListener("pointerup", onUp)
      dragDocCleanupRef.current = () => {
        document.removeEventListener("pointermove", onMove)
        document.removeEventListener("pointerup", onUp)
      }
    },
    [add, clearPreview, clientToOverlay, detachDocumentDrag, update],
  )

  const handleSetTool = useCallback(
    (t: AnnotationTool) => {
      setTool(t)
      setEditingTextId(null)
      if (t === "highlighter") {
        setStrokeWidth(Math.max(strokeWidthRef.current, 12))
      }
    },
    [setTool, setStrokeWidth],
  )

  const beginSelectDragFromText = useCallback(
    (e: React.PointerEvent, id: string) => {
      if (annState.tool !== "select" || e.button !== 0) return
      const hit = annotationsRef.current.find((x) => x.id === id)
      if (!hit) return
      const p = clientToOverlay(e.clientX, e.clientY)
      pushHistoryMarker()
      dragRef.current = {
        kind: "move",
        pointerId: e.pointerId,
        id: hit.id,
        grab: p,
        snapshot: structuredClone(hit) as Annotation,
      }
      attachDocumentDrag(e.pointerId)
    },
    [annState.tool, attachDocumentDrag, clientToOverlay, pushHistoryMarker],
  )

  const onPointerDownCanvas = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!annotateMode) return
      const p = clientToOverlay(e.clientX, e.clientY)
      const tool = annState.tool

      if (tool === "select") {
        const hit = hitTest(annotationsRef.current, p.x, p.y)
        if (hit) {
          select(hit.id)
          setEditingTextId(null)
          pushHistoryMarker()
          dragRef.current = {
            kind: "move",
            pointerId: e.pointerId,
            id: hit.id,
            grab: p,
            snapshot: structuredClone(hit) as Annotation,
          }
          attachDocumentDrag(e.pointerId)
        } else {
          select(null)
          setEditingTextId(null)
        }
        return
      }

      if (tool === "text") {
        const hit = hitTest(annotationsRef.current, p.x, p.y)
        if (hit?.kind === "text") {
          select(hit.id)
          setEditingTextId(hit.id)
          return
        }
        const id = newId()
        const tAnn: TextAnnotation = {
          kind: "text",
          id,
          position: { x: p.x, y: p.y },
          width: 260,
          fontSize: annState.fontSize,
          color: annState.color,
          html: "",
        }
        add(tAnn)
        setAnnotateMode(true)
        setEditingTextId(id)
        return
      }

      if (tool === "pen" || tool === "highlighter") {
        dragRef.current = {
          kind: "pen",
          pointerId: e.pointerId,
          points: [p],
          highlight: tool === "highlighter",
        }
        attachDocumentDrag(e.pointerId)
        return
      }

      if (tool === "rect" || tool === "ellipse" || tool === "line" || tool === "arrow") {
        dragRef.current = {
          kind: "shape",
          pointerId: e.pointerId,
          shapeKind: tool,
          start: p,
        }
        attachDocumentDrag(e.pointerId)
      }
    },
    [
      annotateMode,
      clientToOverlay,
      annState.tool,
      annState.fontSize,
      annState.color,
      add,
      select,
      pushHistoryMarker,
      attachDocumentDrag,
    ],
  )

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null
      if (el?.isContentEditable) return
      if (el?.closest("[data-annotation-text-editor]")) return

      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }
      if ((e.key === "Backspace" || e.key === "Delete") && annState.selectedId) {
        e.preventDefault()
        deleteAnn(annState.selectedId)
        setEditingTextId(null)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [annState.selectedId, deleteAnn, redo, undo])

  async function startRecording() {
    if (!questionId || !adminApi) return
    setStatusMsg(null)
    setSavedUrl(null)
    try {
      const { recordStream, cleanup } = await createRecordingPipeline()
      recordingCleanupRef.current = cleanup
      streamRef.current = recordStream
      chunksRef.current = []
      const mime = pickRecorderMime()
      const rec = mime ? new MediaRecorder(recordStream, { mimeType: mime }) : new MediaRecorder(recordStream)
      mediaRecorderRef.current = rec
      rec.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data)
      }
      rec.onerror = () => setStatusMsg("Recording error")
      rec.start(250)
      setRecording(true)
      setStatusMsg(
        'Pick this tab in the share dialog. Enable "Share tab audio" if you want sounds from the tab. Your microphone is mixed in for narration.',
      )
    } catch (err) {
      recordingCleanupRef.current?.()
      recordingCleanupRef.current = null
      streamRef.current = null
      setStatusMsg(err instanceof Error ? err.message : "Could not start capture")
    }
  }

  async function stopRecording() {
    const rec = mediaRecorderRef.current
    if (!rec || !questionId || !adminApi) {
      recordingCleanupRef.current?.()
      recordingCleanupRef.current = null
      streamRef.current = null
      setRecording(false)
      return
    }
    setProcessing(true)
    setStatusMsg("Finishing recording…")
    await new Promise<void>((resolve) => {
      rec.onstop = () => resolve()
      if (rec.state !== "inactive") rec.stop()
      else resolve()
    })
    recordingCleanupRef.current?.()
    recordingCleanupRef.current = null
    streamRef.current = null
    mediaRecorderRef.current = null
    setRecording(false)
    try {
      const blob = new Blob(chunksRef.current, { type: rec.mimeType || "video/webm" })
      const ext = extensionFromBlob(blob)
      const contentType = blob.type || "video/webm"
      const url = await adminApi.uploadQuestionVideoBlob(questionId, blob, contentType, ext)
      await adminApi.updateQuestionMeta(questionId, { video_url: url })
      setSavedUrl(url)
      setStatusMsg("Saved. You can close this tab.")
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          { type: ADMIN_QUESTION_VIDEO_SAVED, questionId, videoUrl: url },
          window.location.origin,
        )
      }
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setProcessing(false)
    }
  }

  const editorBack =
    prepTestId && sectionId && questionId
      ? `/admin/preptests/${prepTestId}/sections/${sectionId}/questions/${questionId}`
      : "/admin/preptests"

  if (loadError) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background p-6 text-foreground">
        <p className="text-destructive">{loadError}</p>
        <Button className="mt-4 w-fit" variant="outline" asChild>
          <Link to={editorBack}>Back to editor</Link>
        </Button>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-6 text-sm text-muted-foreground">
        Loading question…
      </div>
    )
  }

  const leftHtml = buildQuestionPreviewLeftHtml(question)
  const stemHtml = sanitizeAdminHtml(question.stem_text)
  const rows = choicesToPreviewRows(question.choices)
  const qn = question.question_number != null ? String(question.question_number) : "—"
  const sec = firstOrSelf(question.admin_sections as Record<string, unknown> | Record<string, unknown>[] | undefined)
  const sectionLabel = String(sec?.section_type ?? sec?.title ?? "")

  const scopeIndex = questionId ? scopedQuestions.findIndex((x) => x.questionId === questionId) : -1
  const prevScope = scopeIndex > 0 ? scopedQuestions[scopeIndex - 1] : null
  const nextScope =
    scopeIndex >= 0 && scopeIndex < scopedQuestions.length - 1 ? scopedQuestions[scopeIndex + 1]! : null
  const showCourseQuestionNav = Boolean(lessonId) && scopedQuestions.length > 1

  const columnPointerEvents = annotateMode || editingTextId ? ("none" as const) : ("auto" as const)
  const canvasPointerClass =
    annotateMode && !editingTextId ? "pointer-events-auto touch-none" : "pointer-events-none touch-none"
  const textLayerPointer =
    annotateMode || editingTextId ? "pointer-events-none [&>*]:pointer-events-auto" : "pointer-events-none"

  return (
    <div className="fixed inset-0 z-50 flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-background text-foreground">
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-muted/40 px-3 py-2 text-sm">
        <Button type="button" variant="outline" size="sm" asChild>
          <Link to={editorBack}>← Editor</Link>
        </Button>
        <span className="text-muted-foreground">Q{qn}</span>
        {sectionLabel ? <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{sectionLabel}</span> : null}
        {showCourseQuestionNav ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!prevScope}
              onClick={() => {
                if (!prevScope) return
                navigate(
                  `/admin/preptests/${prevScope.prepTestId}/sections/${prevScope.sectionId}/questions/${prevScope.questionId}/record?${searchParams.toString()}`,
                )
              }}
            >
              ← Prev
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!nextScope}
              onClick={() => {
                if (!nextScope) return
                navigate(
                  `/admin/preptests/${nextScope.prepTestId}/sections/${nextScope.sectionId}/questions/${nextScope.questionId}/record?${searchParams.toString()}`,
                )
              }}
            >
              Next →
            </Button>
            <span className="text-xs text-muted-foreground">
              {scopeIndex + 1}/{scopedQuestions.length}
            </span>
          </>
        ) : null}
        <Button
          type="button"
          variant={annotateMode ? "default" : "outline"}
          size="sm"
          onClick={() => setAnnotateMode((v) => !v)}
          title="When on, you draw on the overlay; when off, scroll the passage."
        >
          Annotate {annotateMode ? "on" : "off"}
        </Button>
        <div className="ml-auto flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
          <AnnotationToolbar
            tool={annState.tool}
            color={annState.color}
            strokeWidth={annState.strokeWidth}
            fontSize={annState.fontSize}
            canUndo={canUndo}
            canRedo={canRedo}
            toolsHidden={toolsHidden}
            onToolsHiddenChange={setToolsHidden}
            onTool={handleSetTool}
            onColor={setColor}
            onStrokeWidth={setStrokeWidth}
            onFontSize={setFontSize}
            onUndo={undo}
            onRedo={redo}
            onClear={clear}
            clearDisabled={recording}
            selectedId={annState.selectedId}
            onDeleteSelected={
              annState.selectedId
                ? () => {
                    deleteAnn(annState.selectedId!)
                    setEditingTextId(null)
                  }
                : undefined
            }
          />
          {!recording ? (
            <Button type="button" size="sm" disabled={processing} onClick={() => void startRecording()}>
              Start recording
            </Button>
          ) : (
            <Button type="button" size="sm" variant="destructive" disabled={processing} onClick={() => void stopRecording()}>
              Stop & upload
            </Button>
          )}
        </div>
      </header>
      {statusMsg ? (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">
          {statusMsg}
        </div>
      ) : null}
      {savedUrl ? (
        <div className="shrink-0 border-b border-emerald-200 bg-emerald-50 px-3 py-2 text-xs break-all text-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-100">
          Video URL: {savedUrl}
          <button type="button" className="ml-2 underline" onClick={() => void copyVideoUrl()}>
            Copy
          </button>
        </div>
      ) : null}

      <div ref={wrapRef} className="relative min-h-0 min-w-0 flex-1">
        <div className="absolute inset-0 grid grid-cols-1 gap-0 overflow-auto md:grid-cols-2">
          <div
            className="overflow-auto border-r border-border bg-background px-6 py-6 font-serif text-[15px] leading-relaxed text-foreground select-none"
            style={{ pointerEvents: columnPointerEvents }}
          >
            <div dangerouslySetInnerHTML={{ __html: leftHtml || "<p></p>" }} />
          </div>
          <div
            className="overflow-auto bg-background px-6 py-6 font-serif text-[15px] leading-relaxed text-foreground select-none"
            style={{ pointerEvents: columnPointerEvents }}
          >
            <div dangerouslySetInnerHTML={{ __html: stemHtml || "<p></p>" }} />
            <ol className="mt-4 list-none space-y-3 pl-0">
              {rows.map((row) => (
                <li key={row.letter} className="flex gap-2">
                  <span className="font-semibold">{row.letter}.</span>
                  <div className="min-w-0 flex-1" dangerouslySetInnerHTML={{ __html: row.html || "" }} />
                </li>
              ))}
            </ol>
          </div>
        </div>

        <canvas ref={staticCanvasRef} className="absolute inset-0 z-10 touch-none pointer-events-none" aria-hidden />
        <canvas
          ref={previewCanvasRef}
          className={`absolute inset-0 z-[15] ${canvasPointerClass} ${
            annotateMode && annState.tool !== "select" && annState.tool !== "text"
              ? "cursor-crosshair"
              : annotateMode && annState.tool === "text"
                ? "cursor-text"
                : annotateMode && annState.tool === "select"
                  ? "cursor-default"
                  : ""
          }`}
          onPointerDown={onPointerDownCanvas}
        />

        <div className={`absolute inset-0 z-[25] ${textLayerPointer}`}>
          {annState.annotations
            .filter((a): a is TextAnnotation => a.kind === "text")
            .map((t) => (
              <AnnotationTextBox
                key={t.id}
                ann={t}
                selected={annState.selectedId === t.id}
                editing={editingTextId === t.id}
                onCommit={(id, html) => {
                  if (!html.trim()) {
                    deleteAnn(id)
                  } else {
                    update(id, { html }, false)
                  }
                  setEditingTextId(null)
                }}
                onCancel={(id) => {
                  const cur = annotationsRef.current.find((x) => x.id === id && x.kind === "text") as TextAnnotation | undefined
                  if (cur && !cur.html.trim()) {
                    deleteAnn(id)
                  }
                  setEditingTextId(null)
                }}
                onSelect={(id) => {
                  select(id)
                  if (annState.tool === "text") {
                    setEditingTextId(id)
                  }
                }}
                onBeginSelectDrag={beginSelectDragFromText}
              />
            ))}
        </div>
      </div>

      {toastMsg ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed bottom-6 left-1/2 z-[100] max-w-[min(90vw,24rem)] -translate-x-1/2 rounded-md border border-border bg-foreground px-4 py-2 text-center text-sm text-background shadow-lg"
        >
          {toastMsg}
        </div>
      ) : null}
    </div>
  )
}

export { AdminQuestionVideoRecordPage }
