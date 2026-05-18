-- Coluna para armazenar o Expo Push Token do dispositivo do usuário
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;
