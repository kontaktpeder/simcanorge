-- Add category column to cars table
ALTER TABLE public.cars 
ADD COLUMN category text NOT NULL DEFAULT 'registrert';

-- Add check constraint for valid categories
ALTER TABLE public.cars 
ADD CONSTRAINT cars_category_check 
CHECK (category IN ('historisk', 'registrert', 'restaurering', 'vrak'));

-- Update existing cars to have a default category based on overhauled status
UPDATE public.cars 
SET category = CASE 
  WHEN overhauled = true THEN 'registrert'
  ELSE 'restaurering'
END;