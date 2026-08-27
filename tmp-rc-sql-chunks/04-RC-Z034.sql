
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
    where q.source_group_id = 'RC-Z034'
      and q.section_id is not null
  loop
    select p.id into pass_id
    from public.admin_passages p
    where p.section_id = sec
      and p.source_group_id = 'RC-Z034'
    limit 1;

    if pass_id is null then
      insert into public.admin_passages (section_id, source_group_id, content)
      values (sec, 'RC-Z034', '<p style=''text-indent: 1em;''>A fake can be defined as an artwork intended to deceive. The motives of its creator are decisive, and the merit of the object itself is a separate issue. The question mark in the title of Mark Jones''s Fake? The Art of Deception reveals the study''s broader concerns. Indeed, it might equally be entitled Original?, and the text begins by noting a variety of possibilities somewhere between the two extremes. These include works by an artist''s followers in the style of the master, deliberate archaism, copying for pedagogical purposes, and the production of commercial facsimiles.</p><p style=''text-indent: 1em;''>The greater part of Fake? is devoted to a chronological survey suggesting that faking feeds on the many different motives people have for collecting art, and that, on the whole, the faking of art flourishes whenever art collecting flourishes. In imperial Rome there was a widespread interest in collecting earlier Greek art, and therefore in faking it. No doubt many of the sculptures now exhibited as "Roman copies" were originally passed off as Greek. In medieval Europe, because art was celebrated more for its devotional uses than for its provenance or the ingenuity of its creators, the faking of art was virtually nonexistent. The modern age of faking began in the Italian Renaissance, with two linked developments: a passionate identification with the world of antiquity and a growing sense of individual artistic identity. A patron of the young Michelangelo prevailed upon the artist to make his sculpture Sleeping Cupid look as though it had been buried in the earth so that "it will be taken for antique, and you will sell it much better." Within a few years, however, beginning with his first masterpiece, the Bacchus, Michelangelo had shown his contemporaries that great art can assimilate and transcend what came before, resulting in a wholly original work. Soon his genius made him the object of imitators.</p><p style=''text-indent: 1em;''>Fake? also reminds us that in certain cultures authenticity is a foreign concept. This is true of much African art, where the authenticity of an object is considered by collectors to depend on its function. As an illustration, the study compares two versions of a chi wara mask made by the Bambara people of Mali. One has pegs allowing it to be attached to a cap for its intended ceremonial purpose. The second, otherwise identical, lacks the pegs and is a replica made for sale. African carving is notoriously difficult to date, but even if the ritual mask is recent, made perhaps to replace a damaged predecessor, and the replica much older, only the ritual mask should be seen as authentic, for it is tied to the form''s original function. That, at least, is the consensus of the so-called experts. One wonders whether the Bambaran artists would agree.</p>')
      returning id into pass_id;
    else
      update public.admin_passages
      set content = coalesce(nullif('<p style=''text-indent: 1em;''>A fake can be defined as an artwork intended to deceive. The motives of its creator are decisive, and the merit of the object itself is a separate issue. The question mark in the title of Mark Jones''s Fake? The Art of Deception reveals the study''s broader concerns. Indeed, it might equally be entitled Original?, and the text begins by noting a variety of possibilities somewhere between the two extremes. These include works by an artist''s followers in the style of the master, deliberate archaism, copying for pedagogical purposes, and the production of commercial facsimiles.</p><p style=''text-indent: 1em;''>The greater part of Fake? is devoted to a chronological survey suggesting that faking feeds on the many different motives people have for collecting art, and that, on the whole, the faking of art flourishes whenever art collecting flourishes. In imperial Rome there was a widespread interest in collecting earlier Greek art, and therefore in faking it. No doubt many of the sculptures now exhibited as "Roman copies" were originally passed off as Greek. In medieval Europe, because art was celebrated more for its devotional uses than for its provenance or the ingenuity of its creators, the faking of art was virtually nonexistent. The modern age of faking began in the Italian Renaissance, with two linked developments: a passionate identification with the world of antiquity and a growing sense of individual artistic identity. A patron of the young Michelangelo prevailed upon the artist to make his sculpture Sleeping Cupid look as though it had been buried in the earth so that "it will be taken for antique, and you will sell it much better." Within a few years, however, beginning with his first masterpiece, the Bacchus, Michelangelo had shown his contemporaries that great art can assimilate and transcend what came before, resulting in a wholly original work. Soon his genius made him the object of imitators.</p><p style=''text-indent: 1em;''>Fake? also reminds us that in certain cultures authenticity is a foreign concept. This is true of much African art, where the authenticity of an object is considered by collectors to depend on its function. As an illustration, the study compares two versions of a chi wara mask made by the Bambara people of Mali. One has pegs allowing it to be attached to a cap for its intended ceremonial purpose. The second, otherwise identical, lacks the pegs and is a replica made for sale. African carving is notoriously difficult to date, but even if the ritual mask is recent, made perhaps to replace a damaged predecessor, and the replica much older, only the ritual mask should be seen as authentic, for it is tied to the form''s original function. That, at least, is the consensus of the so-called experts. One wonders whether the Bambaran artists would agree.</p>', ''), content),
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
    values (pass_id, next_ver, 'published', nullif('<p>Reviewing Mark Jones''s <em>Fake? The Art of Deception</em>, the passage explains that a fake is defined by its maker''s intent to deceive, that the faking of art rises and falls with the collecting of art across history, and that in some cultures authenticity is judged by function rather than origin. The author''s purpose is to present and largely endorse the book''s account while adding a note of doubt at the end, moving from definition, to the chronological survey from Rome through the medieval period to the Renaissance, to the African case. The author''s voice is mostly neutral, turning sceptical only toward the collectors and experts who decide which chi wara mask counts as authentic.</p>', ''))
    returning id into analysis_id;

    
    insert into public.admin_passage_analysis_segments (
      analysis_id, sort_order, part_label, segment_type, title, text_excerpt, explanation
    ) values (
      analysis_id, 1, 'P1', 'other', 'P1',
      'A fake can be defined as an artwork intended to deceive. The motives of its creator are decisive, and the merit of the object itself is a separate issue. The question mark in the title of Mark Jones''s Fake? The Art of Deception reveals the study''s broader concerns. Indeed, it might equally be entitled Original?, and the text begins by noting a variety of possibilities somewhere between the two extremes. These include works by an artist''s followers in the style of the master, deliberate archaism, copying for pedagogical purposes, and the production of commercial facsimiles.', '<p>The passage opens by defining its terms with unusual precision, and the definition is what the questions will lean on. A fake is an artwork intended to deceive: the creator''s motive decides the matter, and whether the object is any good is a separate question entirely. The author then reads the question mark in the title of <strong>Mark Jones</strong>''s <em>Fake? The Art of Deception</em> as a signal that the book''s concerns are broader — it could as easily have been called <em>Original?</em> — and notes the range of possibilities lying between the two poles: work by followers in a master''s style, deliberate archaism, copying done to teach, and commercial facsimiles.</p>'
    );

    insert into public.admin_passage_analysis_segments (
      analysis_id, sort_order, part_label, segment_type, title, text_excerpt, explanation
    ) values (
      analysis_id, 2, 'P2', 'other', 'P2',
      'The greater part of Fake? is devoted to a chronological survey suggesting that faking feeds on the many different motives people have for collecting art, and that, on the whole, the faking of art flourishes whenever art collecting flourishes. In imperial Rome there was a widespread interest in collecting earlier Greek art, and therefore in faking it. No doubt many of the sculptures now exhibited as "Roman copies" were originally passed off as Greek. In medieval Europe, because art was celebrated more for its devotional uses than for its provenance or the ingenuity of its creators, the faking of art was virtually nonexistent. The modern age of faking began in the Italian Renaissance, with two linked developments: a passionate identification with the world of antiquity and a growing sense of individual artistic identity. A patron of the young Michelangelo prevailed upon the artist to make his sculpture Sleeping Cupid look as though it had been buried in the earth so that "it will be taken for antique, and you will sell it much better." Within a few years, however, beginning with his first masterpiece, the Bacchus, Michelangelo had shown his contemporaries that great art can assimilate and transcend what came before, resulting in a wholly original work. Soon his genius made him the object of imitators.', '<p>The bulk of the paragraph is the book''s historical survey, organized around one proposition: faking feeds on the motives people have for collecting, so faking flourishes wherever collecting flourishes. Imperial Rome collected earlier Greek art and faked it, and the author suspects many sculptures now labelled Roman copies were first sold as Greek. Medieval Europe valued art for devotional use rather than provenance or the maker''s ingenuity, so faking was virtually nonexistent. The modern age of faking begins in the Italian Renaissance with two linked developments, passion for antiquity and a growing sense of individual artistic identity — illustrated by the patron who had the young Michelangelo age his <em>Sleeping Cupid</em> to sell it as antique, and by Michelangelo''s own later originality making him a target for imitators.</p>'
    );

    insert into public.admin_passage_analysis_segments (
      analysis_id, sort_order, part_label, segment_type, title, text_excerpt, explanation
    ) values (
      analysis_id, 3, 'P3', 'other', 'P3',
      'Fake? also reminds us that in certain cultures authenticity is a foreign concept. This is true of much African art, where the authenticity of an object is considered by collectors to depend on its function. As an illustration, the study compares two versions of a chi wara mask made by the Bambara people of Mali. One has pegs allowing it to be attached to a cap for its intended ceremonial purpose. The second, otherwise identical, lacks the pegs and is a replica made for sale. African carving is notoriously difficult to date, but even if the ritual mask is recent, made perhaps to replace a damaged predecessor, and the replica much older, only the ritual mask should be seen as authentic, for it is tied to the form''s original function. That, at least, is the consensus of the so-called experts. One wonders whether the Bambaran artists would agree.', '<p>The final paragraph turns to cultures where authenticity itself is a foreign idea, and it closes with the author''s one moment of open scepticism. In much African art, collectors treat authenticity as a matter of function, and the book compares two chi wara masks made by the Bambara people of Mali: one has pegs for attaching it to a cap for ceremonial use, the other is identical but pegless, a replica made for sale. Even if the ritual mask is the newer of the two, only it counts as authentic, because it is tied to the form''s original function. The author attributes that judgment to <strong>the so-called experts</strong> — the phrasing is dismissive — and ends by wondering whether the Bambaran artists would agree, a question left deliberately open.</p>'
    );
  end loop;
end;
$chunk$;
