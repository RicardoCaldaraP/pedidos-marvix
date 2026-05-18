-- ============================================================
-- SEED: Create admin and client users
-- ============================================================
-- Run this in the Supabase SQL Editor after applying migrations.
-- Replace the emails and passwords with the real ones.

-- Create admin user (you)
SELECT supabase_functions.http_request(
  'POST',
  current_setting('app.settings.external_url') || '/auth/v1/admin/users',
  '{"Content-Type": "application/json", "apikey": "' || current_setting('app.settings.service_role_key') || '", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}',
  '{"email": "admin@marvix.com", "password": "SUA_SENHA_ADMIN", "email_confirm": true, "user_metadata": {"full_name": "Administrador Marvix", "role": "admin"}}',
  '1000'
);

-- Create client user (seus pais)
-- You can do this directly in Supabase Dashboard > Auth > Users
-- Or via the API as above.

-- Alternatively, after users are created via Supabase Auth UI,
-- run this to set roles manually:
-- UPDATE profiles SET role = 'admin' WHERE email = 'your_admin_email@example.com';
-- UPDATE profiles SET role = 'client' WHERE email = 'client_email@example.com';
