import { useEffect, useState } from "react"
import { ExternalLink, Map } from "lucide-react"

import { Button } from "@/components/ui/button"
import { StudentMain } from "@/features/student/components/student-main"
import {
  isProduktlyRoadmapEditIdUrl,
  PRODUKTLY_ROADMAP_EDIT_ID,
  PRODUKTLY_ROADMAP_PUBLIC_URL,
} from "@/lib/analytics/produktly-widgets"

type RoadmapLoadState = "idle" | "loading" | "ready" | "missing"

function publicIdFromRoadmapUrl(url: string): string | null {
  try {
    const match = new URL(url).pathname.match(/\/roadmap\/[^/]+\/([^/]+)\/?$/)
    return match?.[1] ?? null
  } catch {
    return null
  }
}

function RoadmapUnavailable({
  title,
  body,
}: {
  title: string
  body: string
}) {
  return (
    <StudentMain>
      <div className="mx-auto flex w-full max-w-xl flex-col items-start gap-6 py-2">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--primary-25)] text-[var(--primary)]">
          <Map className="size-6" aria-hidden />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="m-0 text-2xl font-semibold tracking-[-0.02em] text-[var(--color-student-heading)]">
            {title}
          </h1>
          <p className="m-0 text-sm leading-relaxed text-[var(--greyscale-500)]">{body}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" asChild>
          <a
            href={`https://produktly.com/app/roadmaps/edit/${PRODUKTLY_ROADMAP_EDIT_ID}`}
            target="_blank"
            rel="noreferrer"
          >
            Open Produktly roadmap
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </Button>
      </div>
    </StudentMain>
  )
}

function RoadmapPage() {
  const configuredUrl = PRODUKTLY_ROADMAP_PUBLIC_URL
  const [state, setState] = useState<RoadmapLoadState>(() =>
    configuredUrl ? "loading" : "missing",
  )

  useEffect(() => {
    if (!configuredUrl) {
      setState("missing")
      return
    }
    if (isProduktlyRoadmapEditIdUrl(configuredUrl)) {
      setState("missing")
      return
    }

    const publicId = publicIdFromRoadmapUrl(configuredUrl)
    if (!publicId) {
      setState("missing")
      return
    }

    let cancelled = false
    setState("loading")

    void fetch(`https://api.produktly.com/api/public/roadmaps/${publicId}`)
      .then(async (res) => {
        if (cancelled) return
        setState(res.ok ? "ready" : "missing")
      })
      .catch(() => {
        if (!cancelled) setState("missing")
      })

    return () => {
      cancelled = true
    }
  }, [configuredUrl])

  if (state === "missing") {
    return (
      <RoadmapUnavailable
        title="Product roadmap"
        body={`The public roadmap for edit id ${PRODUKTLY_ROADMAP_EDIT_ID} is not reachable yet. In Produktly, open that roadmap → Share / View public page, copy the UUID link (…/roadmap/produktly/<uuid>), then set VITE_PRODUKTLY_ROADMAP_URL to that URL. The numeric edit id alone returns 404.`}
      />
    )
  }

  if (state === "loading" || state === "idle") {
    return (
      <StudentMain>
        <div className="mx-auto flex w-full max-w-xl flex-col gap-2 py-2">
          <h1 className="m-0 text-2xl font-semibold tracking-[-0.02em] text-[var(--color-student-heading)]">
            Product roadmap
          </h1>
          <p className="m-0 text-sm text-[var(--greyscale-500)]">Loading roadmap…</p>
        </div>
      </StudentMain>
    )
  }

  return (
    <StudentMain layout="locked" fullBleed contentClassName="!px-0 !pt-0">
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[color:var(--greyscale-100)] px-5 py-3">
          <p className="m-0 text-sm text-[var(--greyscale-500)]">
            Vote on ideas and see what we are building next.
          </p>
          <Button variant="outline" size="xs" className="shrink-0 gap-1.5" asChild>
            <a href={configuredUrl} target="_blank" rel="noreferrer">
              Open in new tab
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </Button>
        </div>
        <iframe
          title="betterLSAT product roadmap"
          src={configuredUrl}
          className="min-h-0 w-full flex-1 border-0 bg-white"
          allow="clipboard-write"
        />
      </div>
    </StudentMain>
  )
}

export { RoadmapPage }
