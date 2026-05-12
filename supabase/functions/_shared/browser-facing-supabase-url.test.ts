import { assertEquals } from "jsr:@std/assert@1"

import { browserFacingSupabaseApiBaseUrl } from "./browser-facing-supabase-url.ts"

Deno.test("browserFacingSupabaseApiBaseUrl prefers explicit SUPABASE_PUBLIC_URL", () => {
  const prevUrl = Deno.env.get("SUPABASE_URL")
  const prevPub = Deno.env.get("SUPABASE_PUBLIC_URL")
  try {
    Deno.env.set("SUPABASE_URL", "http://kong:8000")
    Deno.env.set("SUPABASE_PUBLIC_URL", "https://myproj.supabase.co/")
    assertEquals(browserFacingSupabaseApiBaseUrl(), "https://myproj.supabase.co")
  } finally {
    if (prevUrl === undefined) Deno.env.delete("SUPABASE_URL")
    else Deno.env.set("SUPABASE_URL", prevUrl)
    if (prevPub === undefined) Deno.env.delete("SUPABASE_PUBLIC_URL")
    else Deno.env.set("SUPABASE_PUBLIC_URL", prevPub)
  }
})

Deno.test("browserFacingSupabaseApiBaseUrl rewrites kong host to localhost", () => {
  const prevUrl = Deno.env.get("SUPABASE_URL")
  const prevPub = Deno.env.get("SUPABASE_PUBLIC_URL")
  const prevPort = Deno.env.get("SUPABASE_PUBLIC_API_PORT")
  try {
    Deno.env.delete("SUPABASE_PUBLIC_URL")
    Deno.env.delete("PUBLIC_SUPABASE_URL")
    Deno.env.set("SUPABASE_URL", "http://kong:8000")
    Deno.env.delete("SUPABASE_PUBLIC_API_PORT")
    assertEquals(browserFacingSupabaseApiBaseUrl(), "http://127.0.0.1:54321")
    Deno.env.set("SUPABASE_PUBLIC_API_PORT", "9999")
    assertEquals(browserFacingSupabaseApiBaseUrl(), "http://127.0.0.1:9999")
  } finally {
    if (prevUrl === undefined) Deno.env.delete("SUPABASE_URL")
    else Deno.env.set("SUPABASE_URL", prevUrl)
    if (prevPub === undefined) Deno.env.delete("SUPABASE_PUBLIC_URL")
    else Deno.env.set("SUPABASE_PUBLIC_URL", prevPub)
    if (prevPort === undefined) Deno.env.delete("SUPABASE_PUBLIC_API_PORT")
    else Deno.env.set("SUPABASE_PUBLIC_API_PORT", prevPort)
  }
})

Deno.test("browserFacingSupabaseApiBaseUrl leaves normal HTTPS URLs unchanged", () => {
  const prevUrl = Deno.env.get("SUPABASE_URL")
  const prevPub = Deno.env.get("SUPABASE_PUBLIC_URL")
  try {
    Deno.env.delete("SUPABASE_PUBLIC_URL")
    Deno.env.set("SUPABASE_URL", "https://abc.supabase.co")
    assertEquals(browserFacingSupabaseApiBaseUrl(), "https://abc.supabase.co")
  } finally {
    if (prevUrl === undefined) Deno.env.delete("SUPABASE_URL")
    else Deno.env.set("SUPABASE_URL", prevUrl)
    if (prevPub === undefined) Deno.env.delete("SUPABASE_PUBLIC_URL")
    else Deno.env.set("SUPABASE_PUBLIC_URL", prevPub)
  }
})
