-- Create support_tickets table
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'seen', 'in_progress', 'resolved', 'not_a_bug')),
  type text NOT NULL CHECK (type IN ('bug', 'suggestion', 'content', 'other')),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  action_text text,
  result_text text,
  page text,
  screenshot_url text,
  debug_payload jsonb,
  admin_notes text,
  app_version text
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can insert (anonymous and authenticated)
CREATE POLICY "Anyone can create support tickets"
  ON public.support_tickets
  FOR INSERT
  WITH CHECK (true);

-- Users can see their own tickets
CREATE POLICY "Users can view own tickets"
  ON public.support_tickets
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can see all tickets
CREATE POLICY "Admins can view all tickets"
  ON public.support_tickets
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update
CREATE POLICY "Only admins can update tickets"
  ON public.support_tickets
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for admin queries
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_severity ON public.support_tickets(severity);
CREATE INDEX idx_support_tickets_created_at ON public.support_tickets(created_at DESC);
CREATE INDEX idx_support_tickets_user_id ON public.support_tickets(user_id);

-- Create storage bucket for screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'support-screenshots',
  'support-screenshots',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: anyone can upload
CREATE POLICY "Anyone can upload support screenshots"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'support-screenshots');

-- Storage policy: admins can read
CREATE POLICY "Admins can read support screenshots"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'support-screenshots' AND
    public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Storage policy: admins can delete
CREATE POLICY "Admins can delete support screenshots"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'support-screenshots' AND
    public.has_role(auth.uid(), 'admin'::app_role)
  );