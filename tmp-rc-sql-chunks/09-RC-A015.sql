
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
    where q.source_group_id = 'RC-A015'
      and q.section_id is not null
  loop
    select p.id into pass_id
    from public.admin_passages p
    where p.section_id = sec
      and p.source_group_id = 'RC-A015'
    limit 1;

    if pass_id is null then
      insert into public.admin_passages (section_id, source_group_id, content)
      values (sec, 'RC-A015', '<p style=''text-indent: 1em;''>Most office workers assume that the messages they send to each other via electronic mail are as private as a telephone call or a face-to-face meeting. That assumption is wrong. Although it is illegal in many areas for an employer to eavesdrop on private conversations or telephone calls—even if they take place on a company-owned telephone—there are no clear rules governing electronic mail. In fact, the question of how private electronic mail transmissions should be has emerged as one of the more complicated legal issues of the electronic age.</p><p style=''text-indent: 1em;''>People''s opinions about the degree of privacy that electronic mail should have vary depending on whose electronic mail system is being used and who is reading the messages. Does a government office, for example, have the right to destroy electronic messages created in the course of running the government, thereby denying public access to such documents? Some hold that government offices should issue guidelines that allow their staff to delete such electronic records, and defend this practice by claiming that the messages thus deleted already exist in paper versions whose destruction is forbidden. Opponents of such practices argue that the paper versions often omit such information as who received the messages and when they received them, information commonly carried on electronic mail systems. Government officials, opponents maintain, are civil servants; the public should thus have the right to review any documents created during the conducting of government business.</p><p style=''text-indent: 1em;''>Questions about electronic mail privacy have also arisen in the private sector. Recently, two employees of an automotive company were discovered to have been communicating disparaging information about their supervisor via electronic mail. The supervisor, who had been monitoring the communication, threatened to fire the employees. When the employees filed a grievance complaining that their privacy had been violated, they were let go. Later, their court case for unlawful termination was dismissed; the company''s lawyers successfully argued that because the company owned the computer system, its supervisors had the right to read anything created on it.</p><p style=''text-indent: 1em;''>In some areas, laws prohibit outside interception of electronic mail by a third party without proper authorization such as a search warrant. However, these laws do not cover "inside" interception such as occurred at the automotive company. In the past, courts have ruled that interoffice communications may be considered private only if employees have a "reasonable expectation" of privacy when they send the messages. The fact is that no absolute guarantee of privacy exists in any computer system. The only solution may be for users to scramble their own messages with encryption codes; unfortunately, such complex codes are likely to undermine the principal virtue of electronic mail: its convenience.</p>')
      returning id into pass_id;
    else
      update public.admin_passages
      set content = coalesce(nullif('<p style=''text-indent: 1em;''>Most office workers assume that the messages they send to each other via electronic mail are as private as a telephone call or a face-to-face meeting. That assumption is wrong. Although it is illegal in many areas for an employer to eavesdrop on private conversations or telephone calls—even if they take place on a company-owned telephone—there are no clear rules governing electronic mail. In fact, the question of how private electronic mail transmissions should be has emerged as one of the more complicated legal issues of the electronic age.</p><p style=''text-indent: 1em;''>People''s opinions about the degree of privacy that electronic mail should have vary depending on whose electronic mail system is being used and who is reading the messages. Does a government office, for example, have the right to destroy electronic messages created in the course of running the government, thereby denying public access to such documents? Some hold that government offices should issue guidelines that allow their staff to delete such electronic records, and defend this practice by claiming that the messages thus deleted already exist in paper versions whose destruction is forbidden. Opponents of such practices argue that the paper versions often omit such information as who received the messages and when they received them, information commonly carried on electronic mail systems. Government officials, opponents maintain, are civil servants; the public should thus have the right to review any documents created during the conducting of government business.</p><p style=''text-indent: 1em;''>Questions about electronic mail privacy have also arisen in the private sector. Recently, two employees of an automotive company were discovered to have been communicating disparaging information about their supervisor via electronic mail. The supervisor, who had been monitoring the communication, threatened to fire the employees. When the employees filed a grievance complaining that their privacy had been violated, they were let go. Later, their court case for unlawful termination was dismissed; the company''s lawyers successfully argued that because the company owned the computer system, its supervisors had the right to read anything created on it.</p><p style=''text-indent: 1em;''>In some areas, laws prohibit outside interception of electronic mail by a third party without proper authorization such as a search warrant. However, these laws do not cover "inside" interception such as occurred at the automotive company. In the past, courts have ruled that interoffice communications may be considered private only if employees have a "reasonable expectation" of privacy when they send the messages. The fact is that no absolute guarantee of privacy exists in any computer system. The only solution may be for users to scramble their own messages with encryption codes; unfortunately, such complex codes are likely to undermine the principal virtue of electronic mail: its convenience.</p>', ''), content),
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
    values (pass_id, next_ver, 'published', nullif('<p>The passage argues that the privacy office workers assume their electronic mail has does not exist in law, surveying the unsettled disputes over whether government offices may delete electronic records and whether employers may read messages on systems they own, and concluding that no computer system guarantees privacy and that the one remedy, encryption, would cost electronic mail its convenience. The author''s purpose is to explain an unresolved legal problem rather than to resolve it, moving from the mistaken assumption, to the public-sector dispute, to a private-sector case, to the current state of the law. The viewpoints to separate are those defending deletion of government records, the opponents who would preserve public access, the employer''s successful legal argument, and the author''s own pessimistic assessment.</p>', ''))
    returning id into analysis_id;

    
    insert into public.admin_passage_analysis_segments (
      analysis_id, sort_order, part_label, segment_type, title, text_excerpt, explanation
    ) values (
      analysis_id, 1, 'P1', 'other', 'P1',
      'Most office workers assume that the messages they send to each other via electronic mail are as private as a telephone call or a face-to-face meeting. That assumption is wrong. Although it is illegal in many areas for an employer to eavesdrop on private conversations or telephone calls—even if they take place on a company-owned telephone—there are no clear rules governing electronic mail. In fact, the question of how private electronic mail transmissions should be has emerged as one of the more complicated legal issues of the electronic age.', '<p>The passage opens by puncturing an assumption. Most office workers treat electronic mail as being as private as a phone call or a face-to-face conversation, and the author says flatly that they are wrong. The asymmetry is the point: eavesdropping on private conversations or phone calls is illegal in many places even on a company phone, yet no clear rules govern electronic mail. The paragraph closes by naming the topic as one of the more complicated legal issues of the electronic age, which tells you the passage will survey unsettled disputes rather than deliver a rule.</p>'
    );

    insert into public.admin_passage_analysis_segments (
      analysis_id, sort_order, part_label, segment_type, title, text_excerpt, explanation
    ) values (
      analysis_id, 2, 'P2', 'other', 'P2',
      'People''s opinions about the degree of privacy that electronic mail should have vary depending on whose electronic mail system is being used and who is reading the messages. Does a government office, for example, have the right to destroy electronic messages created in the course of running the government, thereby denying public access to such documents? Some hold that government offices should issue guidelines that allow their staff to delete such electronic records, and defend this practice by claiming that the messages thus deleted already exist in paper versions whose destruction is forbidden. Opponents of such practices argue that the paper versions often omit such information as who received the messages and when they received them, information commonly carried on electronic mail systems. Government officials, opponents maintain, are civil servants; the public should thus have the right to review any documents created during the conducting of government business.', '<p>The first dispute is in the public sector, and it is presented as two opposed positions you should keep separate. The question is whether a government office may destroy electronic messages created in the course of governing, cutting off public access. <strong>Some</strong> hold that offices should issue guidelines permitting staff to delete such records, defending the practice on the ground that the messages already exist in paper versions that may not be destroyed. <strong>Opponents</strong> counter that the paper versions often omit who received a message and when, information the electronic system routinely carries, and argue that since government officials are civil servants the public should be able to review any document created in the conduct of government business.</p>'
    );

    insert into public.admin_passage_analysis_segments (
      analysis_id, sort_order, part_label, segment_type, title, text_excerpt, explanation
    ) values (
      analysis_id, 3, 'P3', 'other', 'P3',
      'Questions about electronic mail privacy have also arisen in the private sector. Recently, two employees of an automotive company were discovered to have been communicating disparaging information about their supervisor via electronic mail. The supervisor, who had been monitoring the communication, threatened to fire the employees. When the employees filed a grievance complaining that their privacy had been violated, they were let go. Later, their court case for unlawful termination was dismissed; the company''s lawyers successfully argued that because the company owned the computer system, its supervisors had the right to read anything created on it.', '<p>The second dispute is private-sector, and the author illustrates it with a single case rather than a debate. Two employees of an automotive company were found to have been passing disparaging remarks about their supervisor by electronic mail; the supervisor, who had been monitoring the exchange, threatened to fire them, and when they filed a grievance claiming their privacy had been violated they were let go. Their unlawful-termination case was dismissed, the company''s lawyers having successfully argued that ownership of the computer system gave supervisors the right to read anything created on it. The author reports the outcome without endorsing it.</p>'
    );

    insert into public.admin_passage_analysis_segments (
      analysis_id, sort_order, part_label, segment_type, title, text_excerpt, explanation
    ) values (
      analysis_id, 4, 'P4', 'other', 'P4',
      'In some areas, laws prohibit outside interception of electronic mail by a third party without proper authorization such as a search warrant. However, these laws do not cover "inside" interception such as occurred at the automotive company. In the past, courts have ruled that interoffice communications may be considered private only if employees have a "reasonable expectation" of privacy when they send the messages. The fact is that no absolute guarantee of privacy exists in any computer system. The only solution may be for users to scramble their own messages with encryption codes; unfortunately, such complex codes are likely to undermine the principal virtue of electronic mail: its convenience.', '<p>The final paragraph pulls the threads into the legal state of play and a bleak conclusion. Some laws bar outside interception of electronic mail by a third party without authorization such as a search warrant, but they do not reach inside interception of the kind the automotive company practised. Courts have held that interoffice communications count as private only where employees have a reasonable expectation of privacy — and the author''s blunt assessment is that no computer system offers an absolute guarantee. Encryption is offered as the only solution, immediately undercut: codes complex enough to work are likely to destroy electronic mail''s principal virtue, its convenience.</p>'
    );
  end loop;
end;
$chunk$;
