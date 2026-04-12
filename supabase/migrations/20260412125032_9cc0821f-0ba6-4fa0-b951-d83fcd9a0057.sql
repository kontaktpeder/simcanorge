UPDATE public.person_profiles pp
SET contact_email = au.email::text
FROM auth.users au
WHERE pp.user_id = au.id
  AND (pp.contact_email IS NULL OR btrim(pp.contact_email) = '')
  AND au.email IS NOT NULL
  AND btrim(au.email::text) <> '';