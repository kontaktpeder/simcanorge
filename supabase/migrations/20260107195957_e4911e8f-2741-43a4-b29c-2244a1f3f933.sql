-- Create car_owners table for linking users to cars
CREATE TABLE public.car_owners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (car_id, user_id)
);

-- Create car_invitations table for magic link invitations
CREATE TABLE public.car_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.car_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_invitations ENABLE ROW LEVEL SECURITY;

-- Policies for car_owners
CREATE POLICY "Admins can manage car_owners"
ON public.car_owners
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own car ownership"
ON public.car_owners
FOR SELECT
USING (user_id = auth.uid());

-- Policies for car_invitations
CREATE POLICY "Admins can manage car_invitations"
ON public.car_invitations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view invitation by token"
ON public.car_invitations
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can use invitations"
ON public.car_invitations
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can insert car_owners with valid invitation"
ON public.car_owners
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.car_invitations
    WHERE car_invitations.car_id = car_owners.car_id
      AND car_invitations.email = car_owners.email
      AND car_invitations.used_at IS NULL
      AND car_invitations.expires_at > now()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);