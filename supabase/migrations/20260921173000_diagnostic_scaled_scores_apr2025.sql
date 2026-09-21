-- Align mini + section diagnostic estimated scores with Apr 2025 LSAT conversion
-- (project incorrect count onto 77-scored-Q curve → 120–180). Frontend source of
-- truth: data/diagnostics/lsat-diagnostic-score-conversion.ts

update public.diagnostic_score_ranges
set
  scaled_low = v.scaled_low,
  scaled_high = v.scaled_high,
  percentile_low = v.percentile_low,
  percentile_high = v.percentile_high,
  updated_at = now()
from (
  values
    (0, 120, 124, 0::numeric, 0.92::numeric),
    (1, 120, 124, 0::numeric, 0.92::numeric),
    (2, 120, 134, 0::numeric, 4.38::numeric),
    (3, 120, 142, 0::numeric, 15.27::numeric),
    (4, 134, 148, 4.38::numeric, 31.41::numeric),
    (5, 142, 153, 15.27::numeric, 48.72::numeric),
    (6, 148, 159, 31.41::numeric, 69.84::numeric),
    (7, 153, 164, 48.72::numeric, 84.17::numeric),
    (8, 159, 170, 69.84::numeric, 95.07::numeric),
    (9, 164, 180, 84.17::numeric, 99.89::numeric),
    (10, 170, 180, 95.07::numeric, 99.89::numeric)
) as v(correct_count, scaled_low, scaled_high, percentile_low, percentile_high)
where
  diagnostic_score_ranges.intent_id = 'mini'
  and diagnostic_score_ranges.correct_count = v.correct_count;

update public.diagnostic_score_ranges
set
  scaled_low = v.scaled_low,
  scaled_high = v.scaled_high,
  percentile_low = v.percentile_low,
  percentile_high = v.percentile_high,
  updated_at = now()
from (
  values
    (0, 120, 124, 0::numeric, 0.92::numeric),
    (1, 120, 124, 0::numeric, 0.92::numeric),
    (2, 120, 124, 0::numeric, 0.92::numeric),
    (3, 120, 124, 0::numeric, 0.92::numeric),
    (4, 120, 124, 0::numeric, 0.92::numeric),
    (5, 120, 127, 0::numeric, 1.41::numeric),
    (6, 120, 133, 0::numeric, 3.68::numeric),
    (7, 127, 136, 1.41::numeric, 6.09::numeric),
    (8, 133, 139, 3.68::numeric, 9.81::numeric),
    (9, 136, 142, 6.09::numeric, 15.27::numeric),
    (10, 139, 144, 9.81::numeric, 19.93::numeric),
    (11, 142, 147, 15.27::numeric, 28.27::numeric),
    (12, 144, 149, 19.93::numeric, 34.68::numeric),
    (13, 147, 151, 28.27::numeric, 41.42::numeric),
    (14, 149, 153, 34.68::numeric, 48.72::numeric),
    (15, 151, 156, 41.42::numeric, 59.54::numeric),
    (16, 153, 158, 48.72::numeric, 66.38::numeric),
    (17, 156, 160, 59.54::numeric, 72.92::numeric),
    (18, 158, 162, 66.38::numeric, 79::numeric),
    (19, 160, 164, 72.92::numeric, 84.17::numeric),
    (20, 162, 167, 79::numeric, 90.56::numeric),
    (21, 164, 169, 84.17::numeric, 93.78::numeric),
    (22, 167, 173, 90.56::numeric, 97.86::numeric),
    (23, 169, 177, 93.78::numeric, 99.46::numeric),
    (24, 173, 180, 97.86::numeric, 99.89::numeric),
    (25, 177, 180, 99.46::numeric, 99.89::numeric)
) as v(correct_count, scaled_low, scaled_high, percentile_low, percentile_high)
where
  diagnostic_score_ranges.intent_id = 'quick'
  and diagnostic_score_ranges.correct_count = v.correct_count;
