-- =====================================================
-- TOBACCO SHOP - SEED DATA
-- =====================================================
-- Тестовые данные для разработки
-- =====================================================

-- =====================================================
-- КАТЕГОРИИ
-- =====================================================

INSERT INTO categories (slug, name_ru, name_kk, description_ru, description_kk, sort_order, is_active) VALUES
('cigarettes', 'Сигареты', 'Темекі', 'Сигареты различных брендов', 'Әртүрлі брендтердің темекілері', 1, TRUE),
('cigars', 'Сигары', 'Сигаралар', 'Премиальные сигары', 'Премиум сигаралар', 2, TRUE),
('hookah', 'Кальянный табак', 'Қалиан темекісі', 'Табак для кальяна', 'Қалианға арналған темекі', 3, TRUE),
('vape', 'Вейп-продукция', 'Вейп өнімдері', 'Электронные сигареты и жидкости', 'Электронды темекілер мен сұйықтықтар', 4, TRUE),
('accessories', 'Аксессуары', 'Аксессуарлар', 'Зажигалки, пепельницы и другое', 'Жанатын заттар, күл салғыштар және т.б.', 5, TRUE);

-- Подкатегории сигарет
INSERT INTO categories (slug, name_ru, name_kk, description_ru, description_kk, parent_id, sort_order, is_active)
SELECT 
    slug, name_ru, name_kk, description_ru, description_kk, 
    (SELECT id FROM categories WHERE slug = 'cigarettes'), sort_order, TRUE
FROM (VALUES
    ('cigarettes-light', 'Лёгкие', 'Жеңіл', 'Лёгкие сигареты', 'Жеңіл темекілер', 1),
    ('cigarettes-strong', 'Крепкие', 'Қатты', 'Крепкие сигареты', 'Қатты темекілер', 2),
    ('cigarettes-menthol', 'Ментоловые', 'Ментолды', 'Ментоловые сигареты', 'Ментолды темекілер', 3),
    ('cigarettes-slim', 'Тонкие', 'Жіңішке', 'Тонкие сигареты', 'Жіңішке темекілер', 4)
) AS t(slug, name_ru, name_kk, description_ru, description_kk, sort_order);

-- Подкатегории вейпов
INSERT INTO categories (slug, name_ru, name_kk, description_ru, description_kk, parent_id, sort_order, is_active)
SELECT 
    slug, name_ru, name_kk, description_ru, description_kk, 
    (SELECT id FROM categories WHERE slug = 'vape'), sort_order, TRUE
FROM (VALUES
    ('vape-devices', 'Устройства', 'Құрылғылар', 'Электронные сигареты', 'Электронды темекілер', 1),
    ('vape-liquids', 'Жидкости', 'Сұйықтықтар', 'Жидкости для вейпа', 'Вейпке арналған сұйықтықтар', 2),
    ('vape-pods', 'Поды', 'Подтар', 'Pod-системы', 'Pod-жүйелер', 3)
) AS t(slug, name_ru, name_kk, description_ru, description_kk, sort_order);

-- =====================================================
-- ТЕСТОВЫЕ ТОВАРЫ
-- =====================================================

-- Сигареты
INSERT INTO products (sku, slug, name_ru, name_kk, description_short_ru, description_short_kk, description_full_ru, description_full_kk, category_id, brand, price, old_price, stock_quantity, is_active, is_featured)
SELECT 
    sku, slug, name_ru, name_kk, description_short_ru, description_short_kk, description_full_ru, description_full_kk,
    (SELECT id FROM categories WHERE slug = category_slug), brand, price, old_price, stock, TRUE, featured
FROM (VALUES
    ('CIG-001', 'marlboro-gold', 'Marlboro Gold', 'Marlboro Gold', 
     'Классические сигареты с мягким вкусом', 'Жұмсақ дәмі бар классикалық темекі',
     'Marlboro Gold - это классические сигареты премиум качества с мягким, сбалансированным вкусом. Содержание смол: 6 мг, никотина: 0.5 мг.',
     'Marlboro Gold - бұл жұмсақ, теңдестірілген дәмі бар премиум сапалы классикалық темекі.',
     'cigarettes', 'Marlboro', 950.00, NULL, 100, TRUE),
    
    ('CIG-002', 'parliament-aqua-blue', 'Parliament Aqua Blue', 'Parliament Aqua Blue',
     'Лёгкие сигареты с фильтром', 'Сүзгісі бар жеңіл темекі',
     'Parliament Aqua Blue - сигареты с уникальным угольным фильтром для более мягкого вкуса.',
     'Parliament Aqua Blue - жұмсақ дәм үшін бірегей көмір сүзгісі бар темекілер.',
     'cigarettes-light', 'Parliament', 1100.00, NULL, 80, TRUE),
    
    ('CIG-003', 'winston-blue', 'Winston Blue', 'Winston Blue',
     'Сигареты средней крепости', 'Орташа қаттылықтағы темекі',
     'Winston Blue - качественные сигареты с насыщенным вкусом табака.',
     'Winston Blue - таза темекі дәмі бар сапалы темекілер.',
     'cigarettes', 'Winston', 750.00, 850.00, 150, FALSE),
    
    ('CIG-004', 'camel-blue', 'Camel Blue', 'Camel Blue',
     'Американские сигареты', 'Американдық темекі',
     'Camel Blue - легендарные американские сигареты с характерным вкусом.',
     'Camel Blue - тән дәмі бар аңызға айналған американдық темекілер.',
     'cigarettes', 'Camel', 880.00, NULL, 60, FALSE),
    
    ('CIG-005', 'kent-silver', 'Kent Silver', 'Kent Silver',
     'Ультралёгкие сигареты', 'Ультражеңіл темекі',
     'Kent Silver - ультралёгкие сигареты с минимальным содержанием смол.',
     'Kent Silver - шайырдың минималды мөлшері бар ультражеңіл темекілер.',
     'cigarettes-light', 'Kent', 1050.00, NULL, 90, FALSE)
) AS t(sku, slug, name_ru, name_kk, description_short_ru, description_short_kk, description_full_ru, description_full_kk, category_slug, brand, price, old_price, stock, featured);

-- Вейпы
INSERT INTO products (sku, slug, name_ru, name_kk, description_short_ru, description_short_kk, description_full_ru, description_full_kk, category_id, brand, price, stock_quantity, is_active, is_featured)
SELECT 
    sku, slug, name_ru, name_kk, description_short_ru, description_short_kk, description_full_ru, description_full_kk,
    (SELECT id FROM categories WHERE slug = category_slug), brand, price, stock, TRUE, featured
FROM (VALUES
    ('VAPE-001', 'elfbar-600-mango', 'ELF BAR 600 Манго', 'ELF BAR 600 Манго',
     'Одноразовая электронная сигарета', 'Бір реттік электронды темекі',
     'ELF BAR 600 - одноразовая электронная сигарета с насыщенным вкусом манго. 600 затяжек.',
     'ELF BAR 600 - бай манго дәмі бар бір реттік электронды темекі. 600 тартым.',
     'vape-pods', 'ELF BAR', 3500.00, 200, TRUE),
    
    ('VAPE-002', 'elfbar-600-watermelon', 'ELF BAR 600 Арбуз', 'ELF BAR 600 Қарбыз',
     'Одноразовая электронная сигарета', 'Бір реттік электронды темекі',
     'ELF BAR 600 со вкусом свежего арбуза.',
     'Жаңа қарбыз дәмі бар ELF BAR 600.',
     'vape-pods', 'ELF BAR', 3500.00, 180, FALSE),
    
    ('VAPE-003', 'lost-mary-bm600-grape', 'Lost Mary BM600 Виноград', 'Lost Mary BM600 Жүзім',
     'Компактная pod-система', 'Ықшам pod-жүйе',
     'Lost Mary BM600 - премиальная одноразовая pod-система со вкусом винограда.',
     'Lost Mary BM600 - жүзім дәмі бар премиум бір реттік pod-жүйе.',
     'vape-pods', 'Lost Mary', 4200.00, 120, TRUE)
) AS t(sku, slug, name_ru, name_kk, description_short_ru, description_short_kk, description_full_ru, description_full_kk, category_slug, brand, price, stock, featured);

-- Жидкости для вейпа
INSERT INTO products (sku, slug, name_ru, name_kk, description_short_ru, description_short_kk, description_full_ru, description_full_kk, category_id, brand, price, stock_quantity, is_active, is_featured)
SELECT 
    sku, slug, name_ru, name_kk, description_short_ru, description_short_kk, description_full_ru, description_full_kk,
    (SELECT id FROM categories WHERE slug = 'vape-liquids'), brand, price, stock, TRUE, featured
FROM (VALUES
    ('LIQ-001', 'brusko-mango-ice-30ml', 'Brusko Манго Айс 30мл', 'Brusko Манго Айс 30мл',
     'Жидкость для вейпа 30мл', 'Вейпке арналған сұйықтық 30мл',
     'Brusko Mango Ice - освежающий манго с холодком. Солевой никотин 20мг.',
     'Brusko Mango Ice - салқындықпен сергітетін манго. Тұзды никотин 20мг.',
     'Brusko', 1800.00, 50, TRUE),
    
    ('LIQ-002', 'brusko-strawberry-30ml', 'Brusko Клубника 30мл', 'Brusko Құлпынай 30мл',
     'Жидкость для вейпа 30мл', 'Вейпке арналған сұйықтық 30мл',
     'Brusko Strawberry - насыщенный вкус спелой клубники.',
     'Brusko Strawberry - піскен құлпынайдың бай дәмі.',
     'Brusko', 1800.00, 45, FALSE)
) AS t(sku, slug, name_ru, name_kk, description_short_ru, description_short_kk, description_full_ru, description_full_kk, brand, price, stock, featured);

-- Кальянный табак
INSERT INTO products (sku, slug, name_ru, name_kk, description_short_ru, description_short_kk, description_full_ru, description_full_kk, category_id, brand, price, stock_quantity, is_active, is_featured)
SELECT 
    sku, slug, name_ru, name_kk, description_short_ru, description_short_kk, description_full_ru, description_full_kk,
    (SELECT id FROM categories WHERE slug = 'hookah'), brand, price, stock, TRUE, featured
FROM (VALUES
    ('HOOKAH-001', 'darkside-grape-core-100g', 'Darkside Grape Core 100г', 'Darkside Grape Core 100г',
     'Табак для кальяна со вкусом винограда', 'Жүзім дәмді қалиан темекісі',
     'Darkside Grape Core - премиальный табак для кальяна с насыщенным виноградным вкусом.',
     'Darkside Grape Core - бай жүзім дәмі бар премиум қалиан темекісі.',
     'Darkside', 2500.00, 30, TRUE),
    
    ('HOOKAH-002', 'element-watermelon-100g', 'Element Арбуз 100г', 'Element Қарбыз 100г',
     'Табак для кальяна со вкусом арбуза', 'Қарбыз дәмді қалиан темекісі',
     'Element Watermelon - освежающий арбузный вкус для вашего кальяна.',
     'Element Watermelon - қалианыңызға арналған сергітетін қарбыз дәмі.',
     'Element', 2200.00, 25, FALSE),
    
    ('HOOKAH-003', 'musthave-orange-team-125g', 'Must Have Orange Team 125г', 'Must Have Orange Team 125г',
     'Табак для кальяна со вкусом апельсина', 'Апельсин дәмді қалиан темекісі',
     'Must Have Orange Team - яркий апельсиновый микс.',
     'Must Have Orange Team - жарқын апельсин миксі.',
     'Must Have', 2800.00, 20, FALSE)
) AS t(sku, slug, name_ru, name_kk, description_short_ru, description_short_kk, description_full_ru, description_full_kk, brand, price, stock, featured);

-- Аксессуары
INSERT INTO products (sku, slug, name_ru, name_kk, description_short_ru, description_short_kk, description_full_ru, description_full_kk, category_id, brand, price, stock_quantity, is_active, is_featured)
SELECT 
    sku, slug, name_ru, name_kk, description_short_ru, description_short_kk, description_full_ru, description_full_kk,
    (SELECT id FROM categories WHERE slug = 'accessories'), brand, price, stock, TRUE, featured
FROM (VALUES
    ('ACC-001', 'zippo-classic-chrome', 'Zippo Classic Chrome', 'Zippo Classic Chrome',
     'Классическая зажигалка Zippo', 'Классикалық Zippo жанғыш',
     'Zippo Classic Chrome - легендарная американская зажигалка с пожизненной гарантией.',
     'Zippo Classic Chrome - өмір бойы кепілдігі бар аңызға айналған американдық жанғыш.',
     'Zippo', 12000.00, 15, TRUE),
    
    ('ACC-002', 'ashtray-crystal', 'Пепельница хрустальная', 'Шыны күлсалғыш',
     'Хрустальная пепельница', 'Шыны күлсалғыш',
     'Элегантная хрустальная пепельница для дома или офиса.',
     'Үй немесе кеңсеге арналған талғампаз шыны күлсалғыш.',
     '', 5500.00, 20, FALSE),
    
    ('ACC-003', 'lighter-clipper-classic', 'Clipper Classic', 'Clipper Classic',
     'Многоразовая зажигалка', 'Көп рет қолданылатын жанғыш',
     'Clipper Classic - экологичная многоразовая зажигалка.',
     'Clipper Classic - экологиялық көп рет қолданылатын жанғыш.',
     'Clipper', 800.00, 100, FALSE)
) AS t(sku, slug, name_ru, name_kk, description_short_ru, description_short_kk, description_full_ru, description_full_kk, brand, price, stock, featured);

-- =====================================================
-- ИЗОБРАЖЕНИЯ ТОВАРОВ (плейсхолдеры)
-- =====================================================

-- Добавляем основные изображения для всех товаров
INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
SELECT 
    p.id,
    'https://placehold.co/400x400/1a202c/d4af37?text=' || REPLACE(p.name_ru, ' ', '+'),
    TRUE,
    1
FROM products p;

-- =====================================================
-- АТРИБУТЫ ТОВАРОВ
-- =====================================================

-- Атрибуты для сигарет
INSERT INTO product_attributes (product_id, attribute_name_ru, attribute_name_kk, attribute_value_ru, attribute_value_kk, sort_order)
SELECT 
    p.id,
    attr.name_ru,
    attr.name_kk,
    attr.value_ru,
    attr.value_kk,
    attr.sort_order
FROM products p
CROSS JOIN (VALUES
    ('Смолы', 'Шайыр', '6 мг', '6 мг', 1),
    ('Никотин', 'Никотин', '0.5 мг', '0.5 мг', 2),
    ('В пачке', 'Қорапта', '20 шт', '20 дана', 3)
) AS attr(name_ru, name_kk, value_ru, value_kk, sort_order)
WHERE p.category_id = (SELECT id FROM categories WHERE slug = 'cigarettes')
OR p.category_id IN (SELECT id FROM categories WHERE parent_id = (SELECT id FROM categories WHERE slug = 'cigarettes'));

-- Атрибуты для вейпов
INSERT INTO product_attributes (product_id, attribute_name_ru, attribute_name_kk, attribute_value_ru, attribute_value_kk, sort_order)
SELECT 
    p.id,
    attr.name_ru,
    attr.name_kk,
    attr.value_ru,
    attr.value_kk,
    attr.sort_order
FROM products p
CROSS JOIN (VALUES
    ('Затяжек', 'Тартым', '600', '600', 1),
    ('Никотин', 'Никотин', '20 мг/мл', '20 мг/мл', 2),
    ('Объём', 'Көлем', '2 мл', '2 мл', 3)
) AS attr(name_ru, name_kk, value_ru, value_kk, sort_order)
WHERE p.category_id = (SELECT id FROM categories WHERE slug = 'vape-pods');

-- =====================================================
-- НАСТРОЙКИ ИНТЕГРАЦИИ (для будущего)
-- =====================================================

INSERT INTO integration_settings (setting_key, setting_value, description) VALUES
('1c_enabled', 'false', 'Включена ли интеграция с 1С'),
('1c_url', '', 'URL сервера 1С'),
('1c_username', '', 'Логин для подключения к 1С'),
('sync_products_interval', '15', 'Интервал синхронизации товаров (минуты)'),
('sync_stock_interval', '5', 'Интервал синхронизации остатков (минуты)'),
('sync_orders_immediate', 'true', 'Немедленная синхронизация заказов');

-- =====================================================
-- УСПЕШНОЕ ЗАВЕРШЕНИЕ
-- =====================================================

-- Проверяем что данные созданы
DO $$
DECLARE
    cat_count INTEGER;
    prod_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO cat_count FROM categories;
    SELECT COUNT(*) INTO prod_count FROM products;
    
    RAISE NOTICE 'Seed data created successfully!';
    RAISE NOTICE 'Categories: %', cat_count;
    RAISE NOTICE 'Products: %', prod_count;
END $$;
