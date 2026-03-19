-- =====================================================
-- STOCK RESERVATION SYSTEM
-- Adds numeric stock field and atomic reservation
-- =====================================================

-- 1. Добавляем поле stock (количество на складе)
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;

-- 2. Синхронизируем stock с in_stock для существующих товаров
-- Товары "в наличии" получают stock = 100, остальные = 0
UPDATE products SET stock = CASE WHEN in_stock THEN 100 ELSE 0 END WHERE stock = 0;

-- 3. Автоматическое обновление in_stock при изменении stock
CREATE OR REPLACE FUNCTION update_in_stock()
RETURNS TRIGGER AS $$
BEGIN
    NEW.in_stock := NEW.stock > 0;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_in_stock ON products;
CREATE TRIGGER sync_in_stock
    BEFORE INSERT OR UPDATE OF stock ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_in_stock();

-- 4. Атомарное резервирование товаров при создании заказа
-- Принимает массив {product_id, quantity} и возвращает результат
CREATE OR REPLACE FUNCTION reserve_stock_for_order(
    p_user_id UUID,
    p_items JSONB,
    p_delivery_method TEXT,
    p_payment_method TEXT,
    p_shipping_address JSONB,
    p_phone TEXT,
    p_comment TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_order_id UUID;
    v_order_number TEXT;
    v_total_amount DECIMAL(10,2) := 0;
    v_item JSONB;
    v_product RECORD;
    v_order_items JSONB := '[]'::JSONB;
BEGIN
    -- Проверяем каждый товар и считаем сумму
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Блокируем строку товара FOR UPDATE чтобы другие транзакции ждали
        SELECT id, name, price, stock, in_stock
        INTO v_product
        FROM products
        WHERE id = (v_item->>'product_id')::UUID
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Товар % не найден', v_item->>'product_id';
        END IF;

        IF v_product.stock < (v_item->>'quantity')::INTEGER THEN
            RAISE EXCEPTION 'Недостаточно товара "%". Доступно: %, запрошено: %', 
                v_product.name, v_product.stock, (v_item->>'quantity')::INTEGER;
        END IF;

        -- Уменьшаем остаток
        UPDATE products 
        SET stock = stock - (v_item->>'quantity')::INTEGER,
            updated_at = NOW()
        WHERE id = v_product.id;

        v_total_amount := v_total_amount + (v_product.price * (v_item->>'quantity')::INTEGER);

        -- Собираем элементы заказа
        v_order_items := v_order_items || jsonb_build_array(jsonb_build_object(
            'product_id', v_product.id,
            'product_name', v_product.name,
            'quantity', (v_item->>'quantity')::INTEGER,
            'price', v_product.price
        ));
    END LOOP;

    -- Создаём заказ
    INSERT INTO orders (user_id, status, total_amount, delivery_method, payment_method, payment_status, shipping_address, phone, comment)
    VALUES (p_user_id, 'pending', v_total_amount, p_delivery_method, p_payment_method, 'pending', p_shipping_address, p_phone, p_comment)
    RETURNING id, order_number INTO v_order_id, v_order_number;

    -- Создаём позиции заказа
    INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
    SELECT 
        v_order_id,
        (item->>'product_id')::UUID,
        item->>'product_name',
        (item->>'quantity')::INTEGER,
        (item->>'price')::DECIMAL
    FROM jsonb_array_elements(v_order_items) AS item;

    -- Очищаем корзину пользователя
    DELETE FROM cart_items WHERE user_id = p_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'total_amount', v_total_amount
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
