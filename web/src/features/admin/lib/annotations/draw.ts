import type { Annotation, PenAnnotation, ShapeAnnotation } from "./types"

function strokePolyline(
  ctx: CanvasRenderingContext2D,
  points: Array<{ x: number; y: number }>,
  color: string,
  width: number,
  opts?: { globalAlpha?: number; composite?: GlobalCompositeOperation },
) {
  if (points.length < 2) return
  ctx.save()
  if (opts?.globalAlpha != null) ctx.globalAlpha = opts.globalAlpha
  if (opts?.composite) ctx.globalCompositeOperation = opts.composite
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  ctx.beginPath()
  ctx.moveTo(points[0]!.x, points[0]!.y)
  for (let i = 1; i < points.length; i++) {
    const p = points[i]!
    ctx.lineTo(p.x, p.y)
  }
  ctx.stroke()
  ctx.restore()
}

export function drawPen(ctx: CanvasRenderingContext2D, ann: PenAnnotation) {
  if (ann.kind !== "pen") return
  strokePolyline(ctx, ann.points, ann.color, ann.width)
}

export function drawHighlight(ctx: CanvasRenderingContext2D, ann: PenAnnotation) {
  if (ann.kind !== "highlight") return
  strokePolyline(ctx, ann.points, ann.color, ann.width, {
    globalAlpha: 0.38,
    composite: "multiply",
  })
}

export function drawRect(ctx: CanvasRenderingContext2D, ann: ShapeAnnotation) {
  if (ann.kind !== "rect") return
  const x = Math.min(ann.start.x, ann.end.x)
  const y = Math.min(ann.start.y, ann.end.y)
  const w = Math.abs(ann.end.x - ann.start.x)
  const h = Math.abs(ann.end.y - ann.start.y)
  ctx.save()
  ctx.strokeStyle = ann.color
  ctx.lineWidth = ann.width
  ctx.lineJoin = "round"
  ctx.strokeRect(x, y, w, h)
  ctx.restore()
}

export function drawEllipse(ctx: CanvasRenderingContext2D, ann: ShapeAnnotation) {
  if (ann.kind !== "ellipse") return
  const cx = (ann.start.x + ann.end.x) / 2
  const cy = (ann.start.y + ann.end.y) / 2
  const rx = Math.abs(ann.end.x - ann.start.x) / 2
  const ry = Math.abs(ann.end.y - ann.start.y) / 2
  ctx.save()
  ctx.strokeStyle = ann.color
  ctx.lineWidth = ann.width
  ctx.beginPath()
  ctx.ellipse(cx, cy, Math.max(rx, 0.5), Math.max(ry, 0.5), 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

export function drawLine(ctx: CanvasRenderingContext2D, ann: ShapeAnnotation) {
  if (ann.kind !== "line") return
  ctx.save()
  ctx.strokeStyle = ann.color
  ctx.lineWidth = ann.width
  ctx.lineCap = "round"
  ctx.beginPath()
  ctx.moveTo(ann.start.x, ann.start.y)
  ctx.lineTo(ann.end.x, ann.end.y)
  ctx.stroke()
  ctx.restore()
}

/** Arrow from start → end with triangular head at end. Exposed for tests. */
export function arrowHeadGeometry(
  start: { x: number; y: number },
  end: { x: number; y: number },
  headLen: number,
): { tip: { x: number; y: number }; left: { x: number; y: number }; right: { x: number; y: number } } {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const tip = { x: end.x, y: end.y }
  const baseX = end.x - ux * headLen
  const baseY = end.y - uy * headLen
  const perpX = -uy * (headLen * 0.45)
  const perpY = ux * (headLen * 0.45)
  return {
    tip,
    left: { x: baseX + perpX, y: baseY + perpY },
    right: { x: baseX - perpX, y: baseY - perpY },
  }
}

export function drawArrow(ctx: CanvasRenderingContext2D, ann: ShapeAnnotation) {
  if (ann.kind !== "arrow") return
  const headLen = Math.max(12, ann.width * 4)
  const { tip, left, right } = arrowHeadGeometry(ann.start, ann.end, headLen)
  ctx.save()
  ctx.strokeStyle = ann.color
  ctx.fillStyle = ann.color
  ctx.lineWidth = ann.width
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  ctx.beginPath()
  ctx.moveTo(ann.start.x, ann.start.y)
  ctx.lineTo(tip.x, tip.y)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(tip.x, tip.y)
  ctx.lineTo(left.x, left.y)
  ctx.lineTo(right.x, right.y)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

export function drawAnnotation(ctx: CanvasRenderingContext2D, ann: Annotation) {
  if (ann.kind === "pen") {
    drawPen(ctx, ann)
    return
  }
  if (ann.kind === "highlight") {
    drawHighlight(ctx, ann)
    return
  }
  if (ann.kind === "rect") {
    drawRect(ctx, ann)
    return
  }
  if (ann.kind === "ellipse") {
    drawEllipse(ctx, ann)
    return
  }
  if (ann.kind === "line") {
    drawLine(ctx, ann)
    return
  }
  if (ann.kind === "arrow") {
    drawArrow(ctx, ann)
    return
  }
}

export function drawAllAnnotations(ctx: CanvasRenderingContext2D, list: Annotation[]) {
  for (const ann of list) {
    if (ann.kind !== "text") {
      drawAnnotation(ctx, ann)
    }
  }
}

export function drawShapePreview(
  ctx: CanvasRenderingContext2D,
  kind: ShapeAnnotation["kind"],
  start: { x: number; y: number },
  end: { x: number; y: number },
  color: string,
  width: number,
) {
  const ann = { kind, id: "__preview__", color, width, start, end } as ShapeAnnotation
  drawAnnotation(ctx, ann)
}
