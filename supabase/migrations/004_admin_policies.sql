-- =====================================================
-- ПОЛИТИКИ ДЛЯ АДМИНИСТРАТОРОВ
-- Выполни в Supabase SQL Editor
-- =====================================================

-- Политика для админов - полный доступ к товарам
DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products" ON products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Политика для чтения товаров всеми (только активные)
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
CREATE POLICY "Anyone can view active products" ON products
    FOR SELECT USING (is_active = true);

-- Политики для категорий
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
CREATE POLICY "Anyone can view categories" ON categories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
CREATE POLICY "Admins can manage categories" ON categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Политики для атрибутов товаров
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view product_attributes" ON product_attributes;
CREATE POLICY "Anyone can view product_attributes" ON product_attributes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage product_attributes" ON product_attributes;
CREATE POLICY "Admins can manage product_attributes" ON product_attributes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Проверяем что RLS включен
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Готово!
SELECT 'Политики для админов созданы!' as result;
