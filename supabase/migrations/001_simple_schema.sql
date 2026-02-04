-- =====================================================
-- TOBACCO SHOP - ПРОСТАЯ СХЕМА БАЗЫ ДАННЫХ
-- Выполни этот скрипт в Supabase SQL Editor
-- =====================================================

-- Включаем расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. ПРОФИЛИ ПОЛЬЗОВАТЕЛЕЙ
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    birth_date DATE,
    city TEXT,
    address TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Автоматическое создание профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name, birth_date)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        (NEW.raw_user_meta_data->>'birth_date')::DATE
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер для создания профиля
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 2. КАТЕГОРИИ
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_kk TEXT,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. ТОВАРЫ
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_kk TEXT,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    description_kk TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    old_price DECIMAL(10,2),
    image_url TEXT,
    sku TEXT,
    brand TEXT,
    category_id UUID REFERENCES categories(id),
    in_stock BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. ИЗОБРАЖЕНИЯ ТОВАРОВ
-- =====================================================
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. АТРИБУТЫ ТОВАРОВ
-- =====================================================
CREATE TABLE IF NOT EXISTS product_attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    value TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
);

-- =====================================================
-- 6. КОРЗИНА
-- =====================================================
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- =====================================================
-- 7. ИЗБРАННОЕ
-- =====================================================
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- =====================================================
-- 8. ЗАКАЗЫ
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    order_number TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    delivery_method TEXT,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    shipping_address JSONB,
    phone TEXT,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Генерация номера заказа
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                        LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_order_number ON orders;
CREATE TRIGGER set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL)
    EXECUTE FUNCTION generate_order_number();

-- =====================================================
-- 9. ПОЗИЦИИ ЗАКАЗА
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- RLS ПОЛИТИКИ (Row Level Security)
-- =====================================================

-- Включаем RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Профили: пользователь видит и редактирует только свой профиль
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Категории: все могут читать
CREATE POLICY "Anyone can view categories" ON categories
    FOR SELECT USING (true);

-- Товары: все авторизованные могут читать
CREATE POLICY "Authenticated can view products" ON products
    FOR SELECT TO authenticated USING (is_active = true);

-- Изображения товаров
CREATE POLICY "Anyone can view product images" ON product_images
    FOR SELECT USING (true);

-- Атрибуты товаров
CREATE POLICY "Anyone can view product attributes" ON product_attributes
    FOR SELECT USING (true);

-- Корзина: только владелец
CREATE POLICY "Users manage own cart" ON cart_items
    FOR ALL USING (auth.uid() = user_id);

-- Избранное: только владелец
CREATE POLICY "Users manage own favorites" ON favorites
    FOR ALL USING (auth.uid() = user_id);

-- Заказы: пользователь видит только свои
CREATE POLICY "Users view own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create own orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Позиции заказа
CREATE POLICY "Users view own order items" ON order_items
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
    );

CREATE POLICY "Users create order items" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
    );

-- =====================================================
-- АДМИН ПОЛИТИКИ
-- =====================================================

-- Функция проверки админа
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Админ может всё с товарами
CREATE POLICY "Admins can manage products" ON products
    FOR ALL USING (is_admin());

CREATE POLICY "Admins can manage categories" ON categories
    FOR ALL USING (is_admin());

CREATE POLICY "Admins can view all orders" ON orders
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update orders" ON orders
    FOR UPDATE USING (is_admin());

-- =====================================================
-- ТЕСТОВЫЕ ДАННЫЕ
-- =====================================================

-- Категории
INSERT INTO categories (name, name_kk, slug, sort_order) VALUES
    ('Сигареты', 'Темекі', 'cigarettes', 1),
    ('Сигары', 'Сигаралар', 'cigars', 2),
    ('Табак', 'Темекі', 'tobacco', 3),
    ('Аксессуары', 'Аксессуарлар', 'accessories', 4),
    ('Электронные сигареты', 'Электрондық темекі', 'e-cigarettes', 5)
ON CONFLICT (slug) DO NOTHING;

-- Тестовые товары
INSERT INTO products (name, name_kk, slug, description, price, brand, category_id, image_url) VALUES
    ('Marlboro Red', 'Marlboro Red', 'marlboro-red', 'Классические сигареты Marlboro', 850, 'Marlboro', 
     (SELECT id FROM categories WHERE slug = 'cigarettes'), 'https://placehold.co/400x400?text=Marlboro'),
    ('Parliament Night Blue', 'Parliament Night Blue', 'parliament-night', 'Parliament с угольным фильтром', 950, 'Parliament',
     (SELECT id FROM categories WHERE slug = 'cigarettes'), 'https://placehold.co/400x400?text=Parliament'),
    ('Winston Blue', 'Winston Blue', 'winston-blue', 'Лёгкие сигареты Winston', 750, 'Winston',
     (SELECT id FROM categories WHERE slug = 'cigarettes'), 'https://placehold.co/400x400?text=Winston'),
    ('Camel Yellow', 'Camel Yellow', 'camel-yellow', 'Классический Camel', 800, 'Camel',
     (SELECT id FROM categories WHERE slug = 'cigarettes'), 'https://placehold.co/400x400?text=Camel'),
    ('Kent Silver', 'Kent Silver', 'kent-silver', 'Ультра лёгкие Kent', 900, 'Kent',
     (SELECT id FROM categories WHERE slug = 'cigarettes'), 'https://placehold.co/400x400?text=Kent')
ON CONFLICT (slug) DO NOTHING;

-- Готово!
SELECT 'База данных успешно создана!' as result;
