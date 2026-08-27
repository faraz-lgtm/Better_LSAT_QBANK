do $chunk$
declare
  sec uuid;
  pass_id uuid;
  analysis_id uuid;
  next_ver int;
  passage_body text;
begin
  select q.stimulus_text into passage_body
  from public.admin_questions q
  where q.source_group_id = 'RC-Z018'
    and q.stimulus_text is not null
    and length(trim(q.stimulus_text)) > 0
  limit 1;

  if passage_body is null then
    passage_body := '<p style=''text-indent: 1em;''>Two impressive studies have reexamined Eric Williams'' conclusion that Britain''s abolition of the slave trade in 1807 and its emancipation of slaves in its colonies in 1834 were driven primarily by economic rather than humanitarian motives. Blighted by depleted soil, indebtedness, and the inefficiency of coerced labor, these colonies, according to Williams, had by 1807 become an impediment to British economic progress.</p><p style=''text-indent: 1em;''>Seymour Drescher provides a more balanced view. Rejecting interpretations based either on economic interest or the moral vision of abolitionists, Drescher has reconstructed the populist characteristics of British abolitionism, which appears to have cut across lines of class, party, and religion. Noting that between 1780 and 1830 antislavery petitions outnumbered those on any other issue, including parliamentary reform, Drescher concludes that such support cannot be explained by economic interest alone, especially when much of it came from the unenfranchised masses. Yet, aside from demonstrating that such support must have resulted at least in part from widespread literacy and a tradition of political activism, Drescher does not finally explain how England, a nation deeply divided by class struggles, could mobilize popular support for antislavery measures proposed by otherwise conservative politicians in the House of Lords and approved there with little dissent.</p><p style=''text-indent: 1em;''>David Eltis'' answer to that question actually supports some of Williams'' insights. Eschewing Drescher''s idealization of British traditions of liberty, Eltis points to continuing use of low wages and Draconian vagrancy laws in the seventeenth and eighteenth centuries to ensure the industriousness of British workers. Indeed, <lr data-itemid=''HN001562''>certain notables</lr> even called for the enslavement of unemployed laborers who roamed the British countryside—an acceptance of coerced labor that Eltis attributes to a preindustrial desire to keep labor costs low and exports competitive. By the late eighteenth century, however, a growing home market began to alert capitalists to the importance of "want creation" and to incentives such as higher wages as a means of increasing both worker productivity and the number of consumers. Significantly, it was products grown by slaves, such as sugar, coffee, and tobacco, that stimulated new wants at all levels of British society and were the forerunners of products intended in modern capitalist societies to satisfy what Eltis describes as "nonsubsistence or psychological needs." Eltis concludes that in an economy that had begun to rely on voluntary labor to satisfy such needs, forced labor necessarily began to appear both inappropriate and counterproductive to employers. Eltis thus concludes that, while Williams may well have underestimated the economic viability of the British colonies employing forced labor in the early 1800s, his insight into the economic motives for abolition was partly accurate. British leaders became committed to colonial labor reform only when they became convinced, for reasons other than those cited by Williams, that free labor was more beneficial to the imperial economy.</p>';
  end if;

  for sec in
    select distinct q.section_id
    from public.admin_questions q
    where q.source_group_id = 'RC-Z018'
      and q.section_id is not null
  loop
    select p.id into pass_id
    from public.admin_passages p
    where p.section_id = sec
      and p.source_group_id = 'RC-Z018'
    limit 1;

    if pass_id is null then
      insert into public.admin_passages (section_id, source_group_id, content)
      values (sec, 'RC-Z018', passage_body)
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
    values (pass_id, 1, 'published', nullif('<p>The passage examines two studies reassessing Eric Williams''s claim that Britain abolished the slave trade and emancipated colonial slaves for economic rather than humanitarian reasons, presenting Seymour Drescher''s populist account of abolitionism as balanced but incomplete and David Eltis''s argument — that a consumer economy built partly on slave-grown goods made forced labor look counterproductive to employers — as the account that both fills Drescher''s gap and partly vindicates Williams. The author''s purpose is to survey and weigh scholarship rather than to advance an independent thesis, taking each scholar in turn and noting what each explains and fails to explain. The four viewpoints to keep distinct are Williams''s, Drescher''s, Eltis''s, and the author''s assessment of all three.</p>', ''))
    returning id into analysis_id;

    insert into public.admin_passage_analysis_segments (
      analysis_id, sort_order, part_label, segment_type, title, text_excerpt, explanation
    ) values (
      analysis_id, 1, 'P1', 'other', 'P1',
      'Two impressive studies have reexamined Eric Williams'' conclusion that Britain''s abolition of the slave trade in 1807 and its emancipation of slaves in its colonies in 1834 were driven primarily by economic rather than humanitarian motives. Blighted by depleted soil, indebtedness, and the inefficiency of coerced labor, these colonies, according to Williams, had by 1807 become an impediment to British economic progress.', '<p>The opening paragraph names the position two later studies will reexamine, and getting it fixed now makes the rest of the passage manageable. <strong>Eric Williams</strong> concluded that Britain abolished the slave trade in 1807 and emancipated slaves in its colonies in 1834 for economic rather than humanitarian reasons: by 1807 the colonies, ruined by depleted soil, debt and the inefficiency of coerced labor, had become a drag on British economic progress. Everything that follows measures two scholars against this claim, so track which parts of Williams each one accepts.</p>'
    );

    insert into public.admin_passage_analysis_segments (
      analysis_id, sort_order, part_label, segment_type, title, text_excerpt, explanation
    ) values (
      analysis_id, 2, 'P2', 'other', 'P2',
      'Seymour Drescher provides a more balanced view. Rejecting interpretations based either on economic interest or the moral vision of abolitionists, Drescher has reconstructed the populist characteristics of British abolitionism, which appears to have cut across lines of class, party, and religion. Noting that between 1780 and 1830 antislavery petitions outnumbered those on any other issue, including parliamentary reform, Drescher concludes that such support cannot be explained by economic interest alone, especially when much of it came from the unenfranchised masses. Yet, aside from demonstrating that such support must have resulted at least in part from widespread literacy and a tradition of political activism, Drescher does not finally explain how England, a nation deeply divided by class struggles, could mobilize popular support for antislavery measures proposed by otherwise conservative politicians in the House of Lords and approved there with little dissent.', '<p><strong>Seymour Drescher</strong> is credited with a more balanced view, rejecting explanations built either on economic interest or on the abolitionists'' moral vision. His contribution is to have reconstructed British abolitionism as a populist movement cutting across class, party and religion — with antislavery petitions outnumbering those on any other issue, parliamentary reform included, between 1780 and 1830, much of that support coming from people without the vote, which economic interest alone cannot explain. The author then marks the limit of the argument: beyond attributing this to widespread literacy and a tradition of political activism, Drescher never explains how a nation so divided by class struggle mobilized popular support for measures that conservative politicians proposed and the House of Lords approved with little dissent.</p>'
    );

    insert into public.admin_passage_analysis_segments (
      analysis_id, sort_order, part_label, segment_type, title, text_excerpt, explanation
    ) values (
      analysis_id, 3, 'P3', 'other', 'P3',
      'David Eltis'' answer to that question actually supports some of Williams'' insights. Eschewing Drescher''s idealization of British traditions of liberty, Eltis points to continuing use of low wages and Draconian vagrancy laws in the seventeenth and eighteenth centuries to ensure the industriousness of British workers. Indeed, certain notables even called for the enslavement of unemployed laborers who roamed the British countryside—an acceptance of coerced labor that Eltis attributes to a preindustrial desire to keep labor costs low and exports competitive. By the late eighteenth century, however, a growing home market began to alert capitalists to the importance of "want creation" and to incentives such as higher wages as a means of increasing both worker productivity and the number of consumers. Significantly, it was products grown by slaves, such as sugar, coffee, and tobacco, that stimulated new wants at all levels of British society and were the forerunners of products intended in modern capitalist societies to satisfy what Eltis describes as "nonsubsistence or psychological needs." Eltis concludes that in an economy that had begun to rely on voluntary labor to satisfy such needs, forced labor necessarily began to appear both inappropriate and counterproductive to employers. Eltis thus concludes that, while Williams may well have underestimated the economic viability of the British colonies employing forced labor in the early 1800s, his insight into the economic motives for abolition was partly accurate. British leaders became committed to colonial labor reform only when they became convinced, for reasons other than those cited by Williams, that free labor was more beneficial to the imperial economy.', '<p><strong>David Eltis</strong> answers that unanswered question, and in doing so partly rehabilitates Williams. Rejecting Drescher''s idealized British traditions of liberty, Eltis points to low wages and harsh vagrancy laws long used to keep British workers industrious, and to notables who called for enslaving unemployed laborers — coerced labor accepted, he argues, to hold costs down and exports competitive. The late eighteenth century changed that calculation: a growing home market taught capitalists the value of want creation and of higher wages as a way to raise productivity and the number of consumers. Pointedly, the goods that created those new wants across British society, sugar, coffee and tobacco, were slave-grown. Once the economy relied on voluntary labor to satisfy such needs, forced labor started to look inappropriate and counterproductive — so Williams underestimated the colonies'' economic viability but was partly right about the economic motive, though for reasons he did not identify.</p>'
    );
  end loop;
end;
$chunk$;