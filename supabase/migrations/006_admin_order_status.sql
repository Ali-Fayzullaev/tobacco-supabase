-- Функция для обновления статуса заказа (только для админов)
CREATE OR REPLACE FUNCTION admin_update_order_status(
  p_order_id UUID,
  p_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  -- Проверяем роль пользователя
  SELECT role INTO v_user_role 
  FROM profiles 
  WHERE id = auth.uid();
  
  IF v_user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  
  -- Обновляем статус заказа
  UPDATE orders 
  SET 
    status = p_status,
    updated_at = NOW()
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
END;
$$;

-- Даём права на выполнение функции
GRANT EXECUTE ON FUNCTION admin_update_order_status TO authenticated;

-- Также добавим RLS политику для прямого обновления заказов админами (на всякий случай)
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
CREATE POLICY "Admins can update orders" ON orders
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
