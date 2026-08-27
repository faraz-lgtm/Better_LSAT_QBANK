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
  where q.source_group_id = 'RC-Z025'
    and q.stimulus_text is not null
    and length(trim(q.stimulus_text)) > 0
  limit 1;

  if passage_body is null then
    passage_body := '<p style=''text-indent: 1em;''>Wherever the crime novels of P. D. James are discussed by critics, there is a tendency on the one hand to exaggerate her merits and on the other to castigate her as a genre writer who is getting above herself. Perhaps underlying the debate is that <lr data-itemid=''XC000762''>familiar</lr>, false opposition set up between different kinds of fiction, according to which enjoyable novels are held to be somehow slightly lowbrow, and a novel is not considered true literature unless it is a tiny bit dull.</p><p style=''text-indent: 1em;''>Those commentators who would elevate James''s books to the status of high literature point to her painstakingly constructed characters, her elaborate settings, her sense of place, and her love of abstractions: notions about morality, duty, pain, and pleasure are never far from the lips of her police officers and murderers. Others find her pretentious and tiresome; an <lr data-itemid=''XC000765''>inverted snobbery</lr> accuses her of abandoning the time-honored conventions of the detective genre in favor of a highbrow literary style. The critic Harriet Waugh wants P. D. James to get on with "the more taxing business of laying a tricky trail and then fooling the reader"; Philip Oakes in The Literary Review groans, "Could we please proceed with the business of clapping the handcuffs on the killer?"</p><p style=''text-indent: 1em;''>James is certainly capable of strikingly good writing. She takes immense trouble to provide her characters with convincing histories and passions. Her descriptive digressions are part of the pleasure of her books and give them dignity and weight. But it is equally true that they frequently interfere with the story; the <lr data-itemid=''XC000766''>patinas and aromas of a country kitchen</lr> receive more loving attention than does the plot itself. Her devices to advance the story can be shameless and thin, and it is often impossible to see how her detective arrives at the truth; one is left to conclude that the detective solves crimes through intuition. At this stage in her career P. D. James seems to be less interested in the specifics of detection than in her characters'' vulnerabilities and perplexities.</p><p style=''text-indent: 1em;''>However, once the rules of a chosen genre cramp creative thought, there is no reason why an able and interesting writer should accept them. In her latest book, there are signs that James is beginning to feel constrained by the crime-novel genre. Here her determination to leave areas of ambiguity in the solution of the crime and to distribute guilt among the murderer, victim, and bystanders points to a conscious rebellion against the traditional neatness of detective fiction. It is fashionable, though reprehensible, for one writer to prescribe to another. But perhaps the time has come for P. D. James to slide out of her handcuffs and stride into the territory of the mainstream novel.</p>';
  end if;

  for sec in
    select distinct q.section_id
    from public.admin_questions q
    where q.source_group_id = 'RC-Z025'
      and q.section_id is not null
  loop
    select p.id into pass_id
    from public.admin_passages p
    where p.section_id = sec
      and p.source_group_id = 'RC-Z025'
    limit 1;

    if pass_id is null then
      insert into public.admin_passages (section_id, source_group_id, content)
      values (sec, 'RC-Z025', passage_body)
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
    values (pass_id, 1, 'published', nullif('<p>The passage argues that the critical quarrel over whether P. D. James is a literary novelist or an overreaching genre writer rests on a false opposition, offers a two-sided assessment in which her fine writing and rich characterization genuinely do come at the expense of plot and detection, and concludes that she has outgrown the crime novel and should move into mainstream fiction. The author''s purpose is to evaluate and finally to advise, moving from the terms of the debate, to the two critical camps, to the author''s own balanced verdict, to the recommendation. The viewpoints to track are the critics who elevate James, the detractors including Harriet Waugh and Philip Oakes, and the author, who sides fully with neither.</p>', ''))
    returning id into analysis_id;

    insert into public.admin_passage_analysis_segments (
      analysis_id, sort_order, part_label, segment_type, title, text_excerpt, explanation
    ) values (
      analysis_id, 1, 'P1', 'other', 'P1',
      'Wherever the crime novels of P. D. James are discussed by critics, there is a tendency on the one hand to exaggerate her merits and on the other to castigate her as a genre writer who is getting above herself. Perhaps underlying the debate is that familiar , false opposition set up between different kinds of fiction, according to which enjoyable novels are held to be somehow slightly lowbrow, and a novel is not considered true literature unless it is a tiny bit dull.', '<p>The opening paragraph frames a critical quarrel and diagnoses what is wrong with it. Critics discussing P. D. James''s crime novels tend to split between overpraising her and scolding her as a genre writer with pretensions above her station. The author suggests both camps are working from the same bad assumption — the familiar and, in the author''s word, false opposition that treats enjoyable novels as slightly lowbrow and withholds the label of true literature from anything that is not a little dull. Notice that the author''s target here is the framing of the debate itself, which sets up the balanced verdict to come.</p>'
    );

    insert into public.admin_passage_analysis_segments (
      analysis_id, sort_order, part_label, segment_type, title, text_excerpt, explanation
    ) values (
      analysis_id, 2, 'P2', 'other', 'P2',
      'Those commentators who would elevate James''s books to the status of high literature point to her painstakingly constructed characters, her elaborate settings, her sense of place, and her love of abstractions: notions about morality, duty, pain, and pleasure are never far from the lips of her police officers and murderers. Others find her pretentious and tiresome; an inverted snobbery accuses her of abandoning the time-honored conventions of the detective genre in favor of a highbrow literary style. The critic Harriet Waugh wants P. D. James to get on with "the more taxing business of laying a tricky trail and then fooling the reader"; Philip Oakes in The Literary Review groans, "Could we please proceed with the business of clapping the handcuffs on the killer?"', '<p>The two camps get laid out in turn. <strong>The elevators</strong> point to James''s painstakingly built characters, elaborate settings, sense of place and fondness for abstractions, with morality, duty, pain and pleasure always near the lips of her police officers and murderers. <strong>The detractors</strong> find her pretentious and tiresome, and the author characterizes their position as an inverted snobbery that accuses her of dropping the genre''s time-honored conventions for a highbrow style. Two are quoted: Harriet Waugh wants her to get on with laying a tricky trail and fooling the reader, and Philip Oakes wants the handcuffs on the killer. Both critics belong to the detractor camp.</p>'
    );

    insert into public.admin_passage_analysis_segments (
      analysis_id, sort_order, part_label, segment_type, title, text_excerpt, explanation
    ) values (
      analysis_id, 3, 'P3', 'other', 'P3',
      'James is certainly capable of strikingly good writing. She takes immense trouble to provide her characters with convincing histories and passions. Her descriptive digressions are part of the pleasure of her books and give them dignity and weight. But it is equally true that they frequently interfere with the story; the patinas and aromas of a country kitchen receive more loving attention than does the plot itself. Her devices to advance the story can be shameless and thin, and it is often impossible to see how her detective arrives at the truth; one is left to conclude that the detective solves crimes through intuition. At this stage in her career P. D. James seems to be less interested in the specifics of detection than in her characters'' vulnerabilities and perplexities.', '<p>Now the author''s own assessment arrives, and it deliberately splits the difference. On the credit side, James writes strikingly well, takes real trouble over her characters'' histories and passions, and offers descriptive digressions that are part of the pleasure and give the books dignity and weight. On the debit side, those same digressions frequently get in the story''s way — a country kitchen''s patinas and aromas get more loving attention than the plot — her devices for advancing the story can be shameless and thin, and how the detective reaches the truth is often invisible, leaving intuition as the only explanation. The paragraph''s conclusion is diagnostic: at this stage she seems more interested in her characters'' vulnerabilities than in detection.</p>'
    );

    insert into public.admin_passage_analysis_segments (
      analysis_id, sort_order, part_label, segment_type, title, text_excerpt, explanation
    ) values (
      analysis_id, 4, 'P4', 'other', 'P4',
      'However, once the rules of a chosen genre cramp creative thought, there is no reason why an able and interesting writer should accept them. In her latest book, there are signs that James is beginning to feel constrained by the crime-novel genre. Here her determination to leave areas of ambiguity in the solution of the crime and to distribute guilt among the murderer, victim, and bystanders points to a conscious rebellion against the traditional neatness of detective fiction. It is fashionable, though reprehensible, for one writer to prescribe to another. But perhaps the time has come for P. D. James to slide out of her handcuffs and stride into the territory of the mainstream novel.', '<p>The final paragraph converts that diagnosis into advice. The author''s principle is that when a genre''s rules start cramping creative thought, an able writer has no reason to keep them, and the latest book shows James feeling the constraint: her determination to leave the solution ambiguous and to spread guilt among murderer, victim and bystanders reads as conscious rebellion against detective fiction''s traditional neatness. The closing recommendation comes with a self-aware caveat — prescribing to another writer is fashionable but reprehensible — before the author does it anyway, suggesting James slide out of her handcuffs and move into the mainstream novel.</p>'
    );
  end loop;
end;
$chunk$;