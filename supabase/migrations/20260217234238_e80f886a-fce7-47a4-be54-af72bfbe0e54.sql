-- Allow owners to upload their avatar to owners/{owner_id}/avatar.webp
CREATE POLICY "Owners can upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'simca-images'
  AND (storage.foldername(name))[1] = 'owners'
  AND EXISTS (
    SELECT 1 FROM public.owners o
    WHERE o.user_id = auth.uid()
    AND o.id::text = (storage.foldername(name))[2]
  )
);

CREATE POLICY "Owners can update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'simca-images'
  AND (storage.foldername(name))[1] = 'owners'
  AND EXISTS (
    SELECT 1 FROM public.owners o
    WHERE o.user_id = auth.uid()
    AND o.id::text = (storage.foldername(name))[2]
  )
);

CREATE POLICY "Owners can delete own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'simca-images'
  AND (storage.foldername(name))[1] = 'owners'
  AND EXISTS (
    SELECT 1 FROM public.owners o
    WHERE o.user_id = auth.uid()
    AND o.id::text = (storage.foldername(name))[2]
  )
);