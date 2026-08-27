-- Align mini diagnostic percentile bands with shared LSAT scaled→percentile map
-- (same source as prep-test score rows / lsat_scaled_score_percentile.csv).

alter table public.diagnostic_score_ranges
  alter column percentile_low type numeric(5, 2)
  using percentile_low::numeric(5, 2);

alter table public.diagnostic_score_ranges
  alter column percentile_high type numeric(5, 2)
  using percentile_high::numeric(5, 2);

update public.diagnostic_score_ranges
set
  percentile_low = v.percentile_low,
  percentile_high = v.percentile_high,
  updated_at = now()
from (
  values
    (0, 0::numeric, 1.21::numeric),
    (1, 1.41::numeric, 3.68::numeric),
    (2, 4.38::numeric, 11.47::numeric),
    (3, 13.21::numeric, 28.27::numeric),
    (4, 31.41::numeric, 52.33::numeric),
    (5, 55.91::numeric, 75.96::numeric),
    (6, 79::numeric, 90.56::numeric),
    (7, 92.21::numeric, 97.13::numeric),
    (8, 97.86::numeric, 99.2::numeric),
    (9, 99.46::numeric, 99.8::numeric),
    (10, 99.89::numeric, 99.89::numeric)
) as v(correct_count, percentile_low, percentile_high)
where
  diagnostic_score_ranges.intent_id = 'mini'
  and diagnostic_score_ranges.correct_count = v.correct_count;
