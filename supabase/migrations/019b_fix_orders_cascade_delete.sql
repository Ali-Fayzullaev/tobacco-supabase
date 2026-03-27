-- =====================================================
-- FIX: Добавить ON DELETE CASCADE для orders.user_id
-- Без этого нельзя удалить пользователя из Supabase Dashboard
-- =====================================================

-- Удаляем старый FK
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

-- Создаём новый FK с CASCADE
ALTER TABLE orders 
  ADD CONSTRAINT orders_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
