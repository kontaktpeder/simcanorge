-- ─── COMMENTS ───
CREATE TABLE IF NOT EXISTS public.comments (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz,
  author_profile_id   uuid        NOT NULL REFERENCES public.person_profiles(id) ON DELETE CASCADE,
  body                text        NOT NULL,
  parent_id           uuid        REFERENCES public.comments(id) ON DELETE CASCADE,
  is_deleted          boolean     NOT NULL DEFAULT false,
  car_id              uuid        REFERENCES public.cars(id) ON DELETE CASCADE,
  marketplace_item_id uuid        REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
  event_id            uuid        REFERENCES public.events(id) ON DELETE CASCADE,
  feed_post_id        uuid        REFERENCES public.feed_posts(id) ON DELETE CASCADE
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comments"
  ON public.comments FOR SELECT USING (true);

CREATE POLICY "Author can insert comment"
  ON public.comments FOR INSERT
  WITH CHECK (author_profile_id IN (
    SELECT id FROM public.person_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Author can update own comment"
  ON public.comments FOR UPDATE
  USING (author_profile_id IN (
    SELECT id FROM public.person_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Author can delete own comment"
  ON public.comments FOR DELETE
  USING (author_profile_id IN (
    SELECT id FROM public.person_profiles WHERE user_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS comments_car_id_idx
  ON public.comments(car_id) WHERE car_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS comments_event_id_idx
  ON public.comments(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS comments_marketplace_item_id_idx
  ON public.comments(marketplace_item_id) WHERE marketplace_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS comments_feed_post_id_idx
  ON public.comments(feed_post_id) WHERE feed_post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS comments_parent_id_idx
  ON public.comments(parent_id) WHERE parent_id IS NOT NULL;

-- ─── COMMENT LIKES ───
CREATE TABLE IF NOT EXISTS public.comment_likes (
  comment_id  uuid        NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comment likes"
  ON public.comment_likes FOR SELECT USING (true);

CREATE POLICY "Auth can like comment"
  ON public.comment_likes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Auth can unlike comment"
  ON public.comment_likes FOR DELETE
  USING (user_id = auth.uid());

-- ─── FEED POSTS — add edit support ───
ALTER TABLE public.feed_posts
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'feed_posts' AND policyname = 'Author can update own feed post'
  ) THEN
    CREATE POLICY "Author can update own feed post"
      ON public.feed_posts FOR UPDATE
      USING (author_profile_id IN (
        SELECT id FROM public.person_profiles WHERE user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'feed_posts' AND policyname = 'Author can delete own feed post'
  ) THEN
    CREATE POLICY "Author can delete own feed post"
      ON public.feed_posts FOR DELETE
      USING (author_profile_id IN (
        SELECT id FROM public.person_profiles WHERE user_id = auth.uid()
      ));
  END IF;
END $$;