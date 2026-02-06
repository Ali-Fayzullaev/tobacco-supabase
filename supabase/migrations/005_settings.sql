-- Таблица настроек магазина
CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Все могут читать настройки
CREATE POLICY "Anyone can read settings" ON public.store_settings
  FOR SELECT USING (true);

-- Только админы могут изменять
CREATE POLICY "Admins can manage settings" ON public.store_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Начальные настройки
INSERT INTO public.store_settings (key, value) VALUES
  ('store_name', 'Shop Shop'),
  ('store_email', 'info@tobacco.kz'),
  ('store_phone', '+7 (777) 123-45-67'),
  ('store_address', 'г. Алматы, ул. Абая 1'),
  ('store_description', 'Премиальный табачный магазин в Казахстане'),
  ('delivery_cost', '1500'),
  ('free_delivery_threshold', '10000'),
  ('delivery_days', '2-5'),
  ('payment_cash', 'true'),
  ('payment_card', 'true'),
  ('payment_kaspi', 'true')
ON CONFLICT (key) DO NOTHING;

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_timestamp();
