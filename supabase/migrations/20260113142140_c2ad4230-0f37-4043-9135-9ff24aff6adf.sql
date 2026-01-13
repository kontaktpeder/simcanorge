-- Drop and recreate the "Anyone can submit cars" policy to explicitly include all roles
DROP POLICY IF EXISTS "Anyone can submit cars" ON public.cars;

-- Create a new policy that allows BOTH anonymous and authenticated users to submit cars
CREATE POLICY "Anyone can submit cars"
ON public.cars
FOR INSERT
TO public
WITH CHECK (
  status = 'submitted' 
  AND published_at IS NULL 
  AND source = 'submission'
);