
do $chunk$
declare
  sec uuid;
  pass_id uuid;
  analysis_id uuid;
  next_ver int;
begin
  for sec in
    select distinct q.section_id
    from public.admin_questions q
    where q.source_group_id = 'RC-Z061'
      and q.section_id is not null
  loop
    select p.id into pass_id
    from public.admin_passages p
    where p.section_id = sec
      and p.source_group_id = 'RC-Z061'
    limit 1;

    if pass_id is null then
      insert into public.admin_passages (section_id, source_group_id, content)
      values (sec, 'RC-Z061', '<p style=''text-indent: 1em;''>In April 1990 representatives of the Pico Korea Union of electronics workers in Buchon City, South Korea, traveled to the United States in order to demand just settlement of their claims from the parent company of their employer, who upon the formation of the union had shut down operations without paying the workers. From the beginning, the union cause was championed by an unprecedented coalition of Korean American groups and deeply affected the Korean American community on several levels.</p><p style=''text-indent: 1em;''>First, it served as a rallying focus for a diverse community often divided by generation, class, and political ideologies. Most notably, the Pico cause mobilized many young second-generation Korean Americans, many of whom had never been part of a political campaign before, let alone one involving Korean issues. Members of this generation, unlike first-generation Korean Americans, generally fall within the more privileged sectors of the Korean American community and often feel alienated from their Korean roots. In addition to raising the political consciousness of young Korean Americans, the Pico struggle sparked among them new interest in their cultural identity. The Pico workers also suggested new roles that can be played by recent immigrants, particularly working-class immigrants. These immigrants'' knowledge of working conditions overseas can help to globalize the perspective of their communities and can help to establish international ties on a more personal level, as witnessed in the especially warm exchange between the Pico workers and recent working-class immigrants from China. In addition to broadening the political base within the Korean American community, the Pico struggle also led to new alliances between the Korean American community and progressive labor and social justice groups within the larger society—as evidenced in the support received from the Coalition of Labor Union Women and leading African American unionists.</p><p style=''text-indent: 1em;''>The reasons for these effects lie in the nature of the cause. The issues raised by the Pico unionists had such a strong human component that differences within the community became secondary to larger concerns for social justice and workers'' rights. The workers'' demands for compensation and respect were unencumbered with strong ideological trappings. The economic exploitation faced by the Pico workers underscored the common interests of Korean workers, Korean Americans, the working class more inclusively, and a broad spectrum of community leaders.</p><p style=''text-indent: 1em;''>The Pico workers'' campaign thus offers an important lesson. It demonstrates that ethnic communities need more than just a knowledge of history and culture as artifacts of the past in order to strengthen their ethnic identity. It shows that perhaps the most effective means of empowerment for many ethnic communities of immigrant derivation may be an identification with and participation in current struggles for economic and social justice in their countries of origin.</p>')
      returning id into pass_id;
    else
      update public.admin_passages
      set content = coalesce(nullif('<p style=''text-indent: 1em;''>In April 1990 representatives of the Pico Korea Union of electronics workers in Buchon City, South Korea, traveled to the United States in order to demand just settlement of their claims from the parent company of their employer, who upon the formation of the union had shut down operations without paying the workers. From the beginning, the union cause was championed by an unprecedented coalition of Korean American groups and deeply affected the Korean American community on several levels.</p><p style=''text-indent: 1em;''>First, it served as a rallying focus for a diverse community often divided by generation, class, and political ideologies. Most notably, the Pico cause mobilized many young second-generation Korean Americans, many of whom had never been part of a political campaign before, let alone one involving Korean issues. Members of this generation, unlike first-generation Korean Americans, generally fall within the more privileged sectors of the Korean American community and often feel alienated from their Korean roots. In addition to raising the political consciousness of young Korean Americans, the Pico struggle sparked among them new interest in their cultural identity. The Pico workers also suggested new roles that can be played by recent immigrants, particularly working-class immigrants. These immigrants'' knowledge of working conditions overseas can help to globalize the perspective of their communities and can help to establish international ties on a more personal level, as witnessed in the especially warm exchange between the Pico workers and recent working-class immigrants from China. In addition to broadening the political base within the Korean American community, the Pico struggle also led to new alliances between the Korean American community and progressive labor and social justice groups within the larger society—as evidenced in the support received from the Coalition of Labor Union Women and leading African American unionists.</p><p style=''text-indent: 1em;''>The reasons for these effects lie in the nature of the cause. The issues raised by the Pico unionists had such a strong human component that differences within the community became secondary to larger concerns for social justice and workers'' rights. The workers'' demands for compensation and respect were unencumbered with strong ideological trappings. The economic exploitation faced by the Pico workers underscored the common interests of Korean workers, Korean Americans, the working class more inclusively, and a broad spectrum of community leaders.</p><p style=''text-indent: 1em;''>The Pico workers'' campaign thus offers an important lesson. It demonstrates that ethnic communities need more than just a knowledge of history and culture as artifacts of the past in order to strengthen their ethnic identity. It shows that perhaps the most effective means of empowerment for many ethnic communities of immigrant derivation may be an identification with and participation in current struggles for economic and social justice in their countries of origin.</p>', ''), content),
          updated_at = now()
      where id = pass_id;
    end if;

    select coalesce(max(a.version), 0) + 1 into next_ver
    from public.admin_passage_analyses a
    where a.passage_id = pass_id;

    update public.admin_passage_analyses
    set status = 'draft', updated_at = now()
    where passage_id = pass_id and status = 'published';

    insert into public.admin_passage_analyses (passage_id, version, status, overall_html)
    values (pass_id, next_ver, 'published', nullif('<p>The passage uses the 1990 Pico Korea Union campaign in the United States to argue that participating in current social and economic justice struggles in an immigrant community''s country of origin can strengthen ethnic identity more effectively than studying history and culture as artifacts of the past. The author''s purpose is to draw a general lesson from a single case, moving from the events, to the campaign''s several effects on the Korean American community, to why the cause produced them, to the principle they support. The passage is written in the author''s voice throughout, with no competing viewpoints to separate.</p>', ''))
    returning id into analysis_id;

    
    insert into public.admin_passage_analysis_segments (
      analysis_id, sort_order, part_label, segment_type, title, text_excerpt, explanation
    ) values (
      analysis_id, 1, 'P1', 'other', 'P1',
      'In April 1990 representatives of the Pico Korea Union of electronics workers in Buchon City, South Korea, traveled to the United States in order to demand just settlement of their claims from the parent company of their employer, who upon the formation of the union had shut down operations without paying the workers. From the beginning, the union cause was championed by an unprecedented coalition of Korean American groups and deeply affected the Korean American community on several levels.', '<p>The opening paragraph is pure setup and you should read it for the facts rather than for argument. In April 1990 representatives of the Pico Korea Union, electronics workers from Buchon City in South Korea, came to the United States to press their claims against the parent company of an employer that had shut down operations without paying them once the union formed. Two details are load-bearing for everything after: the cause drew an unprecedented coalition of Korean American groups, and it affected the Korean American community on several levels. The rest of the passage unpacks that second phrase.</p>'
    );

    insert into public.admin_passage_analysis_segments (
      analysis_id, sort_order, part_label, segment_type, title, text_excerpt, explanation
    ) values (
      analysis_id, 2, 'P2', 'other', 'P2',
      'First, it served as a rallying focus for a diverse community often divided by generation, class, and political ideologies. Most notably, the Pico cause mobilized many young second-generation Korean Americans, many of whom had never been part of a political campaign before, let alone one involving Korean issues. Members of this generation, unlike first-generation Korean Americans, generally fall within the more privileged sectors of the Korean American community and often feel alienated from their Korean roots. In addition to raising the political consciousness of young Korean Americans, the Pico struggle sparked among them new interest in their cultural identity. The Pico workers also suggested new roles that can be played by recent immigrants, particularly working-class immigrants. These immigrants'' knowledge of working conditions overseas can help to globalize the perspective of their communities and can help to establish international ties on a more personal level, as witnessed in the especially warm exchange between the Pico workers and recent working-class immigrants from China. In addition to broadening the political base within the Korean American community, the Pico struggle also led to new alliances between the Korean American community and progressive labor and social justice groups within the larger society—as evidenced in the support received from the Coalition of Labor Union Women and leading African American unionists.', '<p>This is the passage''s inventory of effects, and the questions will reward keeping the list straight. The cause first gave a community often split by generation, class and ideology something to rally around, most strikingly by mobilizing second-generation Korean Americans, many politically inactive until then, more privileged than the first generation and often distant from their Korean roots — and it awakened their interest in cultural identity. It also revealed a role for recent working-class immigrants, whose firsthand knowledge of overseas working conditions can globalize a community''s outlook and build international ties personally, as with the warm exchange with recent immigrants from China. Finally it produced alliances beyond the community, with progressive labor and social justice groups.</p>'
    );

    insert into public.admin_passage_analysis_segments (
      analysis_id, sort_order, part_label, segment_type, title, text_excerpt, explanation
    ) values (
      analysis_id, 3, 'P3', 'other', 'P3',
      'The reasons for these effects lie in the nature of the cause. The issues raised by the Pico unionists had such a strong human component that differences within the community became secondary to larger concerns for social justice and workers'' rights. The workers'' demands for compensation and respect were unencumbered with strong ideological trappings. The economic exploitation faced by the Pico workers underscored the common interests of Korean workers, Korean Americans, the working class more inclusively, and a broad spectrum of community leaders.', '<p>Having listed the effects, the author now explains them, and the explanation is a single causal claim developed in a few sentences. What made these outcomes possible was the nature of the cause itself: the human element was strong enough that internal community differences receded behind shared concern for social justice and workers'' rights. The workers were asking for compensation and respect, demands carrying no heavy ideological baggage that anyone would have to sign up to. Their economic exploitation exposed interests common to Korean workers, Korean Americans, the working class generally and a wide range of community leaders.</p>'
    );

    insert into public.admin_passage_analysis_segments (
      analysis_id, sort_order, part_label, segment_type, title, text_excerpt, explanation
    ) values (
      analysis_id, 4, 'P4', 'other', 'P4',
      'The Pico workers'' campaign thus offers an important lesson. It demonstrates that ethnic communities need more than just a knowledge of history and culture as artifacts of the past in order to strengthen their ethnic identity. It shows that perhaps the most effective means of empowerment for many ethnic communities of immigrant derivation may be an identification with and participation in current struggles for economic and social justice in their countries of origin.', '<p>The final paragraph draws the lesson the whole passage has been built to support, and it is stated as a general principle rather than a fact about 1990. Knowing history and culture as artifacts of the past is not enough to strengthen an ethnic community''s identity. What may work best for many communities of immigrant derivation is identifying with and taking part in present-day struggles for economic and social justice in their countries of origin. Note the hedge in ''perhaps'' and ''may be'' — the author is proposing, not declaring.</p>'
    );
  end loop;
end;
$chunk$;
