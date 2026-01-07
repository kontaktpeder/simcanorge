-- Allow anyone to insert cars with status 'submitted' (for public submissions)
CREATE POLICY "Anyone can submit cars"
ON public.cars
FOR INSERT
WITH CHECK (status = 'submitted' AND published_at IS NULL AND source = 'submission');