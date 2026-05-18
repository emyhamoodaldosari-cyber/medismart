-- ============================================================================
-- MEDISMART CONTACT MESSAGES SCHEMA
-- ============================================================================
-- Run this script in your Supabase SQL editor to set up the contact messages system
-- This creates the contact_messages table and related functions

-- ============================================================================
-- 1. CREATE contact_messages TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text NOT NULL,
  message text NOT NULL,
  message_type text NOT NULL DEFAULT 'general' CHECK (message_type IN ('general', 'support', 'feedback', 'bug', 'feature_request')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'replied', 'resolved')),
  replied_at timestamp with time zone,
  replied_by uuid,
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT contact_messages_pkey PRIMARY KEY (id),
  CONSTRAINT contact_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT contact_messages_replied_by_fkey FOREIGN KEY (replied_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON public.contact_messages(email);
CREATE INDEX IF NOT EXISTS idx_contact_messages_user_id ON public.contact_messages(user_id);

-- ============================================================================
-- 2. CREATE FUNCTION: submit_contact_message
-- ============================================================================
-- This function validates and inserts a new contact message
CREATE OR REPLACE FUNCTION public.submit_contact_message(
  p_name text,
  p_email text,
  p_subject text,
  p_message text,
  p_message_type text DEFAULT 'general',
  p_phone text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_message_id uuid;
BEGIN
  -- Validate inputs
  IF p_name IS NULL OR p_name = '' THEN
    RAISE EXCEPTION 'Name is required';
  END IF;
  
  IF p_email IS NULL OR p_email = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;
  
  IF p_subject IS NULL OR p_subject = '' THEN
    RAISE EXCEPTION 'Subject is required';
  END IF;
  
  IF p_message IS NULL OR p_message = '' THEN
    RAISE EXCEPTION 'Message is required';
  END IF;
  
  -- Validate email format
  IF p_email NOT LIKE '%@%.%' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Validate message type
  IF p_message_type NOT IN ('general', 'support', 'feedback', 'bug', 'feature_request') THEN
    p_message_type := 'general';
  END IF;
  
  -- Insert the contact message
  INSERT INTO public.contact_messages (
    user_id,
    name,
    email,
    phone,
    subject,
    message,
    message_type,
    status,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    TRIM(p_name),
    TRIM(LOWER(p_email)),
    CASE WHEN p_phone IS NOT NULL AND p_phone != '' THEN TRIM(p_phone) ELSE NULL END,
    TRIM(p_subject),
    TRIM(p_message),
    p_message_type,
    'pending',
    now(),
    now()
  )
  RETURNING id INTO v_message_id;
  
  RETURN v_message_id;
END;
$$;

-- ============================================================================
-- 3. CREATE FUNCTION: get_contact_message_stats
-- ============================================================================
-- Returns statistics about contact messages for admin dashboard
CREATE OR REPLACE FUNCTION public.get_contact_message_stats()
RETURNS TABLE (
  total_messages bigint,
  pending_count bigint,
  read_count bigint,
  replied_count bigint,
  resolved_count bigint,
  avg_response_time interval
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_messages,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'read') as read_count,
    COUNT(*) FILTER (WHERE status = 'replied') as replied_count,
    COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
    AVG(EXTRACT(epoch FROM (replied_at - created_at)) * interval '1 second') as avg_response_time
  FROM public.contact_messages;
END;
$$;

-- ============================================================================
-- 4. CREATE FUNCTION: mark_contact_message_as_read
-- ============================================================================
-- Admin function to mark a message as read
CREATE OR REPLACE FUNCTION public.mark_contact_message_as_read(
  p_message_id uuid,
  p_admin_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  UPDATE public.contact_messages
  SET 
    status = 'read',
    updated_at = now()
  WHERE id = p_message_id;
  
  RETURN FOUND;
END;
$$;

-- ============================================================================
-- 5. CREATE FUNCTION: reply_to_contact_message
-- ============================================================================
-- Admin function to mark a message as replied with optional notes
CREATE OR REPLACE FUNCTION public.reply_to_contact_message(
  p_message_id uuid,
  p_admin_id uuid,
  p_admin_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  UPDATE public.contact_messages
  SET 
    status = 'replied',
    replied_at = now(),
    replied_by = p_admin_id,
    admin_notes = p_admin_notes,
    updated_at = now()
  WHERE id = p_message_id;
  
  RETURN FOUND;
END;
$$;

-- ============================================================================
-- 6. CREATE FUNCTION: resolve_contact_message
-- ============================================================================
-- Admin function to mark a message as resolved
CREATE OR REPLACE FUNCTION public.resolve_contact_message(
  p_message_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  UPDATE public.contact_messages
  SET 
    status = 'resolved',
    updated_at = now()
  WHERE id = p_message_id;
  
  RETURN FOUND;
END;
$$;

-- ============================================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert contact messages (creation)
CREATE POLICY "Anyone can submit contact messages"
  ON public.contact_messages
  FOR INSERT
  WITH CHECK (true);

-- Allow users to view their own messages
CREATE POLICY "Users can view their own messages"
  ON public.contact_messages
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow admins to view all messages (based on role)
CREATE POLICY "Admins can view all contact messages"
  ON public.contact_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow admins to update messages
CREATE POLICY "Admins can update contact messages"
  ON public.contact_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- 8. GRANT PERMISSIONS
-- ============================================================================
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.contact_messages TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.submit_contact_message TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_contact_message_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_contact_message_as_read TO authenticated;
GRANT EXECUTE ON FUNCTION public.reply_to_contact_message TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_contact_message TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the setup is correct:

-- Check if table was created
-- SELECT * FROM information_schema.tables WHERE table_name = 'contact_messages';

-- Check if functions were created
-- SELECT routinename FROM information_schema.routines WHERE routine_schema = 'public' AND routinename LIKE 'contact%' OR routinename LIKE '%contact%';

-- Test the function (optional - uncomment to test)
-- SELECT public.submit_contact_message(
--   'John Doe',
--   'john@example.com',
--   'Test Subject',
--   'This is a test message about our pharmacy services',
--   'general',
--   '+966501234567',
--   NULL
-- );
