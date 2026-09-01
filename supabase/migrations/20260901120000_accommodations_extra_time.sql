-- Add extra-time accommodation fields to student_study_preferences.
-- extra_time_setting: preset selection ('none' | '1.5x' | '2x' | 'custom').
-- extra_time_custom_minutes: only meaningful when extra_time_setting = 'custom'.
ALTER TABLE student_study_preferences
  ADD COLUMN IF NOT EXISTS extra_time_setting text NOT NULL DEFAULT 'none'
    CONSTRAINT extra_time_setting_values
      CHECK (extra_time_setting IN ('none', '1.5x', '2x', 'custom')),
  ADD COLUMN IF NOT EXISTS extra_time_custom_minutes integer NULL
    CONSTRAINT extra_time_custom_minutes_range
      CHECK (
        extra_time_custom_minutes IS NULL
        OR (extra_time_custom_minutes >= 1 AND extra_time_custom_minutes <= 999)
      );
