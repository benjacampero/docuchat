-- Create document_pages table
CREATE TABLE document_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  image_path TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(document_id, page_number)
);

-- RLS
ALTER TABLE document_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view pages"
  ON document_pages FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage pages"
  ON document_pages FOR ALL
  USING (auth.role() = 'service_role');
