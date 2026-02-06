-- Исправляем политику для products используя безопасную функцию
DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products" ON products
    FOR ALL USING (is_admin_safe())
    WITH CHECK (is_admin_safe());

-- Исправляем политику для categories
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
CREATE POLICY "Admins can manage categories" ON categories
    FOR ALL USING (is_admin_safe())
    WITH CHECK (is_admin_safe());

-- Исправляем политику для orders
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders" ON orders
    FOR SELECT USING (is_admin_safe());

DROP POLICY IF EXISTS "Admins can update orders" ON orders;
CREATE POLICY "Admins can update orders" ON orders
    FOR UPDATE USING (is_admin_safe())
    WITH CHECK (is_admin_safe());
