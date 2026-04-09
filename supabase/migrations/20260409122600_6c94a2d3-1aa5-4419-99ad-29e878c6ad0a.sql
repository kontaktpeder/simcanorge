-- Add page_template to pages
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS page_template text DEFAULT 'modern';
UPDATE public.pages SET page_template = 'modern' WHERE page_template IS NULL;
COMMENT ON COLUMN public.pages.page_template IS 'Layout-template for page_type=club: modern | classic';

-- Add page_id to feed_posts
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS page_id uuid REFERENCES public.pages(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_feed_posts_page_id ON public.feed_posts(page_id);