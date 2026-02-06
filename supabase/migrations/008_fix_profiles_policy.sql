-- ИСПРАВЛЕНИЕ: Удаляем проблемную рекурсивную политику
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Вместо этого создаём безопасную функцию для проверки админа
-- которая не зависит от RLS
CREATE OR REPLACE FUNCTION is_admin_safe()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role 
  FROM profiles 
  WHERE id = auth.uid();
  
  RETURN v_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Обновляем политику для order_items с использованием безопасной функции
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
CREATE POLICY "Admins can view all order items" ON order_items
    FOR SELECT USING (is_admin_safe());

-- Политика для профилей: пользователь видит свой профиль
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Политика для профилей: админы видят все профили (используя безопасную функцию)
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (is_admin_safe());

-- Восстанавливаем политику для обновления своего профиля
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Политика для вставки профиля
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
