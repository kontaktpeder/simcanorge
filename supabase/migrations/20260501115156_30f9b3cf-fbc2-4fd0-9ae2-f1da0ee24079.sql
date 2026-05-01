-- 1) saved_cars table
CREATE TABLE IF NOT EXISTS public.saved_cars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (car_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_cars_user_id ON public.saved_cars(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_cars_car_id ON public.saved_cars(car_id);

ALTER TABLE public.saved_cars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_cars_select_own" ON public.saved_cars;
CREATE POLICY "saved_cars_select_own"
  ON public.saved_cars FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_cars_insert_own" ON public.saved_cars;
CREATE POLICY "saved_cars_insert_own"
  ON public.saved_cars FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_cars_delete_own" ON public.saved_cars;
CREATE POLICY "saved_cars_delete_own"
  ON public.saved_cars FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 2) car_events activity fields
ALTER TABLE public.car_events
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'private',
  ADD COLUMN IF NOT EXISTS occurred_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS data jsonb NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'car_events_visibility_chk'
  ) THEN
    ALTER TABLE public.car_events
      ADD CONSTRAINT car_events_visibility_chk
      CHECK (visibility IN ('private', 'public', 'link_only'));
  END IF;
END $$;

-- 3) Public read policy for public car_events
DROP POLICY IF EXISTS "Anyone can view public car events" ON public.car_events;
CREATE POLICY "Anyone can view public car events"
  ON public.car_events FOR SELECT
  TO public
  USING (visibility = 'public');

-- 4) Add 'spotting' to car_source enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'spotting'
      AND enumtypid = 'public.car_source'::regtype
  ) THEN
    ALTER TYPE public.car_source ADD VALUE 'spotting';
  END IF;
END $$;