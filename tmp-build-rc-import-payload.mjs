import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const root = dirname(fileURLToPath(import.meta.url))
const csvPath = join(
  root,
  "BetterLSAT_RC_Passage_Explanations - RC Passage Explanations.csv",
)

function parseCsv(text) {
  const rows = []
  let i = 0
  let field = ""
  let row = []
  let inQuotes = false
  while (i < text.length) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      field += c
      i++
      continue
    }
    if (c === '"') {
      inQuotes = true
      i++
      continue
    }
    if (c === ",") {
      row.push(field)
      field = ""
      i++
      continue
    }
    if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++
      row.push(field)
      field = ""
      if (row.some((x) => x.length)) rows.push(row)
      row = []
      i++
      continue
    }
    field += c
    i++
  }
  if (field.length || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

function extractHtmlParagraphs(html) {
  const matches = html.match(/<p\b[^>]*>[\s\S]*?<\/p>/gi)
  return matches ? [...matches] : []
}

function stripHtmlToText(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
}

const rows = parseCsv(readFileSync(csvPath, "utf8"))
const headers = rows[0]
const data = rows.slice(1).map((r) => Object.fromEntries(headers.map((h, idx) => [h, r[idx] ?? ""])))

const out = []
for (const d of data) {
  const explanationHtml = (d.explanation_html || "").trim()
  if (!explanationHtml) continue
  const sourceGroupId = (d.source_group_id || "").trim()
  if (!sourceGroupId) continue
  const passageHtml = d.passage_html || ""
  const overallHtml = (d.overall_html || "").trim()
  const passagePs = extractHtmlParagraphs(passageHtml)
  const explanationPs = extractHtmlParagraphs(explanationHtml)
  const count = Math.min(passagePs.length, explanationPs.length)
  const paragraphs = []
  for (let i = 0; i < count; i++) {
    if (!explanationPs[i]?.trim()) continue
    paragraphs.push({
      label: `P${i + 1}`,
      index: i + 1,
      explanationHtml: explanationPs[i],
      textExcerpt: stripHtmlToText(passagePs[i] || "") || `Paragraph ${i + 1}`,
    })
  }
  out.push({
    prepTest: (d.prep_test || "").trim(),
    sourceGroupId,
    passageHtml,
    overallHtml,
    paragraphs,
  })
}

const outPath = join(root, "tmp-rc-passage-import-payload.json")
writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8")
console.log(`Wrote ${out.length} rows → ${outPath}`)
