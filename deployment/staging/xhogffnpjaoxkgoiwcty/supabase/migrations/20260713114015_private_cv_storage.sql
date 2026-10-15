-- CVs contain identity and employment information. Keep them private and
-- serve them through short-lived signed URLs rather than a public bucket.
INSERT INTO storage.buckets (id, name, public)
VALUES ('cv_files', 'cv_files', false);

CREATE POLICY "Users can view their own CV files"
ON storage.objects FOR SELECT
USING (bucket_id = 'cv_files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own CV files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cv_files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own CV files"
ON storage.objects FOR DELETE
USING (bucket_id = 'cv_files' AND auth.uid()::text = (storage.foldername(name))[1]);
