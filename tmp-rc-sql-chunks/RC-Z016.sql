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
  where q.source_group_id = 'RC-Z016'
    and q.stimulus_text is not null
    and length(trim(q.stimulus_text)) > 0
  limit 1;

  if passage_body is null then
    passage_body := '<p style=''text-indent: 1em;''>Many Native Americans view the archaeological excavation and museum display of ancestral skeletal remains and items buried with them as a spiritual desecration. A number of legal remedies that either prohibit or regulate such activities may be available to Native American communities, if they can establish standing in such cases. In disinterment cases, courts have traditionally affirmed the standing of three classes of plaintiffs: the deceased''s heirs, the owner of the property on which the grave is located, and parties, including organizations or distant relatives of the deceased, that have a clear interest in the preservation of a particular grave. If an archaeologically discovered grave is of recent historical origin and associated with an identifiable Native American community, Native Americans are likely to establish standing in a suit to prevent disinterment of the remains, but in cases where the grave is ancient and located in an area where the community of Native Americans associated with the grave has not recently lived, they are less likely to be successful in this regard. Indeed, in most cases involving ancient graves, to recognize that Native Americans have standing would represent a significant expansion of common law. In cases where standing can be achieved, however, common law may provide a basis for some Native American claims against archaeologists and museums.</p><p style=''text-indent: 1em;''>Property law, for example, can be useful in establishing Native American claims to artifacts that are retrieved in the excavation of ancient graves and can be considered the communal property of Native American tribes or communities. In Charrier v. Bell, a United States appellate court ruled that the common law doctrine of abandonment, which allows the finder of abandoned property to claim ownership, does not apply to objects buried with the deceased. The court ruled that the practice of burying items with the body of the deceased "is not intended as a means of relinquishing ownership to a stranger," and that to interpret it as such "would render a grave subject to despoliation either immediately after interment or . . . after removal of the descendants of the deceased from the neighborhood of the cemetery." This ruling suggests that artifacts excavated from Native American ancestral graves should be returned to representatives of tribal groups who can establish standing in such cases.</p><p style=''text-indent: 1em;''>More generally, United States courts have upheld the distinction between individual and communal property, holding that an individual Native American does not have title to communal property owned and held for common use by his or her tribe. As a result, museums cannot assume that they have valid title to cultural property merely because they purchased in good faith an item that was originally sold in good faith by an individual member of a Native American community.</p>';
  end if;

  for sec in
    select distinct q.section_id
    from public.admin_questions q
    where q.source_group_id = 'RC-Z016'
      and q.section_id is not null
  loop
    select p.id into pass_id
    from public.admin_passages p
    where p.section_id = sec
      and p.source_group_id = 'RC-Z016'
    limit 1;

    if pass_id is null then
      insert into public.admin_passages (section_id, source_group_id, content)
      values (sec, 'RC-Z016', passage_body)
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
    values (pass_id, 1, 'published', nullif('<p>The passage explains the legal avenues open to Native American communities objecting to the excavation and display of ancestral graves, arguing that standing is the decisive threshold — readily established for recent graves, rarely for ancient ones — and that once it is met, property law supports both the return of excavated grave goods and the conclusion that museums may hold no valid title to communal property bought from an individual. The author''s purpose is expository, moving from the standing requirement, to the abandonment doctrine as settled in <em>Charrier v. Bell</em>, to the individual-versus-communal property distinction. Beyond the Native American communities whose objection opens the passage, the only positions described are those of the courts.</p>', ''))
    returning id into analysis_id;

    insert into public.admin_passage_analysis_segments (
      analysis_id, sort_order, part_label, segment_type, title, text_excerpt, explanation
    ) values (
      analysis_id, 1, 'P1', 'other', 'P1',
      'Many Native Americans view the archaeological excavation and museum display of ancestral skeletal remains and items buried with them as a spiritual desecration. A number of legal remedies that either prohibit or regulate such activities may be available to Native American communities, if they can establish standing in such cases. In disinterment cases, courts have traditionally affirmed the standing of three classes of plaintiffs: the deceased''s heirs, the owner of the property on which the grave is located, and parties, including organizations or distant relatives of the deceased, that have a clear interest in the preservation of a particular grave. If an archaeologically discovered grave is of recent historical origin and associated with an identifiable Native American community, Native Americans are likely to establish standing in a suit to prevent disinterment of the remains, but in cases where the grave is ancient and located in an area where the community of Native Americans associated with the grave has not recently lived, they are less likely to be successful in this regard. Indeed, in most cases involving ancient graves, to recognize that Native Americans have standing would represent a significant expansion of common law. In cases where standing can be achieved, however, common law may provide a basis for some Native American claims against archaeologists and museums.', '<p>The opening paragraph sets up a legal problem and immediately complicates it. <strong>Many Native Americans</strong> regard the excavation and museum display of ancestral remains and grave goods as a spiritual desecration, and legal remedies may exist — but only for communities that can establish standing, the right to bring the case at all. Courts have traditionally granted standing to three classes: the deceased''s heirs, the owner of the land holding the grave, and parties with a clear interest in preserving that particular grave. The paragraph then splits the outcomes: a recent grave tied to an identifiable community makes standing likely, while an ancient grave in an area the associated community has not lived in recently makes it unlikely, since recognizing standing there would significantly expand common law.</p>'
    );

    insert into public.admin_passage_analysis_segments (
      analysis_id, sort_order, part_label, segment_type, title, text_excerpt, explanation
    ) values (
      analysis_id, 2, 'P2', 'other', 'P2',
      'Property law, for example, can be useful in establishing Native American claims to artifacts that are retrieved in the excavation of ancient graves and can be considered the communal property of Native American tribes or communities. In Charrier v. Bell, a United States appellate court ruled that the common law doctrine of abandonment, which allows the finder of abandoned property to claim ownership, does not apply to objects buried with the deceased. The court ruled that the practice of burying items with the body of the deceased "is not intended as a means of relinquishing ownership to a stranger," and that to interpret it as such "would render a grave subject to despoliation either immediately after interment or . . . after removal of the descendants of the deceased from the neighborhood of the cemetery." This ruling suggests that artifacts excavated from Native American ancestral graves should be returned to representatives of tribal groups who can establish standing in such cases.', '<p>Having established that standing is the gate, the author turns to what becomes possible once through it, beginning with property law and one decided case. <em>Charrier v. Bell</em> held that the doctrine of abandonment, which lets a finder claim ownership of abandoned property, does not apply to objects buried with the dead. The court reasoned that burying items with a body is not a way of relinquishing ownership to a stranger, and that reading it that way would leave a grave open to despoliation right after burial or once the descendants moved away. The author draws the implication: artifacts taken from Native American ancestral graves should go back to tribal representatives who can establish standing.</p>'
    );

    insert into public.admin_passage_analysis_segments (
      analysis_id, sort_order, part_label, segment_type, title, text_excerpt, explanation
    ) values (
      analysis_id, 3, 'P3', 'other', 'P3',
      'More generally, United States courts have upheld the distinction between individual and communal property, holding that an individual Native American does not have title to communal property owned and held for common use by his or her tribe. As a result, museums cannot assume that they have valid title to cultural property merely because they purchased in good faith an item that was originally sold in good faith by an individual member of a Native American community.', '<p>The closing paragraph generalizes from that case to a second legal principle with a sharper practical edge. United States courts have upheld the distinction between individual and communal property, holding that an individual Native American holds no title to property owned and held for common use by the tribe. The consequence the author spells out is aimed squarely at museums: buying an item in good faith from an individual member of a Native American community, even where that individual sold it in good faith, does not give the museum valid title. Note that the whole passage stays in the register of legal analysis — the author explains what the law permits rather than arguing for a change to it.</p>'
    );
  end loop;
end;
$chunk$;