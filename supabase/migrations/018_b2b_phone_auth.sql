-- =====================================================
-- 018: B2B PHONE AUTH — поля организации + phone-based signup
-- =====================================================

-- Добавляем B2B-поля в profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bin_iin TEXT;

-- Валидация БИН/ИИН: ровно 12 цифр
ALTER TABLE profiles ADD CONSTRAINT bin_iin_format
  CHECK (bin_iin IS NULL OR bin_iin ~ '^\d{12}$');

-- Обновляем триггер: теперь при phone-based signup email может быть NULL,
-- зато phone берётся из auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, phone, first_name, last_name, birth_date, organization_name, bin_iin)
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
        COALESCE(NEW.raw_user_meta_data->>'bin_iin', NULL)
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.profiles (id, email, phone, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone'),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
