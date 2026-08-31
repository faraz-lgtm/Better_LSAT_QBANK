import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"

const payload = JSON.parse(readFileSync("tmp-rc-passage-import-payload.json", "utf8"))
mkdirSync("tmp-rc-sql-chunks", { recursive: true })

function sqlLiteral(s) {
  return "'" + String(s).replace(/'/g, "''") + "'"
}

for (const item of payload) {
  const segmentInserts = item.paragraphs
    .map(
      (p) => `
    insert into public.admin_passage_analysis_segments (
      analysis_id, sort_order, part_label, segment_type, title, text_excerpt, explanation
    ) values (
      analysis_id, ${p.index}, ${sqlLiteral(p.label)}, 'other', ${sqlLiteral(p.label)},
      ${sqlLiteral(p.textExcerpt)}, ${sqlLiteral(p.explanationHtml)}
    );`,
    )
    .join("\n")

  const sql = `do $chunk$
declare
  sec uuid;
  pass_id uuid;
  analysis_id uuid;
  next_ver int;
  passage_body text;
begin
  select q.stimulus_text into passage_body
  from public.admin_questions q
  where q.source_group_id = ${sqlLiteral(item.sourceGroupId)}
    and q.stimulus_text is not null
    and length(trim(q.stimulus_text)) > 0
  limit 1;

  if passage_body is null then
    passage_body := ${sqlLiteral(item.passageHtml)};
  end if;

  for sec in
    select distinct q.section_id
    from public.admin_questions q
    where q.source_group_id = ${sqlLiteral(item.sourceGroupId)}
      and q.section_id is not null
  loop
    select p.id into pass_id
    from public.admin_passages p
    where p.section_id = sec
      and p.source_group_id = ${sqlLiteral(item.sourceGroupId)}
    limit 1;

    if pass_id is null then
      insert into public.admin_passages (section_id, source_group_id, content)
      values (sec, ${sqlLiteral(item.sourceGroupId)}, passage_body)
      returning id into pass_id;
    else
      update public.admin_passages
      set content = coalesce(nullif(content, ''), passage_body),
          updated_at = now()
      where id = pass_id;
    end if;

    -- Replace any existing published analysis for a clean import.
    delete from public.admin_passage_analyses
    where passage_id = pass_id;

    insert into public.admin_passage_analyses (passage_id, version, status, overall_html)
    values (pass_id, 1, 'published', nullif(${sqlLiteral(item.overallHtml)}, ''))
    returning id into analysis_id;
${segmentInserts}
  end loop;
end;
$chunk$;`

  const path = join("tmp-rc-sql-chunks", `${item.sourceGroupId}.sql`)
  writeFileSync(path, sql, "utf8")
  console.log(item.sourceGroupId, sql.length)
}
