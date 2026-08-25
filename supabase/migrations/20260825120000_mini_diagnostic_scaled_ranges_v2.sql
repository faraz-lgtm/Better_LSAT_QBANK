-- Mini diagnostic estimated scaled ranges (correct count → projected LSAT band)
-- + percentiles from shared scaled→percentile map.

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
    (1, 125, 129, 1.04::numeric, 1.92::numeric),
    (2, 130, 134, 2.27::numeric, 4.38::numeric),
    (3, 135, 139, 5.16::numeric, 9.81::numeric),
    (4, 140, 144, 11.47::numeric, 19.93::numeric),
    (5, 145, 149, 22.46::numeric, 34.68::numeric),
    (6, 150, 154, 38.06::numeric, 52.33::numeric),
    (7, 155, 160, 55.91::numeric, 72.92::numeric),
    (8, 161, 166, 75.96::numeric, 88.68::numeric),
    (9, 167, 172, 90.56::numeric, 97.13::numeric),
    (10, 173, 180, 97.86::numeric, 99.89::numeric)
) as v(correct_count, scaled_low, scaled_high, percentile_low, percentile_high)
where
  diagnostic_score_ranges.intent_id = 'mini'
  and diagnostic_score_ranges.correct_count = v.correct_count;
