-- BillSense AI Supabase Storage Bucket Setup & RLS Policies

-- 1. Create a public storage bucket named "documents"
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Security Policy: Allow Public Access to read documents
CREATE POLICY "Public Read Access for Documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

-- 3. Storage Security Policy: Allow Authenticated Users / Service Role to upload documents
CREATE POLICY "Allow Document Uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents');

-- 4. Storage Security Policy: Allow Document Deletion
CREATE POLICY "Allow Document Deletion"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents');
