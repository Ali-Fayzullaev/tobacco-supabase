-- Миграция: Разрешить админам удалять записи из order_items
-- Это нужно для полного удаления товаров, которые есть в заказах

-- Политика DELETE для order_items
DROP POLICY IF EXISTS "Admin can delete order items" ON order_items;
CREATE POLICY "Admin can delete order items"
  ON order_items FOR DELETE
  USING (is_admin_safe());

-- Также обновляем товар чтобы в заказах показывалось что товар удалён
-- Добавляем столбец для хранения информации о удалённом товаре в order_items
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS product_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS product_name_snapshot TEXT;

-- Вместо полного удаления из order_items, помечаем что товар был удалён
-- Создаём функцию для мягкого удаления товара из заказов
CREATE OR REPLACE FUNCTION mark_product_as_deleted_in_orders(product_ids UUID[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Обновляем order_items - помечаем товар как удалённый и сохраняем название
  UPDATE order_items oi
  SET 
    product_deleted = TRUE,
    product_name_snapshot = COALESCE(product_name_snapshot, p.name)
  FROM products p
  WHERE oi.product_id = p.id
    AND oi.product_id = ANY(product_ids);
END;
$$;

-- RPC функция для безопасного удаления товаров админом
CREATE OR REPLACE FUNCTION admin_delete_products(product_ids UUID[])
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER := 0;
  products_in_orders UUID[];
BEGIN
  -- Проверяем права админа
  IF NOT is_admin_safe() THEN
    RETURN json_build_object('success', false, 'error', 'Нет прав администратора');
  END IF;

  -- Находим товары которые есть в заказах
  SELECT ARRAY_AGG(DISTINCT product_id) INTO products_in_orders
  FROM order_items
  WHERE product_id = ANY(product_ids);

  -- Помечаем товары как удалённые в order_items (сохраняем историю)
  IF products_in_orders IS NOT NULL THEN
    PERFORM mark_product_as_deleted_in_orders(products_in_orders);
  END IF;

  -- Удаляем связанные данные
  DELETE FROM product_images WHERE product_id = ANY(product_ids);
  DELETE FROM product_attributes WHERE product_id = ANY(product_ids);
  DELETE FROM favorites WHERE product_id = ANY(product_ids);
  DELETE FROM cart_items WHERE product_id = ANY(product_ids);
  DELETE FROM order_items WHERE product_id = ANY(product_ids);

  -- Удаляем сами товары
  DELETE FROM products WHERE id = ANY(product_ids);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN json_build_object(
    'success', true, 
    'deleted_count', deleted_count,
    'had_orders', COALESCE(array_length(products_in_orders, 1), 0)
  );
END;
$$;
