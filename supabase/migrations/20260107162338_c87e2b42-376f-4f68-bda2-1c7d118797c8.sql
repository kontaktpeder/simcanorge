-- Allow anyone to upload images to the submissions folder
CREATE POLICY "Anyone can upload to submissions folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'simca-images' 
  AND (storage.foldername(name))[1] = 'submissions'
);