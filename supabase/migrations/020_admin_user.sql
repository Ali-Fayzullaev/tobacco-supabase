-- =====================================================
-- 020: Автоматическое назначение admin для admin2026@gmail.com
-- =====================================================

-- 1. Если пользователь уже зарегистрирован — назначить admin
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin2026@gmail.com';

-- 2. Обновить триггер handle_new_user() — при регистрации admin2026@gmail.com автоматически ставить role='admin'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    _role TEXT := 'user';
BEGIN
    -- Автоматическое назначение роли admin для определённых email
    IF NEW.email = 'admin2026@gmail.com' THEN
        _role := 'admin';
    END IF;

    INSERT INTO public.profiles (id, email, phone, first_name, last_name, birth_date, organization_name, bin_iin, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone'),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        CASE 
            WHEN NEW.raw_user_meta_data->>'birth_date' IS NOT NULL 
                 AND NEW.raw_user_meta_data->>'birth_date' != ''
            THEN (NEW.raw_user_meta_data->>'birth_date')::DATE
            ELSE NULL
        END,
        COALESCE(NEW.raw_user_meta_data->>'organization_name', NULL),
        COALESCE(NEW.raw_user_meta_data->>'bin_iin', NULL),
        _role
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.profiles (id, email, phone, first_name, last_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone'),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        _role
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Защита: нельзя снять admin роль у admin2026@gmail.com
CREATE OR REPLACE FUNCTION public.protect_admin_role()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.email = 'admin2026@gmail.com' AND NEW.role != 'admin' THEN
        RAISE EXCEPTION 'Cannot change role for protected admin user';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_admin_role_trigger ON public.profiles;
CREATE TRIGGER protect_admin_role_trigger
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_admin_role();
