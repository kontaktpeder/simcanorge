
CREATE POLICY "authenticated_can_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'simca-images');

CREATE POLICY "owner_can_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'simca-images'
    AND (storage.foldername(name))[1] IS NOT NULL
);
