-- Миграция: Обновление категорий с подкатегориями и изображениями

-- Обновляем существующие категории (добавляем описание и image_url)
UPDATE categories SET 
    description = 'Классические сигареты от ведущих производителей',
    image_url = '/categories/cigarettes.jpg'
WHERE slug = 'cigarettes';

UPDATE categories SET 
    description = 'Премиальные сигары для настоящих ценителей',
    image_url = '/categories/cigars.jpg'
WHERE slug = 'cigars';

UPDATE categories SET 
    description = 'Качественный табак различных видов',
    image_url = '/categories/tobacco.jpg'
WHERE slug = 'tobacco';

UPDATE categories SET 
    description = 'Аксессуары для курения: зажигалки, пепельницы и др.',
    image_url = '/categories/accessories.jpg'
WHERE slug = 'accessories';

UPDATE categories SET 
    description = 'Электронные сигареты и вейпы',
    image_url = '/categories/e-cigarettes.jpg'
WHERE slug = 'e-cigarettes';

-- Добавляем новые корневые категории
INSERT INTO categories (name, name_kk, slug, description, image_url, sort_order) VALUES
    ('Папиросы', 'Папирос', 'papirosy', 'Традиционные папиросы', '/categories/papirosy.jpg', 2),
    ('Сигариллы', 'Сигариллалар', 'cigarillos', 'Премиальные сигариллы', '/categories/cigarillos.jpg', 3)
ON CONFLICT (slug) DO UPDATE SET 
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    sort_order = EXCLUDED.sort_order;

-- Обновляем sort_order для правильного порядка как на скриншоте
UPDATE categories SET sort_order = 1 WHERE slug = 'cigarettes';
UPDATE categories SET sort_order = 2 WHERE slug = 'papirosy';
UPDATE categories SET sort_order = 3 WHERE slug = 'cigarillos';
UPDATE categories SET sort_order = 4 WHERE slug = 'cigars';
UPDATE categories SET sort_order = 6 WHERE slug = 'e-cigarettes';
UPDATE categories SET sort_order = 7 WHERE slug = 'accessories';

-- Добавляем подкатегории для табака
INSERT INTO categories (name, name_kk, slug, description, image_url, parent_id, sort_order) VALUES
    ('Табак курительный', 'Шылым темекі', 'smoking-tobacco', 
     'Курительный табак различных сортов', '/categories/smoking-tobacco.jpg',
     (SELECT id FROM categories WHERE slug = 'tobacco'), 1),
    ('Табак для кальяна', 'Кальян темекісі', 'hookah-tobacco', 
     'Ароматный табак для кальяна', '/categories/hookah-tobacco.jpg',
     (SELECT id FROM categories WHERE slug = 'tobacco'), 2),
    ('Трубочный табак', 'Түтікше темекі', 'pipe-tobacco', 
     'Классический трубочный табак', '/categories/pipe-tobacco.jpg',
     (SELECT id FROM categories WHERE slug = 'tobacco'), 3)
ON CONFLICT (slug) DO UPDATE SET 
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    parent_id = EXCLUDED.parent_id,
    sort_order = EXCLUDED.sort_order;

-- Обновляем табак
UPDATE categories SET sort_order = 5 WHERE slug = 'tobacco';
UPDATE categories SET 
    description = 'Курительный, кальянный и трубочный табак',
    image_url = '/categories/tobacco.jpg'
WHERE slug = 'tobacco';
