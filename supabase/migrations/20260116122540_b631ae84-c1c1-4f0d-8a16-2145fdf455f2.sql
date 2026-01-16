-- Opprett user_guides tabell for onboarding-tracking
CREATE TABLE public.user_guides (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guide_key text NOT NULL DEFAULT 'garage_onboarding',
  completed_version integer NOT NULL DEFAULT 0,
  dismissed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, guide_key)
);

-- Enable RLS
ALTER TABLE public.user_guides ENABLE ROW LEVEL SECURITY;

-- Bruker kan lese sine egne rader
CREATE POLICY "Users can view their own guide progress"
ON public.user_guides FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Bruker kan opprette sin egen rad
CREATE POLICY "Users can create their own guide progress"
ON public.user_guides FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Bruker kan oppdatere sin egen rad
CREATE POLICY "Users can update their own guide progress"
ON public.user_guides FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_guides_updated_at
BEFORE UPDATE ON public.user_guides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();