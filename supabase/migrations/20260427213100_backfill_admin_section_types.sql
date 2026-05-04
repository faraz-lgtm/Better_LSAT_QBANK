-- Backfill section_type for legacy rows imported before robust inference existed.
-- Idempotent: only updates rows where section_type is NULL.

update public.admin_sections
set section_type = case
  -- Canonical short codes in section identifiers (LSAC/7Sage patterns)
  when coalesce(section_id, '') ~* '^(LA|LB|LR)([:\-\s]|$)' then 'LR'::public.admin_section_type
  when coalesce(section_id, '') ~* '^RC([:\-\s]|$)' then 'RC'::public.admin_section_type
  when coalesce(section_id, '') ~* '^(AR|LG)([:\-\s]|$)' then 'LG'::public.admin_section_type

  -- Named drill/module style identifiers
  when coalesce(section_id, '') ~* 'logical\s*reasoning|^LR' then 'LR'::public.admin_section_type
  when coalesce(section_id, '') ~* 'reading\s*comprehension|^RC' then 'RC'::public.admin_section_type
  when coalesce(section_id, '') ~* 'analytical\s*reasoning|logic\s*games?|^AR|^LG' then 'LG'::public.admin_section_type

  -- Fallback to title patterns where section_id is not descriptive
  when coalesce(title, '') ~* 'logical\s*reasoning|^LR' then 'LR'::public.admin_section_type
  when coalesce(title, '') ~* 'reading\s*comprehension|^RC' then 'RC'::public.admin_section_type
  when coalesce(title, '') ~* 'analytical\s*reasoning|logic\s*games?|^AR|^LG' then 'LG'::public.admin_section_type
  else section_type
end
where section_type is null;
