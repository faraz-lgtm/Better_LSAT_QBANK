/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  /** Set to `"1"` to allow unauthenticated PrepTest UI outside production (see `prep-test-ui-preview.ts`). */
  readonly VITE_STUDENT_UI_PREVIEW?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
