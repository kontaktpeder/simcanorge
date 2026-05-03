-- Questions MVP
CREATE TABLE IF NOT EXISTS public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  slug text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  car_id uuid REFERENCES public.cars(id) ON DELETE SET NULL,
  author_profile_id uuid NOT NULL REFERENCES public.person_profiles(id) ON DELETE CASCADE,
  is_deleted boolean NOT NULL DEFAULT false,
  CONSTRAINT questions_title_len CHECK (char_length(title) <= 300),
  CONSTRAINT questions_body_len CHECK (char_length(body) <= 8000)
);
CREATE UNIQUE INDEX IF NOT EXISTS questions_slug_key ON public.questions (slug);
CREATE INDEX IF NOT EXISTS questions_created_at_idx ON public.questions (created_at DESC);
CREATE INDEX IF NOT EXISTS questions_car_id_idx ON public.questions (car_id) WHERE car_id IS NOT NULL;

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY questions_select_visible ON public.questions FOR SELECT USING (NOT is_deleted);
CREATE POLICY questions_insert_own ON public.questions FOR INSERT TO authenticated
  WITH CHECK (author_profile_id IN (SELECT id FROM public.person_profiles WHERE user_id = auth.uid()));
CREATE POLICY questions_update_own ON public.questions FOR UPDATE TO authenticated
  USING (author_profile_id IN (SELECT id FROM public.person_profiles WHERE user_id = auth.uid()))
  WITH CHECK (author_profile_id IN (SELECT id FROM public.person_profiles WHERE user_id = auth.uid()));
CREATE POLICY questions_admin_all ON public.questions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Replies
CREATE TABLE IF NOT EXISTS public.question_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  body text NOT NULL,
  author_profile_id uuid NOT NULL REFERENCES public.person_profiles(id) ON DELETE CASCADE,
  is_deleted boolean NOT NULL DEFAULT false,
  CONSTRAINT question_replies_body_len CHECK (char_length(body) <= 8000)
);
CREATE INDEX IF NOT EXISTS question_replies_question_idx ON public.question_replies (question_id, created_at);

ALTER TABLE public.question_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY question_replies_select ON public.question_replies FOR SELECT
  USING (NOT is_deleted AND EXISTS (SELECT 1 FROM public.questions q WHERE q.id = question_id AND NOT q.is_deleted));
CREATE POLICY question_replies_insert ON public.question_replies FOR INSERT TO authenticated
  WITH CHECK (
    author_profile_id IN (SELECT id FROM public.person_profiles WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.questions q WHERE q.id = question_id AND NOT q.is_deleted)
  );
CREATE POLICY question_replies_update_own ON public.question_replies FOR UPDATE TO authenticated
  USING (author_profile_id IN (SELECT id FROM public.person_profiles WHERE user_id = auth.uid()));
CREATE POLICY question_replies_admin_all ON public.question_replies FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Saves
CREATE TABLE IF NOT EXISTS public.question_saves (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_id)
);
ALTER TABLE public.question_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY question_saves_select_own ON public.question_saves FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY question_saves_insert_own ON public.question_saves FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY question_saves_delete_own ON public.question_saves FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY question_saves_admin_all ON public.question_saves FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));