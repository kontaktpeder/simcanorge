
-- 1) Orphaned cars: delete car when last owner is removed
CREATE OR REPLACE FUNCTION public.maybe_delete_orphaned_car()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT count(*) FROM public.car_owners WHERE car_id = OLD.car_id) = 0 THEN
    DELETE FROM public.cars WHERE id = OLD.car_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS delete_orphaned_car_trigger ON public.car_owners;
CREATE TRIGGER delete_orphaned_car_trigger
  AFTER DELETE ON public.car_owners
  FOR EACH ROW
  EXECUTE FUNCTION public.maybe_delete_orphaned_car();

-- 2) Storage cleanup for owners
CREATE OR REPLACE FUNCTION public.cleanup_owner_storage()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM storage.objects
  WHERE bucket_id = 'simca-images' AND name LIKE 'owners/' || OLD.id::text || '/%';
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS cleanup_owner_storage_trigger ON public.owners;
CREATE TRIGGER cleanup_owner_storage_trigger
  BEFORE DELETE ON public.owners
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_owner_storage();

-- 3) Storage cleanup for marketplace_items
CREATE OR REPLACE FUNCTION public.cleanup_marketplace_storage()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM storage.objects
  WHERE bucket_id = 'simca-images' AND name LIKE 'marketplace/' || OLD.id::text || '/%';
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS cleanup_marketplace_storage_trigger ON public.marketplace_items;
CREATE TRIGGER cleanup_marketplace_storage_trigger
  BEFORE DELETE ON public.marketplace_items
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_marketplace_storage();

-- 4) Storage cleanup for cars
CREATE OR REPLACE FUNCTION public.cleanup_car_storage()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM storage.objects
  WHERE bucket_id = 'simca-images' AND name LIKE 'cars/' || OLD.id::text || '/%';
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS cleanup_car_storage_trigger ON public.cars;
CREATE TRIGGER cleanup_car_storage_trigger
  BEFORE DELETE ON public.cars
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_car_storage();
