
-- Add file_url column to cv_records
ALTER TABLE public.cv_records ADD COLUMN file_url text;

-- Create storage bucket for CV files
INSERT INTO storage.buckets (id, name, public) VALUES ('cv_files', 'cv_files', true);

-- Storage policies
CREATE POLICY "Users can view their own CV files"
ON storage.objects FOR SELECT
USING (bucket_id = 'cv_files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own CV files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cv_files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own CV files"
ON storage.objects FOR DELETE
USING (bucket_id = 'cv_files' AND auth.uid()::text = (storage.foldername(name))[1]);
