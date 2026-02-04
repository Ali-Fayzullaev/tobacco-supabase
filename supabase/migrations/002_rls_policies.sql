-- =====================================================
-- TOBACCO SHOP - ROW LEVEL SECURITY POLICIES
-- =====================================================
-- Эти политики обеспечивают безопасность данных:
-- - Каталог виден ТОЛЬКО авторизованным пользователям 18+
-- - Пользователи видят только свои данные
-- - Админы имеют полный доступ
-- =====================================================

-- Включаем RLS для всех таблиц
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
-- =====================================================

-- Проверка: пользователь совершеннолетний (18+)
CREATE OR REPLACE FUNCTION is_adult()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND birth_date <= CURRENT_DATE - INTERVAL '18 years'
        AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Проверка: пользователь - администратор
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND is_admin = TRUE
        AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Проверка: пользователь активен
CREATE OR REPLACE FUNCTION is_active_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ПОЛИТИКИ: PROFILES (Профили пользователей)
-- =====================================================

-- Пользователь видит только свой профиль
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Пользователь может обновлять свой профиль
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id 
    AND is_admin = (SELECT is_admin FROM profiles WHERE id = auth.uid()) -- Нельзя самому стать админом
);

-- Админ видит все профили
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (is_admin());

-- Админ может обновлять любой профиль
CREATE POLICY "Admins can update any profile"
ON profiles FOR UPDATE
USING (is_admin());

-- =====================================================
-- ПОЛИТИКИ: CATEGORIES (Категории)
-- =====================================================

-- Категории видны только авторизованным взрослым
CREATE POLICY "Categories visible to authenticated adults"
ON categories FOR SELECT
USING (
    is_adult() 
    AND is_active = TRUE
);

-- Админы могут всё с категориями
CREATE POLICY "Admins full access to categories"
ON categories FOR ALL
USING (is_admin());

-- =====================================================
-- ПОЛИТИКИ: PRODUCTS (Товары) - САМЫЕ ВАЖНЫЕ!
-- =====================================================

-- ⚠️ КЛЮЧЕВАЯ ПОЛИТИКА: Товары видны ТОЛЬКО авторизованным взрослым
CREATE POLICY "Products visible only to authenticated adults"
ON products FOR SELECT
USING (
    is_adult()
    AND is_active = TRUE
    AND is_deleted = FALSE
);

-- Админы видят все товары (включая удалённые)
CREATE POLICY "Admins can view all products"
ON products FOR SELECT
USING (is_admin());

-- Только админы могут создавать товары
CREATE POLICY "Only admins can insert products"
ON products FOR INSERT
WITH CHECK (is_admin());

-- Только админы могут обновлять товары
CREATE POLICY "Only admins can update products"
ON products FOR UPDATE
USING (is_admin());

-- Только админы могут удалять товары
CREATE POLICY "Only admins can delete products"
ON products FOR DELETE
USING (is_admin());

-- =====================================================
-- ПОЛИТИКИ: PRODUCT_IMAGES (Изображения товаров)
-- =====================================================

-- Изображения видны только если виден товар
CREATE POLICY "Product images visible with products"
ON product_images FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM products p
        WHERE p.id = product_id
        AND is_adult()
        AND p.is_active = TRUE
        AND p.is_deleted = FALSE
    )
    OR is_admin()
);

-- Только админы могут управлять изображениями
CREATE POLICY "Admins manage product images"
ON product_images FOR ALL
USING (is_admin());

-- =====================================================
-- ПОЛИТИКИ: PRODUCT_ATTRIBUTES (Атрибуты товаров)
-- =====================================================

-- Атрибуты видны только если виден товар
CREATE POLICY "Product attributes visible with products"
ON product_attributes FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM products p
        WHERE p.id = product_id
        AND is_adult()
        AND p.is_active = TRUE
        AND p.is_deleted = FALSE
    )
    OR is_admin()
);

-- Только админы могут управлять атрибутами
CREATE POLICY "Admins manage product attributes"
ON product_attributes FOR ALL
USING (is_admin());

-- =====================================================
-- ПОЛИТИКИ: ADDRESSES (Адреса доставки)
-- =====================================================

-- Пользователь видит только свои адреса
CREATE POLICY "Users view own addresses"
ON addresses FOR SELECT
USING (auth.uid() = user_id);

-- Пользователь управляет своими адресами
CREATE POLICY "Users manage own addresses"
ON addresses FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_active_user());

CREATE POLICY "Users update own addresses"
ON addresses FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users delete own addresses"
ON addresses FOR DELETE
USING (auth.uid() = user_id);

-- Админ видит все адреса
CREATE POLICY "Admins view all addresses"
ON addresses FOR SELECT
USING (is_admin());

-- =====================================================
-- ПОЛИТИКИ: ORDERS (Заказы)
-- =====================================================

-- Пользователь видит только свои заказы
CREATE POLICY "Users view own orders"
ON orders FOR SELECT
USING (auth.uid() = user_id);

-- Пользователь может создать заказ (если взрослый)
CREATE POLICY "Adults can create orders"
ON orders FOR INSERT
WITH CHECK (
    auth.uid() = user_id 
    AND is_adult()
);

-- Админ видит все заказы
CREATE POLICY "Admins view all orders"
ON orders FOR SELECT
USING (is_admin());

-- Только админ может обновлять заказы
CREATE POLICY "Only admins can update orders"
ON orders FOR UPDATE
USING (is_admin());

-- =====================================================
-- ПОЛИТИКИ: ORDER_ITEMS (Позиции заказа)
-- =====================================================

-- Пользователь видит позиции своих заказов
CREATE POLICY "Users view own order items"
ON order_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM orders o
        WHERE o.id = order_id
        AND o.user_id = auth.uid()
    )
);

-- Админ видит все позиции
CREATE POLICY "Admins view all order items"
ON order_items FOR SELECT
USING (is_admin());

-- Вставка позиций через транзакцию (функцию)
CREATE POLICY "Insert order items via function"
ON order_items FOR INSERT
WITH CHECK (is_active_user() OR is_admin());

-- =====================================================
-- ПОЛИТИКИ: CART_ITEMS (Корзина)
-- =====================================================

-- Пользователь видит свою корзину
CREATE POLICY "Users view own cart"
ON cart_items FOR SELECT
USING (auth.uid() = user_id);

-- Пользователь управляет своей корзиной (только взрослые)
CREATE POLICY "Adults manage own cart"
ON cart_items FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_adult());

CREATE POLICY "Users update own cart"
ON cart_items FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users delete from own cart"
ON cart_items FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- ПОЛИТИКИ: FAVORITES (Избранное)
-- =====================================================

-- Пользователь видит своё избранное
CREATE POLICY "Users view own favorites"
ON favorites FOR SELECT
USING (auth.uid() = user_id);

-- Пользователь управляет избранным (только взрослые)
CREATE POLICY "Adults manage own favorites"
ON favorites FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_adult());

CREATE POLICY "Users delete own favorites"
ON favorites FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- ПОЛИТИКИ: PASSWORD_RESET_TOKENS
-- =====================================================

-- Токены видит только владелец
CREATE POLICY "Users view own tokens"
ON password_reset_tokens FOR SELECT
USING (auth.uid() = user_id);

-- Вставка через функцию
CREATE POLICY "Insert tokens via function"
ON password_reset_tokens FOR INSERT
WITH CHECK (TRUE);

-- =====================================================
-- ПОЛИТИКИ: PRODUCT_CHANGE_LOG (Аудит)
-- =====================================================

-- Только админы видят лог изменений
CREATE POLICY "Only admins view change log"
ON product_change_log FOR SELECT
USING (is_admin());

-- Только админы могут записывать в лог
CREATE POLICY "Only admins insert change log"
ON product_change_log FOR INSERT
WITH CHECK (is_admin());

-- =====================================================
-- ПОЛИТИКИ: REVIEWS (Отзывы)
-- =====================================================

-- Одобренные отзывы видны всем авторизованным
CREATE POLICY "Approved reviews visible to adults"
ON reviews FOR SELECT
USING (
    (is_approved = TRUE AND is_adult())
    OR auth.uid() = user_id
    OR is_admin()
);

-- Пользователь может создать отзыв
CREATE POLICY "Adults can create reviews"
ON reviews FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_adult());

-- Пользователь может обновить свой отзыв
CREATE POLICY "Users update own reviews"
ON reviews FOR UPDATE
USING (auth.uid() = user_id);

-- Админ может всё с отзывами
CREATE POLICY "Admins manage reviews"
ON reviews FOR ALL
USING (is_admin());

-- =====================================================
-- ПОЛИТИКИ: NOTIFICATIONS (Уведомления)
-- =====================================================

-- Пользователь видит свои уведомления
CREATE POLICY "Users view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- Пользователь может отмечать прочитанными
CREATE POLICY "Users update own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Вставка через функции/триггеры
CREATE POLICY "Insert notifications via system"
ON notifications FOR INSERT
WITH CHECK (is_admin() OR auth.uid() = user_id);

-- =====================================================
-- ПОЛИТИКИ: INTEGRATION_SETTINGS (Настройки интеграции)
-- =====================================================

-- Только админы видят настройки интеграции
CREATE POLICY "Only admins access integration settings"
ON integration_settings FOR ALL
USING (is_admin());

-- =====================================================
-- ПОЛИТИКИ: SYNC_LOG (Лог синхронизации)
-- =====================================================

-- Только админы видят лог синхронизации
CREATE POLICY "Only admins access sync log"
ON sync_log FOR SELECT
USING (is_admin());

-- Вставка через систему
CREATE POLICY "System inserts sync log"
ON sync_log FOR INSERT
WITH CHECK (is_admin());
