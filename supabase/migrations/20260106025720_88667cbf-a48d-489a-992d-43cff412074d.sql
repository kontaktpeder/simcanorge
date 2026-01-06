-- Add allow_edits consent field to car_submissions
ALTER TABLE public.car_submissions 
ADD COLUMN allow_edits boolean NOT NULL DEFAULT false;