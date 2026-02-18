
-- Fix cleanup functions to handle "Direct deletion from storage tables is not allowed" error
CREATE OR REPLACE FUNCTION public.cleanup_owner_storage()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Storage cleanup is now handled via Storage API in edge functions
  -- Direct SQL deletion from storage.objects is not allowed
  RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_marketplace_storage()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_car_storage()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN OLD;
END;
$function$;
