-- =====================================================
-- Разрешаем ВСЕМ (включая анонимных) читать товары
-- Раньше: только authenticated
-- =====================================================

DROP POLICY IF EXISTS "Authenticated can view products" ON products;
DROP POLICY IF EXISTS "Anyone can view products" ON products;

CREATE POLICY "Anyone can view products" ON products
    FOR SELECT USING (is_active = true);
