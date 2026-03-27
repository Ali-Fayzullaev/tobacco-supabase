-- #6 Каталог: 8 вкладок + кратность заказа
-- Запустить в Supabase SQL Editor

-- 1. Добавить order_step к products (кратность заказа: блоки/коробки)
ALTER TABLE products ADD COLUMN IF NOT EXISTS order_step INTEGER DEFAULT 1;

-- 2. Перестроить категории: 8 корневых вкладок (без подкатегорий-обёрток)
-- ТЗ: 1. Табак для кальяна | 2. Сигареты | 3. Папиросы | 4. Трубочный табак
--      5. Табак курительный | 6. Сигариллы | 7. Сигары | 8. Аксессуары

-- Сделаем подкатегории табака корневыми (parent_id = NULL)
UPDATE categories SET parent_id = NULL, sort_order = 1 WHERE slug = 'hookah-tobacco';
UPDATE categories SET parent_id = NULL, sort_order = 4 WHERE slug = 'pipe-tobacco';
UPDATE categories SET parent_id = NULL, sort_order = 5 WHERE slug = 'smoking-tobacco';

-- Обновляем sort_order остальных по ТЗ
UPDATE categories SET sort_order = 2 WHERE slug = 'cigarettes';
UPDATE categories SET sort_order = 3 WHERE slug = 'papirosy';
UPDATE categories SET sort_order = 6 WHERE slug = 'cigarillos';
UPDATE categories SET sort_order = 7 WHERE slug = 'cigars';
UPDATE categories SET sort_order = 8 WHERE slug = 'accessories';

-- Скрываем старый родительский "Табак" (он больше не нужен) и e-cigarettes
UPDATE categories SET is_active = false WHERE slug = 'tobacco';
UPDATE categories SET is_active = false WHERE slug = 'e-cigarettes';

-- Обновить названия для ТЗ
UPDATE categories SET name = 'Табак для кальяна', name_kk = 'Кальян темекісі',
  description = 'Ароматный табак для кальяна от ведущих производителей' WHERE slug = 'hookah-tobacco';
UPDATE categories SET name = 'Трубочный табак', name_kk = 'Түтікше темекі',
  description = 'Классический трубочный табак премиального качества' WHERE slug = 'pipe-tobacco';
UPDATE categories SET name = 'Табак курительный', name_kk = 'Шылым темекі',
  description = 'Курительный табак различных сортов и крепости' WHERE slug = 'smoking-tobacco';

-- Обновить описание аксессуаров
UPDATE categories SET 
  description = 'Гильзы, фильтры, уголь для кальяна, чаши и другие аксессуары'
WHERE slug = 'accessories';
