-- Publication requests tabell
CREATE TABLE public.car_publication_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID REFERENCES public.cars(id) ON DELETE CASCADE NOT NULL,
  requested_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('publish', 'unpublish')),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'approved', 'rejected', 'cancelled')),
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id)
);

-- Unique constraint: kun 1 open request per car_id
CREATE UNIQUE INDEX car_publication_requests_one_open_per_car
ON public.car_publication_requests(car_id)
WHERE status = 'open';

-- Indexer for rask oppslag
CREATE INDEX idx_car_publication_requests_car_id ON public.car_publication_requests(car_id);
CREATE INDEX idx_car_publication_requests_requested_by ON public.car_publication_requests(requested_by);
CREATE INDEX idx_car_publication_requests_status ON public.car_publication_requests(status);

-- Notifications tabell
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  car_id UUID REFERENCES public.cars(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexer
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- RLS for car_publication_requests
ALTER TABLE public.car_publication_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own publication requests"
ON public.car_publication_requests FOR SELECT
TO authenticated
USING (
  requested_by = auth.uid() OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Owners can insert publication requests for their cars"
ON public.car_publication_requests FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.car_owners
    WHERE car_owners.car_id = car_publication_requests.car_id
    AND car_owners.user_id = auth.uid()
    AND car_owners.role = 'owner'
  )
  AND requested_by = auth.uid()
  AND status = 'open'
);

CREATE POLICY "Admins can update publication requests"
ON public.car_publication_requests FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can cancel their own open requests"
ON public.car_publication_requests FOR DELETE
TO authenticated
USING (
  requested_by = auth.uid() AND status = 'open'
);

-- RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));