
-- Enum for activity type
DO $$ BEGIN
  CREATE TYPE public.activity_type AS ENUM ('drive', 'walk_spotting', 'meetup');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Enum for activity visibility
DO $$ BEGIN
  CREATE TYPE public.activity_visibility AS ENUM ('private', 'public', 'link_only');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- activity_sessions table
CREATE TABLE IF NOT EXISTS public.activity_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type public.activity_type NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  visibility public.activity_visibility NOT NULL DEFAULT 'private',
  summary_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_sessions_user_active
  ON public.activity_sessions (user_id, ended_at);

ALTER TABLE public.activity_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own activity sessions" ON public.activity_sessions;
CREATE POLICY "Users view own activity sessions"
  ON public.activity_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users insert own activity sessions" ON public.activity_sessions;
CREATE POLICY "Users insert own activity sessions"
  ON public.activity_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own activity sessions" ON public.activity_sessions;
CREATE POLICY "Users update own activity sessions"
  ON public.activity_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage activity sessions" ON public.activity_sessions;
CREATE POLICY "Admins manage activity sessions"
  ON public.activity_sessions FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger
DROP TRIGGER IF EXISTS update_activity_sessions_updated_at ON public.activity_sessions;
CREATE TRIGGER update_activity_sessions_updated_at
  BEFORE UPDATE ON public.activity_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Link from car_events to activity_sessions
ALTER TABLE public.car_events
  ADD COLUMN IF NOT EXISTS activity_session_id uuid REFERENCES public.activity_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_car_events_activity_session
  ON public.car_events (activity_session_id);

-- Allow car_id to be NULL for session-level moments
ALTER TABLE public.car_events
  ALTER COLUMN car_id DROP NOT NULL;

-- RLS: allow owners of a session to insert/select moment events tied to their session even if car_id is null
DROP POLICY IF EXISTS "Session owners can insert session moments" ON public.car_events;
CREATE POLICY "Session owners can insert session moments"
  ON public.car_events FOR INSERT
  TO authenticated
  WITH CHECK (
    activity_session_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.activity_sessions s
      WHERE s.id = car_events.activity_session_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Session owners can view session moments" ON public.car_events;
CREATE POLICY "Session owners can view session moments"
  ON public.car_events FOR SELECT
  TO authenticated
  USING (
    activity_session_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.activity_sessions s
      WHERE s.id = car_events.activity_session_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Session owners can update session moments" ON public.car_events;
CREATE POLICY "Session owners can update session moments"
  ON public.car_events FOR UPDATE
  TO authenticated
  USING (
    activity_session_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.activity_sessions s
      WHERE s.id = car_events.activity_session_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Session owners can delete session moments" ON public.car_events;
CREATE POLICY "Session owners can delete session moments"
  ON public.car_events FOR DELETE
  TO authenticated
  USING (
    activity_session_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.activity_sessions s
      WHERE s.id = car_events.activity_session_id
        AND s.user_id = auth.uid()
    )
  );
