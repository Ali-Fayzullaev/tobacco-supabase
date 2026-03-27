-- Обновление данных магазина под ТОО Premium Tobacco
-- Запустить в Supabase SQL Editor

-- Обновить существующие настройки
UPDATE public.store_settings SET value = 'Premium Tobacco', updated_at = now() WHERE key = 'store_name';
UPDATE public.store_settings SET value = 'premiumtobacco.info@gmail.com', updated_at = now() WHERE key = 'store_email';
UPDATE public.store_settings SET value = '+7 (700) 800-18-00', updated_at = now() WHERE key = 'store_phone';
UPDATE public.store_settings SET value = 'г. Астана', updated_at = now() WHERE key = 'store_address';
UPDATE public.store_settings SET value = 'ТОО Premium Tobacco — ведущий импортер и дистрибьютор премиальной табачной продукции в Республике Казахстан. Прямой импорт и эксклюзивное представительство глобальных табачных производителей.', updated_at = now() WHERE key = 'store_description';
UPDATE public.store_settings SET value = '200000', updated_at = now() WHERE key = 'free_delivery_threshold';
UPDATE public.store_settings SET value = '1-7', updated_at = now() WHERE key = 'delivery_days';
UPDATE public.store_settings SET value = '0', updated_at = now() WHERE key = 'delivery_cost';

-- Только безналичный расчет
UPDATE public.store_settings SET value = 'false', updated_at = now() WHERE key = 'payment_cash';
UPDATE public.store_settings SET value = 'false', updated_at = now() WHERE key = 'payment_card';
UPDATE public.store_settings SET value = 'false', updated_at = now() WHERE key = 'payment_kaspi';

-- Новые настройки
INSERT INTO public.store_settings (key, value) VALUES
  ('store_phone_suppliers', '+7 (705) 888-19-19'),
  ('store_schedule', 'Пн-Пт: 09:00 – 19:00'),
  ('payment_invoice', 'true'),
  ('franchise_url', ''),
  ('store_slogan', 'Ведущий импортер и дистрибьютор премиальной табачной продукции в Республике Казахстан')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
