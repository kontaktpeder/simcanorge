-- Allow owners of marketplace items to upload images to marketplace/{item_id}/images/
CREATE POLICY "Owners can upload marketplace item images"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'simca-images'
  AND (storage.foldername(name))[1] = 'marketplace'
  AND (storage.foldername(name))[2] IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.marketplace_items m
    JOIN public.owners o ON o.id = m.owner_id
    WHERE o.user_id = auth.uid()
    AND m.id::text = (storage.foldername(name))[2]
  )
);

-- Allow owners to update their marketplace images
CREATE POLICY "Owners can update marketplace item images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'simca-images'
  AND (storage.foldername(name))[1] = 'marketplace'
  AND EXISTS (
    SELECT 1 FROM public.marketplace_items m
    JOIN public.owners o ON o.id = m.owner_id
    WHERE o.user_id = auth.uid()
    AND m.id::text = (storage.foldername(name))[2]
  )
);

-- Allow owners to delete their marketplace images
CREATE POLICY "Owners can delete marketplace item images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'simca-images'
  AND (storage.foldername(name))[1] = 'marketplace'
  AND EXISTS (
    SELECT 1 FROM public.marketplace_items m
    JOIN public.owners o ON o.id = m.owner_id
    WHERE o.user_id = auth.uid()
    AND m.id::text = (storage.foldername(name))[2]
  )
);