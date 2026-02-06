-- Миграция: Разрешить админам обновлять профили пользователей (роли)

-- Удаляем старую политику обновления
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Политика: Пользователи могут обновлять свой профиль (кроме роли)
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id 
        -- Запрещаем пользователям менять свою роль
        -- (роль должна оставаться такой же, если это не админ)
    );

-- Политика: Админы могут обновлять все профили
CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE 
    USING (is_admin_safe())
    WITH CHECK (is_admin_safe());

-- Также создаём RPC функцию для безопасного обновления роли
-- (дополнительная защита - только админ может менять роли)
CREATE OR REPLACE FUNCTION update_user_role(
    target_user_id UUID,
    new_role TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_caller_role TEXT;
BEGIN
    -- Проверяем, что вызывающий является админом
    SELECT role INTO v_caller_role 
    FROM profiles 
    WHERE id = auth.uid();
    
    IF v_caller_role != 'admin' THEN
        RAISE EXCEPTION 'Only admins can change user roles';
    END IF;
    
    -- Проверяем валидность роли
    IF new_role NOT IN ('admin', 'user') THEN
        RAISE EXCEPTION 'Invalid role. Must be admin or user';
    END IF;
    
    -- Не позволяем админу снять роль с самого себя (защита)
    IF target_user_id = auth.uid() AND new_role != 'admin' THEN
        RAISE EXCEPTION 'Cannot remove your own admin role';
    END IF;
    
    -- Обновляем роль
    UPDATE profiles 
    SET role = new_role, updated_at = NOW()
    WHERE id = target_user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
