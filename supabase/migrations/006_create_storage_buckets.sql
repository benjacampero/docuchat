-- Create storage buckets
-- Run these in the Supabase Dashboard > Storage or via SQL:

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

INSERT INTO storage.buckets (id, name, public)
VALUES ('page-images', 'page-images', true);

-- Storage policies for documents bucket
CREATE POLICY "Admins can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Authenticated can read documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Storage policies for page-images bucket (public read)
CREATE POLICY "Public read for page images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'page-images');

CREATE POLICY "Service role can manage page images"
  ON storage.objects FOR ALL
  USING (bucket_id = 'page-images' AND auth.role() = 'service_role');
