-- Nurse Schedule — รันใน Supabase SQL Editor (โปรเจกต์ tkqoefofqvkqneatnwol)
-- ใช้กับ Fastify backend ใน nurse-schedule

-- ─── shift_types ───
CREATE TABLE IF NOT EXISTS public.shift_types (
  code          TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  name_lao      TEXT,
  start_time    TIME,
  end_time      TIME,
  color_hex     TEXT NOT NULL DEFAULT '#607d8b',
  is_overnight  BOOLEAN DEFAULT false,
  sort_order    INT DEFAULT 0
);

INSERT INTO public.shift_types (code, name, name_lao, start_time, end_time, color_hex, sort_order) VALUES
  ('M',    'Morning',        'M ພາກເຊົ້າ',     '08:00', '16:00', '#43a047', 1),
  ('E',    'Evening',        'E ພາກແລງ',       '16:00', '21:00', '#fb8c00', 2),
  ('EN',   'Evening+Night',  'EN ພາກແລງ&ເດີກ', '16:00', '08:00', '#8e24aa', 3),
  ('N',    'Night',          'N ພາກເດິກ',       '21:00', '08:00', '#1a237e', 4),
  ('MN',   'Morning+Night',  'MN',             '08:00', '08:00', '#5c6bc0', 5),
  ('ME',   'Morning+Evening','ME',             '08:00', '21:00', '#26a69a', 6),
  ('B/S',  'Day off',        'ວັນພັກ',          NULL,    NULL,    '#9e9e9e', 7),
  ('BS',   'Day off',        'ວັນພັກ',          NULL,    NULL,    '#9e9e9e', 7),
  ('AL',   'Annual leave',   'ລາພັກ',           NULL,    NULL,    '#fdd835', 8),
  ('AL/N', 'AL + Night',     'AL/N',           NULL,    NULL,    '#ff7043', 9)
ON CONFLICT (code) DO NOTHING;

-- ─── staff ───
CREATE TABLE IF NOT EXISTS public.staff (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  position    TEXT DEFAULT 'Nurse',
  department  TEXT DEFAULT 'Nursing',
  is_active   BOOLEAN DEFAULT true,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── schedules ───
CREATE TABLE IF NOT EXISTS public.schedules (
  id          BIGSERIAL PRIMARY KEY,
  staff_id    BIGINT NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  shift_code  TEXT NOT NULL REFERENCES public.shift_types(code),
  work_date   DATE NOT NULL,
  year        INT GENERATED ALWAYS AS (EXTRACT(YEAR FROM work_date)::INT) STORED,
  month       INT GENERATED ALWAYS AS (EXTRACT(MONTH FROM work_date)::INT) STORED,
  created_by  BIGINT,
  updated_by  BIGINT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (staff_id, work_date)
);

CREATE INDEX IF NOT EXISTS idx_schedules_ym ON public.schedules (year, month);

-- ─── app_users (เชื่อม Supabase Auth) ───
CREATE TABLE IF NOT EXISTS public.app_users (
  id          BIGSERIAL PRIMARY KEY,
  auth_id     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── audit_log ───
CREATE TABLE IF NOT EXISTS public.audit_log (
  id          BIGSERIAL PRIMARY KEY,
  user_email  TEXT,
  action      TEXT,
  table_name  TEXT,
  record_id   TEXT,
  new_value   JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── Views ───
CREATE OR REPLACE VIEW public.v_schedules AS
SELECT
  s.work_date,
  s.shift_code,
  st.name_lao AS shift_name_lao,
  st.color_hex,
  f.name AS staff_name,
  f.sort_order AS staff_sort_order
FROM public.schedules s
JOIN public.staff f ON f.id = s.staff_id
JOIN public.shift_types st ON st.code = s.shift_code
WHERE f.is_active = true;

CREATE OR REPLACE VIEW public.v_monthly_summary AS
SELECT
  s.year,
  s.month,
  s.staff_id,
  f.name AS staff_name,
  s.shift_code,
  COUNT(*)::INT AS shift_count
FROM public.schedules s
JOIN public.staff f ON f.id = s.staff_id
WHERE f.is_active = true
GROUP BY s.year, s.month, s.staff_id, f.name, s.shift_code;
