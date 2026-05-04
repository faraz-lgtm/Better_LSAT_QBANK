/** Strip script tags before rendering admin HTML. */
export function sanitizeAdminHtml(input: unknown): string {
  if (typeof input !== "string") return ""
  return input.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
}
