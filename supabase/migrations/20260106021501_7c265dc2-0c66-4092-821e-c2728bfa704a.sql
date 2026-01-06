-- Add brand column to cars table
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS brand text;

-- Add brand column to car_submissions table  
ALTER TABLE public.car_submissions ADD COLUMN IF NOT EXISTS brand text;