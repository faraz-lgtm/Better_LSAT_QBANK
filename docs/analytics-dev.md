# Analytics and practice API (local dev)

Edge Functions under `practice-*` (writes) and `analytics-*` (reads) require a logged-in student JWT. The web app uses `supabase.functions.invoke` with the user session.

## Prerequisites

- `supabase start` (or a linked project) with migrations applied, including `practice_sessions` and `answer_events`.
- Seed data includes `admin_prep_tests`, `admin_sections`, and `admin_questions` (see `supabase/seed.sql` for module `LSAC900`).

## Finding IDs in SQL Studio

```sql
select id, title from admin_prep_tests where module_id = 'LSAC900' limit 1;
select id, section_id, section_type from admin_sections
  where module_id = 'LSAC900' and section_id = 'SEED900-LR-1' limit 1;
select id, source_item_id from admin_questions
  where source_item_id = 'seed-900-lr-q1' limit 1;
```

## Example: curl against local functions

Replace `USER_JWT`, `PREP_TEST_ID`, `QUESTION_ID`, and `SESSION_ID` with real UUIDs from your DB. Replace `ANON_KEY` with the local anon key from `supabase status`.

**Create a PrepTest session**

```bash
curl -sS -X POST 'http://127.0.0.1:54321/functions/v1/practice-create-session' \
  -H "Authorization: Bearer USER_JWT" \
  -H "apikey: ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"kind":"PREPTEST","prepTestId":"PREP_TEST_ID"}'
```

**Submit an answer**

```bash
curl -sS -X POST 'http://127.0.0.1:54321/functions/v1/practice-submit-answer' \
  -H "Authorization: Bearer USER_JWT" \
  -H "apikey: ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"SESSION_ID","questionId":"QUESTION_ID","selectedAnswer":"C"}'
```

**Complete the session** (computes raw score; scaled/percentile only if `admin_score_rows` exist for that PrepTest)

```bash
curl -sS -X POST 'http://127.0.0.1:54321/functions/v1/practice-complete-session' \
  -H "Authorization: Bearer USER_JWT" \
  -H "apikey: ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"SESSION_ID"}'
```

**Read analytics overview** (POST body matches what the web client sends; GET with query params is also supported on each `analytics-*` function)

```bash
curl -sS -X POST 'http://127.0.0.1:54321/functions/v1/analytics-overview' \
  -H "Authorization: Bearer USER_JWT" \
  -H "apikey: ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Other read endpoints: `analytics-trajectory`, `analytics-priorities`, `analytics-sessions`, `analytics-kind-breakdown` (requires `"sessionKind":"DRILL"` or `SECTION` / `PREPTEST` in the body or query string). Student explanations library: `prep-explanations-list` (PrepTest questions with admin-authored explanation or video), `prep-explanation-detail` (requires `questionId`; no practice-history requirement).
