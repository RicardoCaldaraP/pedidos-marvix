-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- PROFILES policies
-- ============================================================
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admin can view all profiles"
  ON profiles FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- ORDERS policies
-- ============================================================
CREATE POLICY "Clients see own orders"
  ON orders FOR SELECT
  USING (
    created_by = auth.uid()
    OR get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Clients can create orders"
  ON orders FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Clients can update own pending orders"
  ON orders FOR UPDATE
  USING (
    (created_by = auth.uid() AND status IN ('new'))
    OR get_user_role(auth.uid()) = 'admin'
  );

-- ============================================================
-- ORDER ATTACHMENTS policies
-- ============================================================
CREATE POLICY "View attachments on accessible orders"
  ON order_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id
      AND (o.created_by = auth.uid() OR get_user_role(auth.uid()) = 'admin')
    )
  );

CREATE POLICY "Upload to accessible orders"
  ON order_attachments FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id
      AND (o.created_by = auth.uid() OR get_user_role(auth.uid()) = 'admin')
    )
  );

CREATE POLICY "Admin can update attachments"
  ON order_attachments FOR UPDATE
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Delete own or admin"
  ON order_attachments FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR get_user_role(auth.uid()) = 'admin'
  );

-- ============================================================
-- COMMENTS policies
-- ============================================================
CREATE POLICY "View comments on accessible orders"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id
      AND (o.created_by = auth.uid() OR get_user_role(auth.uid()) = 'admin')
    )
  );

CREATE POLICY "Comment on accessible orders"
  ON comments FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id
      AND (o.created_by = auth.uid() OR get_user_role(auth.uid()) = 'admin')
    )
  );

-- ============================================================
-- ORDER HISTORY policies
-- ============================================================
CREATE POLICY "View history on accessible orders"
  ON order_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id
      AND (o.created_by = auth.uid() OR get_user_role(auth.uid()) = 'admin')
    )
  );

CREATE POLICY "Insert history on accessible orders"
  ON order_history FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id
      AND (o.created_by = auth.uid() OR get_user_role(auth.uid()) = 'admin')
    )
  );

-- ============================================================
-- NOTIFICATIONS policies
-- ============================================================
CREATE POLICY "Users see own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Users can mark own notifications as read"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================
-- STORAGE: Attachments bucket policies
-- ============================================================
-- Run these after creating the 'attachments' bucket in Supabase Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', TRUE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'attachments');

CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
