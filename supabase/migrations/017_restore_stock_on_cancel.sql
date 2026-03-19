-- =====================================================
-- RESTORE STOCK ON ORDER CANCEL
-- Returns stock when order is cancelled
-- =====================================================

-- Функция возврата остатка при отмене заказа
CREATE OR REPLACE FUNCTION restore_stock_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
    -- Только если статус меняется на 'cancelled' и раньше не был 'cancelled'
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        UPDATE products p
        SET stock = p.stock + oi.quantity,
            updated_at = NOW()
        FROM order_items oi
        WHERE oi.order_id = NEW.id
          AND oi.product_id = p.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_restore_stock_on_cancel ON orders;
CREATE TRIGGER trigger_restore_stock_on_cancel
    AFTER UPDATE OF status ON orders
    FOR EACH ROW
    WHEN (NEW.status = 'cancelled' AND OLD.status != 'cancelled')
    EXECUTE FUNCTION restore_stock_on_cancel();
