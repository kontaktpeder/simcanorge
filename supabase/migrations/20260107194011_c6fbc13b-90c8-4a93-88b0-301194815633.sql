-- Create enum for car status
CREATE TYPE public.car_status AS ENUM ('submitted', 'draft', 'published', 'archived');

-- Create enum for car source
CREATE TYPE public.car_source AS ENUM ('manual', 'submission');

-- Add new columns to cars table
ALTER TABLE public.cars
ADD COLUMN status public.car_status NOT NULL DEFAULT 'draft',
ADD COLUMN submitted_by_email text,
ADD COLUMN submitted_by_name text,
ADD COLUMN source public.car_source NOT NULL DEFAULT 'manual';

-- Migrate existing cars: set status based on published_at
UPDATE public.cars
SET status = CASE 
  WHEN published_at IS NOT NULL AND published_at <= now() THEN 'published'::public.car_status
  ELSE 'draft'::public.car_status
END;

-- Update RLS policy to allow admins to see all cars including submitted ones
-- (existing policies already cover this via has_role check)