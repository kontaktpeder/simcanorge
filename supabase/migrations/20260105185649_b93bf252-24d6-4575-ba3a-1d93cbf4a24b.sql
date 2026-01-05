-- Create table for car submissions
CREATE TABLE public.car_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  car_model TEXT NOT NULL,
  car_year INTEGER,
  car_story TEXT,
  images TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'published', 'rejected')),
  admin_notes TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.car_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a car
CREATE POLICY "Anyone can submit cars"
ON public.car_submissions
FOR INSERT
WITH CHECK (true);

-- Admins can view all submissions
CREATE POLICY "Admins can view submissions"
ON public.car_submissions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update submissions
CREATE POLICY "Admins can update submissions"
ON public.car_submissions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete submissions
CREATE POLICY "Admins can delete submissions"
ON public.car_submissions
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_car_submissions_updated_at
BEFORE UPDATE ON public.car_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();