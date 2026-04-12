
-- Clean up orphaned account_requests rows first
DELETE FROM public.account_requests
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Fix FK: car_invitations.created_by missing ON DELETE
ALTER TABLE public.car_invitations
  DROP CONSTRAINT IF EXISTS car_invitations_created_by_fkey,
  ADD CONSTRAINT car_invitations_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix FK: car_publication_requests.resolved_by missing ON DELETE
ALTER TABLE public.car_publication_requests
  DROP CONSTRAINT IF EXISTS car_publication_requests_resolved_by_fkey,
  ADD CONSTRAINT car_publication_requests_resolved_by_fkey
    FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix FK: cars.approved_by missing ON DELETE
ALTER TABLE public.cars
  DROP CONSTRAINT IF EXISTS cars_approved_by_fkey,
  ADD CONSTRAINT cars_approved_by_fkey
    FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add FK on account_requests.user_id so rows are cleaned up on user delete
ALTER TABLE public.account_requests
  ADD CONSTRAINT account_requests_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create purge function for data not covered by FK cascades
CREATE OR REPLACE FUNCTION public.purge_user_data_before_auth_delete(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete cars where user is the ONLY owner
  DELETE FROM public.cars c
  WHERE EXISTS (
    SELECT 1 FROM public.car_owners co
    WHERE co.car_id = c.id AND co.user_id = _user_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.car_owners co2
    WHERE co2.car_id = c.id AND co2.user_id <> _user_id
  );

  -- Remove ownership rows for shared cars
  DELETE FROM public.car_owners WHERE user_id = _user_id;

  -- Clean up comment_likes (no FK to auth.users)
  DELETE FROM public.comment_likes WHERE user_id = _user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_user_data_before_auth_delete(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_user_data_before_auth_delete(uuid) TO service_role;
