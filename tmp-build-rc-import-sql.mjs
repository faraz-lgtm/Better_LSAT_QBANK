import { readFileSync, writeFileSync } from "node:fs"

const payload = readFileSync("tmp-rc-passage-import-payload.json", "utf8")
// Avoid terminator collision
if (payload.includes("$rcjson$")) {
  throw new Error("payload contains $rcjson$ terminator")
}

const sql = `-- RC passage explanations import (passages + published analyses + P1..Pn segments)
do $import$
declare
  payload jsonb := $rcjson$
${payload}
$rcjson$::jsonb;
  item jsonb;
  para jsonb;
  sec uuid;
  pass_id uuid;
  analysis_id uuid;
  next_ver int;
  created_passages int := 0;
  created_analyses int := 0;
begin
  for item in select * from jsonb_array_elements(payload)
  loop
    for sec in
      select distinct q.section_id
      from public.admin_questions q
      where q.source_group_id = item->>'sourceGroupId'
        and q.section_id is not null
    loop
      select p.id into pass_id
      from public.admin_passages p
      where p.section_id = sec
        and p.source_group_id = item->>'sourceGroupId'
      limit 1;

      if pass_id is null then
        insert into public.admin_passages (section_id, source_group_id, content)
        values (sec, item->>'sourceGroupId', item->>'passageHtml')
        returning id into pass_id;
        created_passages := created_passages + 1;
      else
        update public.admin_passages
        set content = coalesce(nullif(item->>'passageHtml', ''), content),
            updated_at = now()
        where id = pass_id
          and (content is null or length(trim(content)) = 0);
      end if;

      select coalesce(max(a.version), 0) + 1 into next_ver
      from public.admin_passage_analyses a
      where a.passage_id = pass_id;

      update public.admin_passage_analyses
      set status = 'draft', updated_at = now()
      where passage_id = pass_id and status = 'published';

      insert into public.admin_passage_analyses (passage_id, version, status, overall_html)
      values (
        pass_id,
        next_ver,
        'published',
        nullif(item->>'overallHtml', '')
      )
      returning id into analysis_id;

      for para in select * from jsonb_array_elements(item->'paragraphs')
      loop
        insert into public.admin_passage_analysis_segments (
          analysis_id, sort_order, part_label, segment_type, title, text_excerpt, explanation
        ) values (
          analysis_id,
          (para->>'index')::int,
          para->>'label',
          'other',
          para->>'label',
          coalesce(para->>'textExcerpt', para->>'label'),
          para->>'explanationHtml'
        );
      end loop;

      created_analyses := created_analyses + 1;
    end loop;
  end loop;

  raise notice 'created_passages=% created_analyses=%', created_passages, created_analyses;
end;
$import$;

select
  (select count(*)::int from public.admin_passages where source_group_id like 'RC-%') as passages,
  (select count(*)::int from public.admin_passage_analyses where status = 'published') as published_analyses,
  (select count(*)::int from public.admin_passage_analysis_segments) as segments;
`

writeFileSync("tmp-rc-passage-import.sql", sql, "utf8")
console.log(`Wrote SQL (${sql.length} chars)`)
