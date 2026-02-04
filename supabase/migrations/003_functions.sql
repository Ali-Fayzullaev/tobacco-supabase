-- =====================================================
-- TOBACCO SHOP - DATABASE FUNCTIONS
-- =====================================================
-- Хранимые функции для бизнес-логики
-- =====================================================

-- =====================================================
-- ПОИСК ТОВАРОВ
-- =====================================================

-- Полнотекстовый поиск товаров
CREATE OR REPLACE FUNCTION search_products(
    search_query TEXT,
    category_filter INTEGER DEFAULT NULL,
    brand_filter TEXT DEFAULT NULL,
    min_price DECIMAL DEFAULT NULL,
    max_price DECIMAL DEFAULT NULL,
    in_stock_only BOOLEAN DEFAULT FALSE,
    sort_by TEXT DEFAULT 'relevance', -- relevance, price_asc, price_desc, name, newest
    page_number INTEGER DEFAULT 1,
    page_size INTEGER DEFAULT 20
)
RETURNS TABLE (
    id INTEGER,
    sku TEXT,
    slug TEXT,
    name_ru TEXT,
    name_kk TEXT,
    description_short_ru TEXT,
    brand TEXT,
    price DECIMAL,
    old_price DECIMAL,
    stock_quantity INTEGER,
    category_id INTEGER,
    primary_image_url TEXT,
    is_featured BOOLEAN,
    relevance_score REAL,
    total_count BIGINT
) AS $$
DECLARE
    offset_val INTEGER;
BEGIN
    -- Проверяем что пользователь взрослый
    IF NOT is_adult() THEN
        RAISE EXCEPTION 'Access denied: user must be 18+';
    END IF;

    offset_val := (page_number - 1) * page_size;

    RETURN QUERY
    WITH filtered_products AS (
        SELECT 
            p.id,
            p.sku,
            p.slug,
            p.name_ru,
            p.name_kk,
            p.description_short_ru,
            p.brand,
            p.price,
            p.old_price,
            p.stock_quantity,
            p.category_id,
            p.is_featured,
            p.created_at,
            CASE 
                WHEN search_query IS NOT NULL AND search_query != '' 
                THEN ts_rank(p.search_vector, plainto_tsquery('russian', search_query))
                ELSE 1.0
            END AS relevance
        FROM products p
        WHERE 
            p.is_active = TRUE 
            AND p.is_deleted = FALSE
            AND (search_query IS NULL OR search_query = '' OR 
                 p.search_vector @@ plainto_tsquery('russian', search_query) OR
                 p.name_ru ILIKE '%' || search_query || '%' OR
                 p.brand ILIKE '%' || search_query || '%')
            AND (category_filter IS NULL OR p.category_id = category_filter)
            AND (brand_filter IS NULL OR p.brand = brand_filter)
            AND (min_price IS NULL OR p.price >= min_price)
            AND (max_price IS NULL OR p.price <= max_price)
            AND (in_stock_only = FALSE OR p.stock_quantity > 0)
    ),
    counted AS (
        SELECT COUNT(*) AS cnt FROM filtered_products
    )
    SELECT 
        fp.id,
        fp.sku,
        fp.slug,
        fp.name_ru,
        fp.name_kk,
        fp.description_short_ru,
        fp.brand,
        fp.price,
        fp.old_price,
        fp.stock_quantity,
        fp.category_id,
        (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = fp.id AND pi.is_primary = TRUE LIMIT 1),
        fp.is_featured,
        fp.relevance::REAL,
        c.cnt
    FROM filtered_products fp, counted c
    ORDER BY
        CASE WHEN sort_by = 'relevance' THEN fp.relevance END DESC,
        CASE WHEN sort_by = 'price_asc' THEN fp.price END ASC,
        CASE WHEN sort_by = 'price_desc' THEN fp.price END DESC,
        CASE WHEN sort_by = 'name' THEN fp.name_ru END ASC,
        CASE WHEN sort_by = 'newest' THEN fp.created_at END DESC,
        fp.id
    LIMIT page_size
    OFFSET offset_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ПОЛУЧЕНИЕ ТОВАРА ПО SLUG
-- =====================================================

CREATE OR REPLACE FUNCTION get_product_by_slug(product_slug TEXT)
RETURNS TABLE (
    id INTEGER,
    sku TEXT,
    slug TEXT,
    name_ru TEXT,
    name_kk TEXT,
    description_short_ru TEXT,
    description_short_kk TEXT,
    description_full_ru TEXT,
    description_full_kk TEXT,
    brand TEXT,
    price DECIMAL,
    old_price DECIMAL,
    stock_quantity INTEGER,
    category_id INTEGER,
    category_name_ru TEXT,
    is_featured BOOLEAN
) AS $$
BEGIN
    IF NOT is_adult() THEN
        RAISE EXCEPTION 'Access denied: user must be 18+';
    END IF;

    RETURN QUERY
    SELECT 
        p.id,
        p.sku,
        p.slug,
        p.name_ru,
        p.name_kk,
        p.description_short_ru,
        p.description_short_kk,
        p.description_full_ru,
        p.description_full_kk,
        p.brand,
        p.price,
        p.old_price,
        p.stock_quantity,
        p.category_id,
        c.name_ru AS category_name_ru,
        p.is_featured
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE 
        p.slug = product_slug
        AND p.is_active = TRUE 
        AND p.is_deleted = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ПОХОЖИЕ ТОВАРЫ
-- =====================================================

CREATE OR REPLACE FUNCTION get_similar_products(
    product_id_param INTEGER,
    limit_count INTEGER DEFAULT 4
)
RETURNS TABLE (
    id INTEGER,
    slug TEXT,
    name_ru TEXT,
    price DECIMAL,
    primary_image_url TEXT
) AS $$
BEGIN
    IF NOT is_adult() THEN
        RAISE EXCEPTION 'Access denied: user must be 18+';
    END IF;

    RETURN QUERY
    SELECT 
        p.id,
        p.slug,
        p.name_ru,
        p.price,
        (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = TRUE LIMIT 1)
    FROM products p
    WHERE 
        p.id != product_id_param
        AND p.is_active = TRUE 
        AND p.is_deleted = FALSE
        AND p.category_id = (SELECT category_id FROM products WHERE id = product_id_param)
    ORDER BY RANDOM()
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- КОРЗИНА
-- =====================================================

-- Добавить товар в корзину
CREATE OR REPLACE FUNCTION add_to_cart(
    product_id_param INTEGER,
    quantity_param INTEGER DEFAULT 1
)
RETURNS JSONB AS $$
DECLARE
    product_record RECORD;
    cart_record RECORD;
    result JSONB;
BEGIN
    -- Проверка возраста
    IF NOT is_adult() THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Access denied: user must be 18+');
    END IF;

    -- Получаем информацию о товаре
    SELECT * INTO product_record 
    FROM products 
    WHERE id = product_id_param AND is_active = TRUE AND is_deleted = FALSE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Product not found');
    END IF;

    -- Проверяем наличие
    IF product_record.stock_quantity < quantity_param THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Not enough stock', 'available', product_record.stock_quantity);
    END IF;

    -- Проверяем есть ли уже в корзине
    SELECT * INTO cart_record 
    FROM cart_items 
    WHERE user_id = auth.uid() AND product_id = product_id_param;

    IF FOUND THEN
        -- Обновляем количество
        IF cart_record.quantity + quantity_param > product_record.stock_quantity THEN
            RETURN jsonb_build_object('success', FALSE, 'error', 'Not enough stock', 'available', product_record.stock_quantity - cart_record.quantity);
        END IF;

        UPDATE cart_items 
        SET quantity = quantity + quantity_param, updated_at = NOW()
        WHERE id = cart_record.id;
    ELSE
        -- Добавляем новую позицию
        INSERT INTO cart_items (user_id, product_id, quantity)
        VALUES (auth.uid(), product_id_param, quantity_param);
    END IF;

    RETURN jsonb_build_object('success', TRUE, 'message', 'Added to cart');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Получить корзину с товарами
CREATE OR REPLACE FUNCTION get_cart()
RETURNS TABLE (
    id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    product_name_ru TEXT,
    product_name_kk TEXT,
    product_price DECIMAL,
    product_stock INTEGER,
    product_slug TEXT,
    primary_image_url TEXT,
    item_total DECIMAL
) AS $$
BEGIN
    IF NOT is_adult() THEN
        RAISE EXCEPTION 'Access denied: user must be 18+';
    END IF;

    RETURN QUERY
    SELECT 
        ci.id,
        ci.product_id,
        ci.quantity,
        p.name_ru,
        p.name_kk,
        p.price,
        p.stock_quantity,
        p.slug,
        (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = TRUE LIMIT 1),
        (p.price * ci.quantity)::DECIMAL
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE 
        ci.user_id = auth.uid()
        AND p.is_active = TRUE 
        AND p.is_deleted = FALSE
    ORDER BY ci.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Обновить количество в корзине
CREATE OR REPLACE FUNCTION update_cart_quantity(
    cart_item_id INTEGER,
    new_quantity INTEGER
)
RETURNS JSONB AS $$
DECLARE
    cart_record RECORD;
    product_record RECORD;
BEGIN
    -- Получаем позицию корзины
    SELECT ci.*, p.stock_quantity 
    INTO cart_record
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.id = cart_item_id AND ci.user_id = auth.uid();

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Cart item not found');
    END IF;

    IF new_quantity <= 0 THEN
        DELETE FROM cart_items WHERE id = cart_item_id;
        RETURN jsonb_build_object('success', TRUE, 'message', 'Item removed');
    END IF;

    IF new_quantity > cart_record.stock_quantity THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Not enough stock', 'available', cart_record.stock_quantity);
    END IF;

    UPDATE cart_items 
    SET quantity = new_quantity, updated_at = NOW()
    WHERE id = cart_item_id;

    RETURN jsonb_build_object('success', TRUE, 'message', 'Quantity updated');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Очистить корзину
CREATE OR REPLACE FUNCTION clear_cart()
RETURNS VOID AS $$
BEGIN
    DELETE FROM cart_items WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- СОЗДАНИЕ ЗАКАЗА
-- =====================================================

CREATE OR REPLACE FUNCTION create_order(
    delivery_method_param delivery_method,
    payment_method_param payment_method,
    delivery_city_param TEXT,
    delivery_street_param TEXT,
    delivery_building_param TEXT,
    delivery_apartment_param TEXT DEFAULT NULL,
    delivery_comment_param TEXT DEFAULT NULL,
    contact_name_param TEXT DEFAULT NULL,
    contact_phone_param TEXT DEFAULT NULL,
    order_comment_param TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    user_profile RECORD;
    cart_item RECORD;
    new_order_id INTEGER;
    order_total DECIMAL := 0;
    delivery_cost DECIMAL := 0;
    insufficient_stock JSONB := '[]'::JSONB;
BEGIN
    -- Проверка возраста
    IF NOT is_adult() THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Access denied: user must be 18+');
    END IF;

    -- Получаем профиль пользователя
    SELECT * INTO user_profile FROM profiles WHERE id = auth.uid();

    -- Проверяем корзину
    IF NOT EXISTS (SELECT 1 FROM cart_items WHERE user_id = auth.uid()) THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Cart is empty');
    END IF;

    -- Проверяем наличие всех товаров
    FOR cart_item IN 
        SELECT ci.*, p.stock_quantity, p.price, p.name_ru, p.sku
        FROM cart_items ci
        JOIN products p ON p.id = ci.product_id
        WHERE ci.user_id = auth.uid()
    LOOP
        IF cart_item.quantity > cart_item.stock_quantity THEN
            insufficient_stock := insufficient_stock || jsonb_build_object(
                'product_id', cart_item.product_id,
                'name', cart_item.name_ru,
                'requested', cart_item.quantity,
                'available', cart_item.stock_quantity
            );
        ELSE
            order_total := order_total + (cart_item.price * cart_item.quantity);
        END IF;
    END LOOP;

    IF jsonb_array_length(insufficient_stock) > 0 THEN
        RETURN jsonb_build_object(
            'success', FALSE, 
            'error', 'Some products are out of stock',
            'insufficient_stock', insufficient_stock
        );
    END IF;

    -- Стоимость доставки
    IF delivery_method_param = 'courier' THEN
        delivery_cost := 1500; -- 1500 тенге за курьерскую доставку
    END IF;

    -- Создаём заказ
    INSERT INTO orders (
        user_id,
        status,
        total_amount,
        delivery_method,
        delivery_cost,
        payment_method,
        payment_status,
        delivery_city,
        delivery_street,
        delivery_building,
        delivery_apartment,
        delivery_comment,
        contact_name,
        contact_phone,
        comment
    ) VALUES (
        auth.uid(),
        'new',
        order_total + delivery_cost,
        delivery_method_param,
        delivery_cost,
        payment_method_param,
        CASE WHEN payment_method_param = 'cash' THEN 'pending' ELSE 'pending' END,
        delivery_city_param,
        delivery_street_param,
        delivery_building_param,
        delivery_apartment_param,
        delivery_comment_param,
        COALESCE(contact_name_param, user_profile.first_name || ' ' || user_profile.last_name),
        COALESCE(contact_phone_param, user_profile.phone),
        order_comment_param
    ) RETURNING id INTO new_order_id;

    -- Добавляем позиции заказа
    INSERT INTO order_items (order_id, product_id, quantity, price, total, product_name_ru, product_name_kk, product_sku)
    SELECT 
        new_order_id,
        ci.product_id,
        ci.quantity,
        p.price,
        p.price * ci.quantity,
        p.name_ru,
        p.name_kk,
        p.sku
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.user_id = auth.uid();

    -- Уменьшаем остатки
    UPDATE products p
    SET stock_quantity = p.stock_quantity - ci.quantity
    FROM cart_items ci
    WHERE ci.product_id = p.id AND ci.user_id = auth.uid();

    -- Очищаем корзину
    DELETE FROM cart_items WHERE user_id = auth.uid();

    -- Создаём уведомление
    INSERT INTO notifications (user_id, type, title_ru, title_kk, message_ru, message_kk, data)
    VALUES (
        auth.uid(),
        'order_status',
        'Заказ создан',
        'Тапсырыс жасалды',
        'Ваш заказ #' || (SELECT order_number FROM orders WHERE id = new_order_id) || ' успешно создан',
        'Сіздің #' || (SELECT order_number FROM orders WHERE id = new_order_id) || ' тапсырысыңыз сәтті жасалды',
        jsonb_build_object('order_id', new_order_id)
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'order_id', new_order_id,
        'order_number', (SELECT order_number FROM orders WHERE id = new_order_id),
        'total_amount', order_total + delivery_cost
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ИСТОРИЯ ЗАКАЗОВ
-- =====================================================

CREATE OR REPLACE FUNCTION get_my_orders(
    page_number INTEGER DEFAULT 1,
    page_size INTEGER DEFAULT 10
)
RETURNS TABLE (
    id INTEGER,
    order_number TEXT,
    status order_status,
    total_amount DECIMAL,
    delivery_method delivery_method,
    payment_method payment_method,
    payment_status payment_status,
    created_at TIMESTAMPTZ,
    items_count BIGINT,
    total_count BIGINT
) AS $$
DECLARE
    offset_val INTEGER;
BEGIN
    offset_val := (page_number - 1) * page_size;

    RETURN QUERY
    WITH order_counts AS (
        SELECT COUNT(*) AS cnt FROM orders WHERE user_id = auth.uid()
    )
    SELECT 
        o.id,
        o.order_number,
        o.status,
        o.total_amount,
        o.delivery_method,
        o.payment_method,
        o.payment_status,
        o.created_at,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id),
        oc.cnt
    FROM orders o, order_counts oc
    WHERE o.user_id = auth.uid()
    ORDER BY o.created_at DESC
    LIMIT page_size
    OFFSET offset_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ИЗБРАННОЕ
-- =====================================================

CREATE OR REPLACE FUNCTION toggle_favorite(product_id_param INTEGER)
RETURNS JSONB AS $$
DECLARE
    existing_favorite RECORD;
BEGIN
    IF NOT is_adult() THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Access denied: user must be 18+');
    END IF;

    SELECT * INTO existing_favorite 
    FROM favorites 
    WHERE user_id = auth.uid() AND product_id = product_id_param;

    IF FOUND THEN
        DELETE FROM favorites WHERE id = existing_favorite.id;
        RETURN jsonb_build_object('success', TRUE, 'action', 'removed');
    ELSE
        INSERT INTO favorites (user_id, product_id) VALUES (auth.uid(), product_id_param);
        RETURN jsonb_build_object('success', TRUE, 'action', 'added');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- АДМИНСКИЕ ФУНКЦИИ
-- =====================================================

-- Обновить статус заказа
CREATE OR REPLACE FUNCTION admin_update_order_status(
    order_id_param INTEGER,
    new_status order_status,
    admin_comment_param TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    order_record RECORD;
BEGIN
    IF NOT is_admin() THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Access denied: admin only');
    END IF;

    SELECT * INTO order_record FROM orders WHERE id = order_id_param;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Order not found');
    END IF;

    -- Обновляем статус
    UPDATE orders SET 
        status = new_status,
        admin_comment = COALESCE(admin_comment_param, admin_comment),
        confirmed_at = CASE WHEN new_status = 'confirmed' THEN NOW() ELSE confirmed_at END,
        shipped_at = CASE WHEN new_status = 'shipping' THEN NOW() ELSE shipped_at END,
        delivered_at = CASE WHEN new_status = 'delivered' THEN NOW() ELSE delivered_at END,
        cancelled_at = CASE WHEN new_status = 'cancelled' THEN NOW() ELSE cancelled_at END
    WHERE id = order_id_param;

    -- Если отмена - возвращаем товары на склад
    IF new_status = 'cancelled' AND order_record.status != 'cancelled' THEN
        UPDATE products p
        SET stock_quantity = p.stock_quantity + oi.quantity
        FROM order_items oi
        WHERE oi.order_id = order_id_param AND oi.product_id = p.id;
    END IF;

    -- Создаём уведомление пользователю
    INSERT INTO notifications (user_id, type, title_ru, title_kk, message_ru, message_kk, data)
    VALUES (
        order_record.user_id,
        'order_status',
        'Статус заказа изменён',
        'Тапсырыс мәртебесі өзгертілді',
        'Статус заказа #' || order_record.order_number || ' изменён на: ' || new_status::TEXT,
        '#' || order_record.order_number || ' тапсырысының мәртебесі өзгертілді: ' || new_status::TEXT,
        jsonb_build_object('order_id', order_id_param, 'status', new_status)
    );

    RETURN jsonb_build_object('success', TRUE, 'message', 'Order status updated');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Логирование изменений товара
CREATE OR REPLACE FUNCTION log_product_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO product_change_log (product_id, admin_id, change_type, changes)
        VALUES (NEW.id, auth.uid(), 'created', to_jsonb(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO product_change_log (product_id, admin_id, change_type, changes)
        VALUES (NEW.id, auth.uid(), 'updated', jsonb_build_object(
            'old', to_jsonb(OLD),
            'new', to_jsonb(NEW)
        ));
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO product_change_log (product_id, admin_id, change_type, changes)
        VALUES (OLD.id, auth.uid(), 'deleted', to_jsonb(OLD));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_product_changes
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION log_product_change();

-- =====================================================
-- АНАЛИТИКА
-- =====================================================

CREATE OR REPLACE FUNCTION admin_get_dashboard_stats(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    IF NOT is_admin() THEN
        RETURN jsonb_build_object('error', 'Access denied: admin only');
    END IF;

    SELECT jsonb_build_object(
        'total_orders', (SELECT COUNT(*) FROM orders WHERE created_at >= start_date AND created_at <= end_date + INTERVAL '1 day'),
        'total_revenue', (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'delivered' AND created_at >= start_date AND created_at <= end_date + INTERVAL '1 day'),
        'average_order', (SELECT COALESCE(AVG(total_amount), 0) FROM orders WHERE status = 'delivered' AND created_at >= start_date AND created_at <= end_date + INTERVAL '1 day'),
        'new_users', (SELECT COUNT(*) FROM profiles WHERE created_at >= start_date AND created_at <= end_date + INTERVAL '1 day'),
        'pending_orders', (SELECT COUNT(*) FROM orders WHERE status = 'new'),
        'top_products', (
            SELECT jsonb_agg(tp) FROM (
                SELECT p.name_ru, SUM(oi.quantity) AS sold_count
                FROM order_items oi
                JOIN products p ON p.id = oi.product_id
                JOIN orders o ON o.id = oi.order_id
                WHERE o.created_at >= start_date AND o.created_at <= end_date + INTERVAL '1 day'
                GROUP BY p.id, p.name_ru
                ORDER BY sold_count DESC
                LIMIT 10
            ) tp
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
