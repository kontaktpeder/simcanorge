-- Profile approval is unused. Selling and public pages do not depend on it.
DROP FUNCTION IF EXISTS public.admin_approve_person_profile(uuid);
