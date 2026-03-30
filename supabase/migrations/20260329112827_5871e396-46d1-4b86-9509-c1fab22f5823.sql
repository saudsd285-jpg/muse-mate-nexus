-- Create storage bucket for chat file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-uploads', 'chat-uploads', true);

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chat-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to view their own files
CREATE POLICY "Users can view their own files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'chat-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read for chat-uploads (so AI can access)
CREATE POLICY "Public read for chat uploads" ON storage.objects FOR SELECT USING (bucket_id = 'chat-uploads');

-- Add ai_model column to profiles for storing user preference
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_model TEXT DEFAULT 'google/gemini-3-flash-preview';