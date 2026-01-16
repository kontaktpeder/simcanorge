-- La eiere laste opp bilder til sine biler
CREATE POLICY "Owners can upload images to their cars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'simca-images' 
  AND (
    EXISTS (
      SELECT 1 FROM public.car_owners
      WHERE car_owners.user_id = auth.uid()
      AND car_owners.role = 'owner'
      AND (storage.objects.name LIKE 'cars/' || car_owners.car_id::text || '/images/%')
    )
  )
);

-- La eiere oppdatere bilder på sine biler
CREATE POLICY "Owners can update images of their cars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'simca-images'
  AND EXISTS (
    SELECT 1 FROM public.car_owners
    WHERE car_owners.user_id = auth.uid()
    AND car_owners.role = 'owner'
    AND (storage.objects.name LIKE 'cars/' || car_owners.car_id::text || '/images/%')
  )
)
WITH CHECK (
  bucket_id = 'simca-images'
  AND EXISTS (
    SELECT 1 FROM public.car_owners
    WHERE car_owners.user_id = auth.uid()
    AND car_owners.role = 'owner'
    AND (storage.objects.name LIKE 'cars/' || car_owners.car_id::text || '/images/%')
  )
);

-- La eiere slette bilder på sine biler
CREATE POLICY "Owners can delete images of their cars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'simca-images'
  AND EXISTS (
    SELECT 1 FROM public.car_owners
    WHERE car_owners.user_id = auth.uid()
    AND car_owners.role = 'owner'
    AND (storage.objects.name LIKE 'cars/' || car_owners.car_id::text || '/images/%')
  )
);