-- Миграция: Система уведомлений для пользователей
-- Позволяет отправлять уведомления клиентам (например, при удалении товаров)

-- Таблица уведомлений
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL DEFAULT 'info', -- info, warning, success, error, product_deleted
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}', -- дополнительные данные (order_id, product_id и т.д.)
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- RLS для уведомлений
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Пользователи видят только свои уведомления
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Пользователи могут отмечать свои уведомления как прочитанные
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Админы могут создавать уведомления
DROP POLICY IF EXISTS "Admin can insert notifications" ON notifications;
CREATE POLICY "Admin can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (is_admin_safe());

-- Админы могут видеть все уведомления  
DROP POLICY IF EXISTS "Admin can view all notifications" ON notifications;
CREATE POLICY "Admin can view all notifications"
  ON notifications FOR SELECT
  USING (is_admin_safe());

-- Функция для отправки уведомления пользователю
CREATE OR REPLACE FUNCTION send_notification(
  p_user_id UUID,
  p_type VARCHAR(50),
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Функция для отправки уведомлений о удалённых товарах всем затронутым клиентам
CREATE OR REPLACE FUNCTION notify_customers_about_deleted_products(
  product_ids UUID[],
  custom_message TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected_user RECORD;
  notification_count INTEGER := 0;
  product_names TEXT;
BEGIN
  -- Проверяем права админа
  IF NOT is_admin_safe() THEN
    RAISE EXCEPTION 'Нет прав администратора';
  END IF;

  -- Для каждого уникального пользователя, у которого есть заказы с этими товарами
  FOR affected_user IN
    SELECT DISTINCT 
      o.user_id,
      array_agg(DISTINCT COALESCE(oi.product_name_snapshot, p.name)) as product_names,
      array_agg(DISTINCT o.order_number) as order_numbers
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    LEFT JOIN products p ON p.id = oi.product_id
    WHERE oi.product_id = ANY(product_ids)
      AND o.user_id IS NOT NULL
    GROUP BY o.user_id
  LOOP
    -- Формируем сообщение
    product_names := array_to_string(affected_user.product_names, ', ');
    
    -- Отправляем уведомление
    PERFORM send_notification(
      affected_user.user_id,
      'product_deleted',
      'Изменение в вашем заказе',
      COALESCE(
        custom_message,
        'Уважаемый клиент! К сожалению, следующие товары из ваших заказов были удалены из нашего ассортимента: ' || 
        product_names || 
        '. Приносим извинения за неудобства. Если у вас есть вопросы, свяжитесь с нами.'
      ),
      jsonb_build_object(
        'product_ids', product_ids,
        'product_names', affected_user.product_names,
        'order_numbers', affected_user.order_numbers
      )
    );
    
    notification_count := notification_count + 1;
  END LOOP;
  
  RETURN notification_count;
END;
$$;
