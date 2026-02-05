-- =====================================================
-- БЫСТРОЕ ОБНОВЛЕНИЕ РЕЙТИНГОВ ДЛЯ ТЕСТИРОВАНИЯ
-- Выполни в Supabase SQL Editor
-- =====================================================

-- Добавляем поля если их нет
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;

-- Обновляем случайные товары с тестовыми рейтингами
UPDATE products 
SET 
    rating = ROUND((RANDOM() * 2 + 3)::numeric, 1),  -- Рейтинг от 3.0 до 5.0
    reviews_count = FLOOR(RANDOM() * 50 + 1)::int,   -- От 1 до 50 отзывов
    is_new = RANDOM() > 0.7,                          -- 30% новинки
    is_bestseller = RANDOM() > 0.8                    -- 20% хиты
WHERE is_active = true;

-- Проверяем результат
SELECT id, name, rating, reviews_count, is_new, is_bestseller 
FROM products 
WHERE is_active = true 
LIMIT 10;
