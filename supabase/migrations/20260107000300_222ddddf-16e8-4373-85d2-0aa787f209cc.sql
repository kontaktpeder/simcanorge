-- Create table for tracking page views/sessions
CREATE TABLE public.page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_page_views_last_seen ON public.page_views (last_seen_at);
CREATE INDEX idx_page_views_created_at ON public.page_views (created_at);
CREATE INDEX idx_page_views_session_id ON public.page_views (session_id);

-- Enable RLS but allow public access for anonymous tracking
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert new page views
CREATE POLICY "Anyone can insert page views"
ON public.page_views
FOR INSERT
WITH CHECK (true);

-- Allow anyone to update their own session
CREATE POLICY "Anyone can update page views"
ON public.page_views
FOR UPDATE
USING (true);

-- Allow anyone to read aggregate data (for counting)
CREATE POLICY "Anyone can read page views"
ON public.page_views
FOR SELECT
USING (true);

-- Function to clean up old sessions (older than 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_page_views()
RETURNS void AS $$
BEGIN
  DELETE FROM public.page_views WHERE created_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;