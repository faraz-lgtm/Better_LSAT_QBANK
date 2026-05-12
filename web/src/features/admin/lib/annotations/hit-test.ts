import { arrowHeadGeometry } from "./draw"
import type { Annotation, PenAnnotation, ShapeAnnotation, TextAnnotation } from "./types"

const LINE_HIT = 10

function distToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1
  const dy = y2 - y1
  const lenSq = dx * dx + dy * dy
  if (lenSq < 1e-6) return Math.hypot(px - x1, py - y1)
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  const qx = x1 + t * dx
  const qy = y1 + t * dy
  return Math.hypot(px - qx, py - qy)
}

function hitPolyline(points: Array<{ x: number; y: number }>, px: number, py: number, tol: number): boolean {
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!
    const b = points[i]!
    if (distToSegment(px, py, a.x, a.y, b.x, b.y) <= tol) return true
  }
  return false
}

function hitPen(ann: PenAnnotation, px: number, py: number): boolean {
  const tol = Math.max(ann.width / 2 + 6, 8)
  if (ann.points.length === 1) {
    const p = ann.points[0]!
    return Math.hypot(px - p.x, py - p.y) <= tol
  }
  return hitPolyline(ann.points, px, py, tol)
}

function hitRect(
  start: { x: number; y: number },
  end: { x: number; y: number },
  px: number,
  py: number,
  pad: number,
): boolean {
  const minX = Math.min(start.x, end.x)
  const minY = Math.min(start.y, end.y)
  const maxX = Math.max(start.x, end.x)
  const maxY = Math.max(start.y, end.y)
  if (px < minX - pad || px > maxX + pad || py < minY - pad || py > maxY + pad) return false
  const w = maxX - minX
  const h = maxY - minY
  if (w <= pad * 2 || h <= pad * 2) return true
  const onLeft = Math.abs(px - minX) <= pad && py >= minY - pad && py <= maxY + pad
  const onRight = Math.abs(px - maxX) <= pad && py >= minY - pad && py <= maxY + pad
  const onTop = Math.abs(py - minY) <= pad && px >= minX - pad && px <= maxX + pad
  const onBottom = Math.abs(py - maxY) <= pad && px >= minX - pad && px <= maxX + pad
  return onLeft || onRight || onTop || onBottom
}

function hitEllipse(
  start: { x: number; y: number },
  end: { x: number; y: number },
  px: number,
  py: number,
  pad: number,
): boolean {
  const cx = (start.x + end.x) / 2
  const cy = (start.y + end.y) / 2
  const rx = Math.abs(end.x - start.x) / 2 + pad
  const ry = Math.abs(end.y - start.y) / 2 + pad
  if (rx < 1 || ry < 1) return Math.hypot(px - cx, py - cy) <= Math.max(rx, ry, 8)
  const nx = (px - cx) / rx
  const ny = (py - cy) / ry
  const d = Math.hypot(nx, ny)
  return d >= 0.92 && d <= 1.08
}

function hitLine(start: { x: number; y: number }, end: { x: number; y: number }, px: number, py: number, width: number): boolean {
  return distToSegment(px, py, start.x, start.y, end.x, end.y) <= Math.max(width / 2 + 6, LINE_HIT)
}

function pointInTriangle(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
): boolean {
  const sign = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) =>
    (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3)
  const d1 = sign(px, py, ax, ay, bx, by)
  const d2 = sign(px, py, bx, by, cx, cy)
  const d3 = sign(px, py, cx, cy, ax, ay)
  const neg = d1 < 0 || d2 < 0 || d3 < 0
  const pos = d1 > 0 || d2 > 0 || d3 > 0
  return !(neg && pos)
}

function hitArrow(ann: ShapeAnnotation, px: number, py: number): boolean {
  if (ann.kind !== "arrow") return false
  const headLen = Math.max(12, ann.width * 4)
  const { tip, left, right } = arrowHeadGeometry(ann.start, ann.end, headLen)
  if (pointInTriangle(px, py, tip.x, tip.y, left.x, left.y, right.x, right.y)) return true
  const dx = ann.end.x - ann.start.x
  const dy = ann.end.y - ann.start.y
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const baseX = ann.end.x - ux * headLen
  const baseY = ann.end.y - uy * headLen
  return distToSegment(px, py, ann.start.x, ann.start.y, baseX, baseY) <= Math.max(ann.width / 2 + 6, LINE_HIT)
}

function hitText(ann: TextAnnotation, px: number, py: number): boolean {
  const { x, y } = ann.position
  const w = Math.max(ann.width, 40)
  const h = Math.max(ann.fontSize * 3, 24)
  return px >= x && px <= x + w && py >= y && py <= y + h
}

function hitShape(ann: ShapeAnnotation, px: number, py: number): boolean {
  const pad = ann.width / 2 + 6
  switch (ann.kind) {
    case "rect":
      return hitRect(ann.start, ann.end, px, py, pad)
    case "ellipse":
      return hitEllipse(ann.start, ann.end, px, py, pad)
    case "line":
      return hitLine(ann.start, ann.end, px, py, ann.width)
    case "arrow":
      return hitArrow(ann, px, py)
  }
}

/** Top-most annotation under point (last in array wins). */
export function hitTest(annotations: Annotation[], px: number, py: number): Annotation | null {
  for (let i = annotations.length - 1; i >= 0; i--) {
    const ann = annotations[i]!
    if (ann.kind === "text") {
      if (hitText(ann, px, py)) return ann
      continue
    }
    if (ann.kind === "pen" || ann.kind === "highlight") {
      if (hitPen(ann, px, py)) return ann
      continue
    }
    if (hitShape(ann as ShapeAnnotation, px, py)) return ann
  }
  return null
}
