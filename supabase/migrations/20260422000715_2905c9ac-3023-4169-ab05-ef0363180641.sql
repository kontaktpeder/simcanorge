-- Enable RLS and public read access for car catalog tables
ALTER TABLE public.car_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read car brands"
ON public.car_brands
FOR SELECT
USING (true);

CREATE POLICY "Anyone can read car models"
ON public.car_models
FOR SELECT
USING (true);