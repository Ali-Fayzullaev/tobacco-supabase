-- =====================================================
-- TOBACCO SHOP - INITIAL DATABASE SCHEMA
-- =====================================================
-- Этот файл создаёт все таблицы для интернет-магазина
-- табачных изделий с учётом законодательства РК (18+)
-- =====================================================

-- Включаем расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Для полнотекстового поиска

-- =====================================================
-- 1. ПРОФИЛИ ПОЛЬЗОВАТЕЛЕЙ
-- =====================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    birth_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE, -- Подтверждён email
    preferred_language TEXT DEFAULT 'ru' CHECK (preferred_language IN ('ru', 'kk')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Поля для интеграции с 1С (будущее)
    external_id TEXT,
    last_sync_at TIMESTAMPTZ,
    
    -- Проверка возраста 18+
    CONSTRAINT age_check CHECK (
        birth_date <= CURRENT_DATE - INTERVAL '18 years'
    )
);

-- Индексы для профилей
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = TRUE;
CREATE INDEX idx_profiles_is_active ON profiles(is_active);

-- =====================================================
-- 2. КАТЕГОРИИ ТОВАРОВ
-- =====================================================
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name_ru TEXT NOT NULL,
    name_kk TEXT NOT NULL,
    description_ru TEXT,
    description_kk TEXT,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для категорий
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_active ON categories(is_active) WHERE is_active = TRUE;

-- =====================================================
-- 3. ТОВАРЫ
-- =====================================================
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    name_ru TEXT NOT NULL,
    name_kk TEXT NOT NULL,
    description_short_ru TEXT,
    description_short_kk TEXT,
    description_full_ru TEXT,
    description_full_kk TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    brand TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    old_price DECIMAL(10, 2) CHECK (old_price IS NULL OR old_price >= price),
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE, -- Рекомендуемый товар
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Поля для интеграции с 1С
    external_id TEXT,
    last_sync_at TIMESTAMPTZ,
    
    -- Полнотекстовый поиск
    search_vector TSVECTOR
);

-- Индексы для товаров
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_active ON products(is_active, is_deleted) 
    WHERE is_active = TRUE AND is_deleted = FALSE;
CREATE INDEX idx_products_featured ON products(is_featured) 
    WHERE is_featured = TRUE AND is_active = TRUE AND is_deleted = FALSE;
CREATE INDEX idx_products_search ON products USING GIN(search_vector);
CREATE INDEX idx_products_name_trgm ON products USING GIN(name_ru gin_trgm_ops);

-- =====================================================
-- 4. ИЗОБРАЖЕНИЯ ТОВАРОВ
-- =====================================================
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для изображений
CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_product_images_primary ON product_images(product_id, is_primary) 
    WHERE is_primary = TRUE;

-- =====================================================
-- 5. АТРИБУТЫ ТОВАРОВ (характеристики)
-- =====================================================
CREATE TABLE product_attributes (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    attribute_name_ru TEXT NOT NULL,
    attribute_name_kk TEXT NOT NULL,
    attribute_value_ru TEXT NOT NULL,
    attribute_value_kk TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
);

-- Индексы для атрибутов
CREATE INDEX idx_product_attributes_product ON product_attributes(product_id);

-- =====================================================
-- 6. АДРЕСА ДОСТАВКИ
-- =====================================================
CREATE TABLE addresses (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT, -- "Дом", "Работа" и т.д.
    city TEXT NOT NULL,
    street TEXT NOT NULL,
    building TEXT NOT NULL,
    apartment TEXT,
    entrance TEXT, -- Подъезд
    floor TEXT, -- Этаж
    comment TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для адресов
CREATE INDEX idx_addresses_user ON addresses(user_id);
CREATE INDEX idx_addresses_default ON addresses(user_id, is_default) 
    WHERE is_default = TRUE;

-- =====================================================
-- 7. ЗАКАЗЫ
-- =====================================================
CREATE TYPE order_status AS ENUM (
    'new',           -- Новый
    'confirmed',     -- Подтверждён
    'processing',    -- В обработке
    'shipping',      -- Передан в доставку
    'delivered',     -- Доставлен
    'cancelled'      -- Отменён
);

CREATE TYPE delivery_method AS ENUM (
    'courier',       -- Курьерская доставка
    'pickup'         -- Самовывоз
);

CREATE TYPE payment_method AS ENUM (
    'cash',          -- Наличными при получении
    'card',          -- Картой онлайн
    'kaspi'          -- Kaspi перевод
);

CREATE TYPE payment_status AS ENUM (
    'pending',       -- Ожидает оплаты
    'paid',          -- Оплачен
    'failed',        -- Ошибка оплаты
    'refunded'       -- Возврат
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES profiles(id),
    status order_status DEFAULT 'new',
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    delivery_method delivery_method NOT NULL,
    delivery_cost DECIMAL(10, 2) DEFAULT 0,
    payment_method payment_method NOT NULL,
    payment_status payment_status DEFAULT 'pending',
    
    -- Адрес доставки (копируем, чтобы сохранить историю)
    delivery_city TEXT,
    delivery_street TEXT,
    delivery_building TEXT,
    delivery_apartment TEXT,
    delivery_comment TEXT,
    
    -- Контактные данные
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    
    comment TEXT,
    admin_comment TEXT, -- Комментарий администратора
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    -- Интеграция с 1С
    external_id TEXT,
    external_number TEXT,
    last_sync_at TIMESTAMPTZ,
    sync_status TEXT DEFAULT 'not_synced'
);

-- Индексы для заказов
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);

-- =====================================================
-- 8. ПОЗИЦИИ ЗАКАЗА
-- =====================================================
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0), -- Цена на момент заказа
    total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    
    -- Сохраняем информацию о товаре на момент заказа
    product_name_ru TEXT NOT NULL,
    product_name_kk TEXT,
    product_sku TEXT
);

-- Индексы для позиций заказа
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- =====================================================
-- 9. КОРЗИНА
-- =====================================================
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Один товар - одна запись на пользователя
    UNIQUE(user_id, product_id)
);

-- Индексы для корзины
CREATE INDEX idx_cart_items_user ON cart_items(user_id);

-- =====================================================
-- 10. ИЗБРАННОЕ
-- =====================================================
CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, product_id)
);

-- Индексы для избранного
CREATE INDEX idx_favorites_user ON favorites(user_id);

-- =====================================================
-- 11. ТОКЕНЫ СБРОСА ПАРОЛЯ
-- =====================================================
CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для токенов
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens(user_id);

-- =====================================================
-- 12. ИСТОРИЯ ИЗМЕНЕНИЙ ТОВАРОВ (AUDIT LOG)
-- =====================================================
CREATE TABLE product_change_log (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES profiles(id),
    change_type TEXT NOT NULL CHECK (change_type IN ('created', 'updated', 'deleted', 'restored')),
    changes JSONB, -- JSON с изменёнными полями
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для лога изменений
CREATE INDEX idx_product_change_log_product ON product_change_log(product_id);
CREATE INDEX idx_product_change_log_admin ON product_change_log(admin_id);
CREATE INDEX idx_product_change_log_created ON product_change_log(created_at DESC);

-- =====================================================
-- 13. НАСТРОЙКИ ИНТЕГРАЦИИ (для 1С)
-- =====================================================
CREATE TABLE integration_settings (
    id SERIAL PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- 14. ЛОГ СИНХРОНИЗАЦИИ (для 1С)
-- =====================================================
CREATE TABLE sync_log (
    id SERIAL PRIMARY KEY,
    sync_type TEXT NOT NULL, -- products, orders, stock, customers
    direction TEXT NOT NULL, -- import, export
    status TEXT NOT NULL, -- success, error, pending
    records_processed INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Индексы для лога синхронизации
CREATE INDEX idx_sync_log_type ON sync_log(sync_type);
CREATE INDEX idx_sync_log_status ON sync_log(status);
CREATE INDEX idx_sync_log_started ON sync_log(started_at DESC);

-- =====================================================
-- 15. ОТЗЫВЫ (опционально)
-- =====================================================
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Один отзыв на товар от пользователя
    UNIQUE(product_id, user_id)
);

-- Индексы для отзывов
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_approved ON reviews(product_id, is_approved) WHERE is_approved = TRUE;

-- =====================================================
-- 16. УВЕДОМЛЕНИЯ
-- =====================================================
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- order_status, promotion, stock_alert
    title_ru TEXT NOT NULL,
    title_kk TEXT,
    message_ru TEXT NOT NULL,
    message_kk TEXT,
    data JSONB, -- Дополнительные данные (order_id, product_id и т.д.)
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для уведомлений
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- =====================================================
-- ТРИГГЕРЫ
-- =====================================================

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_addresses_updated_at
    BEFORE UPDATE ON addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_cart_items_updated_at
    BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Функция для обновления поискового вектора товаров
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector = 
        setweight(to_tsvector('russian', COALESCE(NEW.name_ru, '')), 'A') ||
        setweight(to_tsvector('russian', COALESCE(NEW.brand, '')), 'B') ||
        setweight(to_tsvector('russian', COALESCE(NEW.description_short_ru, '')), 'C') ||
        setweight(to_tsvector('russian', COALESCE(NEW.sku, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_search_vector
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();

-- Функция для генерации номера заказа
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
    year_part TEXT;
    sequence_part INTEGER;
BEGIN
    year_part := TO_CHAR(NOW(), 'YYMM');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 5) AS INTEGER)), 0) + 1
    INTO sequence_part
    FROM orders
    WHERE order_number LIKE year_part || '%';
    
    NEW.order_number := year_part || LPAD(sequence_part::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_order_number_trigger
    BEFORE INSERT ON orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL)
    EXECUTE FUNCTION generate_order_number();

-- Функция для создания профиля при регистрации
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, first_name, last_name, birth_date)
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

-- Триггер создания профиля при регистрации
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
