
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
    where q.source_group_id = 'RC-Z007'
      and q.section_id is not null
  loop
    select p.id into pass_id
    from public.admin_passages p
    where p.section_id = sec
      and p.source_group_id = 'RC-Z007'
    limit 1;

    if pass_id is null then
      insert into public.admin_passages (section_id, source_group_id, content)
      values (sec, 'RC-Z007', '<p style=''text-indent: 1em;''>When the same habitat types (forests, oceans, grasslands, etc.) in regions of different latitudes are compared, it becomes apparent that the overall number of species increases from pole to equator. This latitudinal gradient is probably even more pronounced than current records indicate, since researchers believe that most undiscovered species live in the tropics.</p><p style=''text-indent: 1em;''>One hypothesis to explain this phenomenon, the "time theory," holds that diverse species adapted to today''s climatic conditions have had more time to emerge in the tropical regions, which, unlike the temperate and arctic zones, have been unaffected by a succession of ice ages. However, ice ages have caused less disruption in some temperate regions than in others and have not interrupted arctic conditions.</p><p style=''text-indent: 1em;''>Alternatively, the species-energy hypothesis proposes the following positive correlations: incoming energy from the Sun correlated with rates of growth and reproduction; rates of growth and reproduction with the amount of living matter (biomass) at a given moment; and the amount of biomass with number of species. However, since organisms may die rapidly, high production rates can exist with low biomass. And high biomass can exist with few species. Moreover, the mechanism proposed—greater energy influx leading to bigger populations, thereby lowering the probability of local extinction—remains untested.</p><p style=''text-indent: 1em;''>A third hypothesis centers on the tropics'' climatic stability, which provides a more reliable supply of resources. Species can thus survive even with few types of food, and competing species can tolerate greater overlap between their respective niches. Both capabilities enable more species to exist on the same resources. However, the ecology of local communities cannot account for the origin of the latitudinal gradient. Localized ecological processes such as competition do not generate regional pools of species, and it is the total number of species available regionally for colonizing any particular area that makes the difference between, for example, a forest at the equator and one at a higher latitude.</p><p style=''text-indent: 1em;''>A fourth and most plausible hypothesis focuses on regional speciation, and in particular on rates of speciation and extinction. According to this hypothesis, if speciation rates become higher toward the tropics, and are not negated by extinction rates, then the latitudinal gradient would result—and become increasingly steep.</p><p style=''text-indent: 1em;''>The mechanism for this rate-of-speciation hypothesis is that most new animal species, and perhaps plant species, arise because a population subgroup becomes isolated. This subgroup evolves differently and eventually cannot interbreed with members of the original population. The uneven spread of a species over a large geographic area promotes this mechanism: at the edges, small populations spread out and form isolated groups. Since subgroups in an arctic environment are more likely to face extinction than those in the tropics, the latter are more likely to survive long enough to adapt to local conditions and ultimately become new species.</p>')
      returning id into pass_id;
    else
      update public.admin_passages
      set content = coalesce(nullif('<p style=''text-indent: 1em;''>When the same habitat types (forests, oceans, grasslands, etc.) in regions of different latitudes are compared, it becomes apparent that the overall number of species increases from pole to equator. This latitudinal gradient is probably even more pronounced than current records indicate, since researchers believe that most undiscovered species live in the tropics.</p><p style=''text-indent: 1em;''>One hypothesis to explain this phenomenon, the "time theory," holds that diverse species adapted to today''s climatic conditions have had more time to emerge in the tropical regions, which, unlike the temperate and arctic zones, have been unaffected by a succession of ice ages. However, ice ages have caused less disruption in some temperate regions than in others and have not interrupted arctic conditions.</p><p style=''text-indent: 1em;''>Alternatively, the species-energy hypothesis proposes the following positive correlations: incoming energy from the Sun correlated with rates of growth and reproduction; rates of growth and reproduction with the amount of living matter (biomass) at a given moment; and the amount of biomass with number of species. However, since organisms may die rapidly, high production rates can exist with low biomass. And high biomass can exist with few species. Moreover, the mechanism proposed—greater energy influx leading to bigger populations, thereby lowering the probability of local extinction—remains untested.</p><p style=''text-indent: 1em;''>A third hypothesis centers on the tropics'' climatic stability, which provides a more reliable supply of resources. Species can thus survive even with few types of food, and competing species can tolerate greater overlap between their respective niches. Both capabilities enable more species to exist on the same resources. However, the ecology of local communities cannot account for the origin of the latitudinal gradient. Localized ecological processes such as competition do not generate regional pools of species, and it is the total number of species available regionally for colonizing any particular area that makes the difference between, for example, a forest at the equator and one at a higher latitude.</p><p style=''text-indent: 1em;''>A fourth and most plausible hypothesis focuses on regional speciation, and in particular on rates of speciation and extinction. According to this hypothesis, if speciation rates become higher toward the tropics, and are not negated by extinction rates, then the latitudinal gradient would result—and become increasingly steep.</p><p style=''text-indent: 1em;''>The mechanism for this rate-of-speciation hypothesis is that most new animal species, and perhaps plant species, arise because a population subgroup becomes isolated. This subgroup evolves differently and eventually cannot interbreed with members of the original population. The uneven spread of a species over a large geographic area promotes this mechanism: at the edges, small populations spread out and form isolated groups. Since subgroups in an arctic environment are more likely to face extinction than those in the tropics, the latter are more likely to survive long enough to adapt to local conditions and ultimately become new species.</p>', ''), content),
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
    values (pass_id, next_ver, 'published', nullif('<p>The passage sets out to explain why species numbers increase from the poles toward the equator, evaluates four hypotheses — time, species-energy, climatic stability, and rate of speciation — and endorses the last, on the grounds that isolated subgroups at the edges of a species'' range are likelier to survive and become new species in the tropics than in the arctic. The author''s purpose is to assess competing explanations and identify the strongest, using a consistent structure of statement followed by objection for the first three before committing to the fourth and supplying its mechanism. The only viewpoint developed is the author''s own assessment of each hypothesis.</p>', ''))
    returning id into analysis_id;

    
    insert into public.admin_passage_analysis_segments (
      analysis_id, sort_order, part_label, segment_type, title, text_excerpt, explanation
    ) values (
      analysis_id, 1, 'P1', 'other', 'P1',
      'When the same habitat types (forests, oceans, grasslands, etc.) in regions of different latitudes are compared, it becomes apparent that the overall number of species increases from pole to equator. This latitudinal gradient is probably even more pronounced than current records indicate, since researchers believe that most undiscovered species live in the tropics.', '<p>The passage opens by establishing the fact everything else will try to explain. Compare the same habitat type at different latitudes and the number of species rises as you move from pole to equator. The author adds that this latitudinal gradient is probably even steeper than the records show, since researchers believe most undiscovered species live in the tropics. Keep the structure in view from here: one phenomenon, then four candidate explanations assessed in turn, and the author''s verdict attached to each.</p>'
    );

    insert into public.admin_passage_analysis_segments (
      analysis_id, sort_order, part_label, segment_type, title, text_excerpt, explanation
    ) values (
      analysis_id, 2, 'P2', 'other', 'P2',
      'One hypothesis to explain this phenomenon, the "time theory," holds that diverse species adapted to today''s climatic conditions have had more time to emerge in the tropical regions, which, unlike the temperate and arctic zones, have been unaffected by a succession of ice ages. However, ice ages have caused less disruption in some temperate regions than in others and have not interrupted arctic conditions.', '<p>The first candidate is the time theory: species suited to today''s climate have had longer to emerge in the tropics, which unlike temperate and arctic zones were spared a succession of ice ages. The author''s objection follows immediately and is empirical rather than theoretical — ice ages disrupted some temperate regions far less than others, and they never interrupted arctic conditions at all. The pattern to notice is that each hypothesis gets a compact statement followed by a ''however'' that undercuts it.</p>'
    );

    insert into public.admin_passage_analysis_segments (
      analysis_id, sort_order, part_label, segment_type, title, text_excerpt, explanation
    ) values (
      analysis_id, 3, 'P3', 'other', 'P3',
      'Alternatively, the species-energy hypothesis proposes the following positive correlations: incoming energy from the Sun correlated with rates of growth and reproduction; rates of growth and reproduction with the amount of living matter (biomass) at a given moment; and the amount of biomass with number of species. However, since organisms may die rapidly, high production rates can exist with low biomass. And high biomass can exist with few species. Moreover, the mechanism proposed—greater energy influx leading to bigger populations, thereby lowering the probability of local extinction—remains untested.', '<p>The species-energy hypothesis is a chain of proposed correlations: solar energy with growth and reproduction rates, those rates with the amount of living matter present at a given moment, and biomass with the number of species. The author breaks the chain at two links and then questions the whole. Organisms may die fast, so high production can coexist with low biomass; high biomass can coexist with few species. On top of that, the proposed mechanism — more energy makes bigger populations, which lowers the chance of local extinction — has never been tested.</p>'
    );

    insert into public.admin_passage_analysis_segments (
      analysis_id, sort_order, part_label, segment_type, title, text_excerpt, explanation
    ) values (
      analysis_id, 4, 'P4', 'other', 'P4',
      'A third hypothesis centers on the tropics'' climatic stability, which provides a more reliable supply of resources. Species can thus survive even with few types of food, and competing species can tolerate greater overlap between their respective niches. Both capabilities enable more species to exist on the same resources. However, the ecology of local communities cannot account for the origin of the latitudinal gradient. Localized ecological processes such as competition do not generate regional pools of species, and it is the total number of species available regionally for colonizing any particular area that makes the difference between, for example, a forest at the equator and one at a higher latitude.', '<p>The third hypothesis rests on the tropics'' climatic stability and a more reliable supply of resources, which lets species survive on few types of food and lets competing species tolerate more overlap between their niches, so more species can live on the same resources. The author''s objection here is a scale mismatch rather than a factual error, and it is the most conceptually demanding move in the passage: local ecological processes like competition do not generate regional pools of species, and what separates an equatorial forest from a higher-latitude one is the total number of species regionally available to colonize it.</p>'
    );

    insert into public.admin_passage_analysis_segments (
      analysis_id, sort_order, part_label, segment_type, title, text_excerpt, explanation
    ) values (
      analysis_id, 5, 'P5', 'other', 'P5',
      'A fourth and most plausible hypothesis focuses on regional speciation, and in particular on rates of speciation and extinction. According to this hypothesis, if speciation rates become higher toward the tropics, and are not negated by extinction rates, then the latitudinal gradient would result—and become increasingly steep.', '<p>The fourth hypothesis is the one the author endorses, and the endorsement is explicit — most plausible. It shifts attention to regional speciation and specifically to the rates at which species form and go extinct. The claim is conditional: if speciation rates rise toward the tropics and are not cancelled out by extinction rates, the latitudinal gradient follows and grows steeper over time. Note that this hypothesis answers the objection raised in the previous paragraph, since it operates at the regional scale the author said was the relevant one.</p>'
    );

    insert into public.admin_passage_analysis_segments (
      analysis_id, sort_order, part_label, segment_type, title, text_excerpt, explanation
    ) values (
      analysis_id, 6, 'P6', 'other', 'P6',
      'The mechanism for this rate-of-speciation hypothesis is that most new animal species, and perhaps plant species, arise because a population subgroup becomes isolated. This subgroup evolves differently and eventually cannot interbreed with members of the original population. The uneven spread of a species over a large geographic area promotes this mechanism: at the edges, small populations spread out and form isolated groups. Since subgroups in an arctic environment are more likely to face extinction than those in the tropics, the latter are more likely to survive long enough to adapt to local conditions and ultimately become new species.', '<p>The closing paragraph supplies the mechanism the favored hypothesis needs, which is what the other three lacked or left untested. Most new animal species, and perhaps plant species, arise when a subgroup of a population becomes isolated, evolves separately and eventually can no longer interbreed with the original population. A species spread unevenly across a large area promotes this, because small populations at the edges break off into isolated groups. The final step delivers the latitudinal difference: isolated subgroups in the arctic are likelier to die out, so tropical ones survive long enough to adapt and become new species.</p>'
    );
  end loop;
end;
$chunk$;
