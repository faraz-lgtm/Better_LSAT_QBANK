-- Full revert: restore course state from backup taken 2026-06-16T11:02:13.157418+00:00
-- WARNING: Deletes lessons added after backup and re-inserts backed-up lesson rows.
-- Run only if you need a full rollback.

begin;

delete from prep_lessons
where course_id = '49d999d7-ecab-4e5e-8fb5-7324bb20efaa'
  and slug not in (
    select slug from jsonb_to_recordset('[{"slug": "the-logic-of-connection"}, {"slug": "the-hidden-foundation-logic-as-grammar"}, {"slug": "welcome-to-the-arena"}, {"slug": "the-basic-foundation-premises-and-conclusions"}, {"slug": "the-marathon-and-the-shortcut"}, {"slug": "claims-subjects-predicates"}, {"slug": "reo-work-separating-subjects-and-predicates"}, {"slug": "the-gps-indicator-words"}, {"slug": "why-this-test-is-crucial"}, {"slug": "the-support-system"}, {"slug": "modifiers"}, {"slug": "the-lsat-myths-vs-reality"}, {"slug": "the-new-lsat-landscape"}, {"slug": "rep-work-following-the-signs"}, {"slug": "reo-work-distinguishing-elements-of-claims"}, {"slug": "modifier-indicators"}, {"slug": "the-lexicon-speaking-lsat"}, {"slug": "rep-work-identifying-premises-and-conclusions-easy"}, {"slug": "rep-work-identifying-premises-and-conclusions-hard"}, {"slug": "rep-work-modifiers-breakdown"}, {"slug": "the-road-ahead"}, {"slug": "active-drill-neurochemical-imbalances"}, {"slug": "the-pointers-referentials"}, {"slug": "rep-work-following-the-pointer"}, {"slug": "full-drill-main-conclusion-questions"}, {"slug": "active-drill-referentials-in-action"}, {"slug": "building-the-ladder-sub-conclusions"}, {"slug": "the-comparison-relative-v-absolute"}, {"slug": "rep-work-analyzing-sub-conclusions"}, {"slug": "the-noise-context-and-background"}, {"slug": "rep-work-comparison-auditing"}, {"slug": "the-easy-way-to-analyze-comparisons"}, {"slug": "rep-work-filtering-for-the-core"}, {"slug": "different-types-of-comparative-claims"}, {"slug": "active-drill-st-patrick-s-day-carnations"}, {"slug": "rep-work-comparison-breakdowns"}, {"slug": "the-even-though-concessions"}, {"slug": "rep-work-identifying-concessions"}, {"slug": "important-details-about-comparatives"}, {"slug": "the-missing-link-assumptions-and-the-continuum-of-support"}, {"slug": "rep-work-unspoken-benchmarks"}, {"slug": "the-case-study-the-remote-work-policy"}, {"slug": "rep-work-directional-symmetry"}, {"slug": "the-continuum-of-support"}, {"slug": "rep-work-comparison-breakdown-mastery"}, {"slug": "the-argument-masterclass-summary"}, {"slug": "making-lsat-language-simple"}, {"slug": "active-drill-evritech-corporation"}, {"slug": "active-drill-areas-of-mathematics"}, {"slug": "active-drill-neutron-filled-pulsars"}, {"slug": "summary-the-language-surgeon"}, {"slug": "full-drill"}, {"slug": "active-drill-paying-staff-with-stock-options"}, {"slug": "full-drill-varied-arguments-mix"}, {"slug": "what-s-up-next"}, {"slug": "let-s-touch-base"}]'::jsonb)
      as x(slug text)
  );

-- For a complete rollback, use scripts/essentials_course_import.py --restore essentials-import-20260616-110213

commit;
