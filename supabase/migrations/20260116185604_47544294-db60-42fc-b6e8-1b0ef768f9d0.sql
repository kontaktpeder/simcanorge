-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Anyone can create support tickets" ON public.support_tickets;

-- Create new INSERT policy that explicitly allows both anon and authenticated
CREATE POLICY "Anyone can create support tickets"
  ON public.support_tickets
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);