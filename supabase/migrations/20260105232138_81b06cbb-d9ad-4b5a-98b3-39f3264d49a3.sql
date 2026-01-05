-- Add new columns to car_submissions table for additional details
ALTER TABLE public.car_submissions 
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS category text DEFAULT 'registrert',
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';