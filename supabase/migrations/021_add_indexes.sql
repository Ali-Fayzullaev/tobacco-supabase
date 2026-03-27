-- ═══════════════════════════════════════════════════════════
-- Migration 021: Добавление недостающих индексов
-- ═══════════════════════════════════════════════════════════
-- 
-- Проблема: основные таблицы (orders, products, order_items, 
-- cart_items, favorites) не имеют индексов на часто используемые
-- столбцы. При росте данных запросы замедляются.
--
-- Решение: B-tree индексы на внешние ключи и столбцы фильтрации.
-- Все индексы CREATE IF NOT EXISTS — безопасно для повторного запуска.
-- ═══════════════════════════════════════════════════════════

-- ─── orders ───
-- Запросы: "Мои заказы" (profile/orders), админ-фильтр по статусу
CREATE INDEX IF NOT EXISTS idx_orders_user_id 
  ON public.orders(user_id);

CREATE INDEX IF NOT EXISTS idx_orders_status 
  ON public.orders(status);

CREATE INDEX IF NOT EXISTS idx_orders_created_at 
  ON public.orders(created_at DESC);

-- Составной индекс: заказы пользователя по дате (самый частый запрос)
CREATE INDEX IF NOT EXISTS idx_orders_user_created 
  ON public.orders(user_id, created_at DESC);

-- ─── order_items ───
-- FK constraint НЕ создаёт индекс автоматически в PostgreSQL
CREATE INDEX IF NOT EXISTS idx_order_items_order_id 
  ON public.order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_product_id 
  ON public.order_items(product_id);

-- ─── products ───
-- Фильтрация по категории (каталог с 8 вкладками)
CREATE INDEX IF NOT EXISTS idx_products_category_id 
  ON public.products(category_id);

-- Поиск по slug (страница товара /product/[slug])
CREATE INDEX IF NOT EXISTS idx_products_slug 
  ON public.products(slug);

-- Фильтрация по бренду
CREATE INDEX IF NOT EXISTS idx_products_brand 
  ON public.products(brand);

-- Наличие товара (in_stock = true — часто фильтруется)
CREATE INDEX IF NOT EXISTS idx_products_in_stock 
  ON public.products(in_stock) WHERE in_stock = true;

-- ─── cart_items ───
-- Загрузка корзины пользователя
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id 
  ON public.cart_items(user_id);

-- ─── favorites ───
-- Загрузка избранного пользователя
CREATE INDEX IF NOT EXISTS idx_favorites_user_id 
  ON public.favorites(user_id);

-- ─── reviews ───
-- Отзывы по товару
CREATE INDEX IF NOT EXISTS idx_reviews_product_id 
  ON public.reviews(product_id);

-- ─── categories ───
-- Подкатегории (parent_id)
CREATE INDEX IF NOT EXISTS idx_categories_parent_id 
  ON public.categories(parent_id);

-- Сортировка категорий
CREATE INDEX IF NOT EXISTS idx_categories_sort_order 
  ON public.categories(sort_order);
