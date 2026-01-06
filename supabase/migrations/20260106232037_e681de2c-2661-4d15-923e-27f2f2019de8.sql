-- Add variant and body_type columns to cars table
ALTER TABLE public.cars 
ADD COLUMN variant text,
ADD COLUMN body_type text;

-- Add variant and body_type columns to car_submissions table
ALTER TABLE public.car_submissions 
ADD COLUMN variant text,
ADD COLUMN body_type text;