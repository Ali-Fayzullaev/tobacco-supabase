# 🚀 Пошаговая инструкция по настройке Supabase

## 📋 ШАГ 1: Создание проекта в Supabase

### 1.1 Регистрация и создание проекта

1. **Перейди на сайт Supabase:**
   - Открой https://supabase.com
   - Нажми "Start your project" или "Sign in"

2. **Войди через GitHub:**
   - Нажми "Sign in with GitHub"
   - Разреши доступ к аккаунту

3. **Создай новый проект:**
   - Нажми "New Project"
   - Заполни:
     - **Name:** `tobacco-shop-kz`
     - **Database Password:** Придумай сложный пароль (сохрани его!)
     - **Region:** Выбери ближайший (например, `Frankfurt (eu-central-1)`)
   - Нажми "Create new project"
   - Подожди 2-3 минуты пока проект создастся

### 1.2 Получение ключей API

После создания проекта:

1. **Перейди в Settings → API**
2. **Скопируй и сохрани:**
   ```
   Project URL: https://xxxxxxxxxx.supabase.co
   anon (public) key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (СЕКРЕТНЫЙ!)
   ```

⚠️ **ВАЖНО:** `service_role key` - это СЕКРЕТНЫЙ ключ, не публикуй его нигде!

---

## 📋 ШАГ 2: Настройка базы данных

### 2.1 Открой SQL Editor

1. В левом меню нажми **"SQL Editor"**
2. Нажми **"New query"**

### 2.2 Выполни миграции

Скопируй содержимое файлов из папки `supabase/migrations/` и выполни их **по порядку**:

1. Сначала `001_initial_schema.sql`
2. Потом `002_rls_policies.sql`
3. Затем `003_functions.sql`
4. И наконец `004_seed_data.sql`

Для каждого файла:
1. Вставь SQL код в редактор
2. Нажми **"Run"** (или Ctrl+Enter)
3. Убедись что нет ошибок (зеленая галочка)

---

## 📋 ШАГ 3: Настройка Authentication (Email + Password)

### 3.1 Включение Email-провайдера

1. **Перейди в Authentication → Providers**
2. **Email** должен быть включен (по умолчанию включен)
3. Убедись, что настройки:
   - ✅ **Enable Email provider** — включено
   - ✅ **Confirm email** — включено (отправка письма подтверждения)
   - ❌ **Secure email change** — по желанию
   - ❌ **Enable phone provider** — отключено (мы используем email)

### 3.2 Настройка Email Templates (ОБЯЗАТЕЛЬНО!)

1. **Перейди в Authentication → Email Templates**

2. **Confirm signup** — шаблон подтверждения регистрации:
   ```html
   <h2>Добро пожаловать в Premium Tobacco!</h2>
   <p>Здравствуйте!</p>
   <p>Благодарим за регистрацию. Для подтверждения email-адреса перейдите по ссылке:</p>
   <p><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#D4AF37;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Подтвердить email</a></p>
   <p style="color:#888;font-size:12px;margin-top:20px;">Если вы не регистрировались — просто проигнорируйте это письмо.</p>
   <p style="color:#888;font-size:12px;">⚠️ Магазин предназначен только для лиц старше 21 года.</p>
   ```

3. **Reset password** — шаблон сброса пароля:
   ```html
   <h2>Сброс пароля — Premium Tobacco</h2>
   <p>Вы запросили сброс пароля. Перейдите по ссылке, чтобы установить новый пароль:</p>
   <p><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#D4AF37;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Сбросить пароль</a></p>
   <p style="color:#888;font-size:12px;margin-top:20px;">Ссылка действительна 1 час. Если вы не запрашивали сброс — проигнорируйте это письмо.</p>
   ```

4. **Magic Link** (если включено):
   ```html
   <h2>Вход в Premium Tobacco</h2>
   <p><a href="{{ .ConfirmationURL }}">Войти в аккаунт</a></p>
   ```

### 3.3 Настройка URL редиректов (ВАЖНО!)

1. **Перейди в Authentication → URL Configuration**
2. **Site URL:** `http://localhost:3000` (для разработки) или ваш домен
3. **Redirect URLs** — добавь ВСЕ:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/reset-password`
   - `http://localhost:3000/login`
   
   Для продакшена добавь также:
   - `https://yourdomain.com/auth/callback`
   - `https://yourdomain.com/auth/reset-password`
   - `https://yourdomain.com/login`

### 3.4 Настройка SMTP (для production)

По умолчанию Supabase отправляет до **4 email/час** через встроенный SMTP.
Для production настройте свой SMTP:

1. **Перейди в Project Settings → Authentication → SMTP Settings**
2. **Enable Custom SMTP** → включить
3. Заполни данные SMTP (например, для Brevo / SendGrid / Mailgun):
   - **Sender email:** `noreply@yourdomain.com`
   - **Sender name:** `Premium Tobacco`
   - **Host:** (от вашего SMTP-провайдера)
   - **Port:** `587`
   - **Username / Password:** (от SMTP-провайдера)

⚠️ **Без custom SMTP** можно отправить максимум 4 письма в час! Для тестов хватит, для production — настройте SMTP.

---

## 📋 ШАГ 4: Настройка Storage (для изображений)

### 4.1 Создание bucket

1. **Перейди в Storage**
2. **Нажми "New bucket"**
3. **Создай bucket:**
   - **Name:** `products`
   - **Public:** ✅ включить (чтобы картинки были доступны)
4. **Нажми "Create bucket"**

### 4.2 Настройка политик Storage

В SQL Editor выполни:

```sql
-- Политика: любой может читать изображения товаров
CREATE POLICY "Public product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

-- Политика: только админы могут загружать/удалять
CREATE POLICY "Admin can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products' 
  AND auth.jwt() ->> 'role' = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Admin can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'products' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);
```

---

## 📋 ШАГ 5: Настройка Edge Functions (опционально)

### 5.1 Установка Supabase CLI

```bash
# Windows (PowerShell от имени администратора)
scoop install supabase

# Или через npm
npm install -g supabase
```

### 5.2 Инициализация локально

```bash
cd tobacco-supabase
supabase init
supabase login
supabase link --project-ref <твой-project-ref>
```

### 5.3 Создание функции

```bash
supabase functions new process-order
```

### 5.4 Деплой функции

```bash
supabase functions deploy process-order
```

---

## 📋 ШАГ 6: Настройка Frontend

### 6.1 Создание .env.local

Создай файл `.env.local` в папке `frontend/`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ Замени на свои ключи из шага 1.2!

### 6.2 Установка зависимостей

```bash
cd frontend
npm install
```

### 6.3 Запуск проекта

```bash
npm run dev
```

Открой http://localhost:3000

---

## 📋 ШАГ 7: Создание первого админа

### 7.1 Регистрация

1. Открой http://localhost:3000/register
2. Зарегистрируйся как обычный пользователь
3. Подтверди email (проверь почту)

### 7.2 Назначение админом

В Supabase SQL Editor выполни:

```sql
-- Замени email на свой!
UPDATE profiles 
SET is_admin = true 
WHERE email = 'твой-email@example.com';
```

Теперь ты админ! 🎉

---

## 🔧 Полезные команды Supabase

### Просмотр данных

```sql
-- Все пользователи
SELECT * FROM profiles;

-- Все товары
SELECT * FROM products WHERE is_deleted = false;

-- Все заказы
SELECT * FROM orders ORDER BY created_at DESC;
```

### Очистка тестовых данных

```sql
-- Удалить все заказы
DELETE FROM order_items;
DELETE FROM orders;

-- Очистить корзины
DELETE FROM cart_items;

-- Удалить товары (мягкое удаление)
UPDATE products SET is_deleted = true;
```

---

## ⚠️ Важные моменты

### Безопасность

1. **Никогда не публикуй `service_role key`**
2. **RLS политики защищают данные** - не отключай их
3. **Проверяй возраст** - это требование законодательства РК

### Лимиты бесплатного плана

- 500 MB база данных
- 1 GB Storage
- 2 GB bandwidth
- 50,000 активных пользователей в месяц

Для старта этого более чем достаточно!

### Мониторинг

1. **Dashboard → Reports** - статистика использования
2. **Logs → API** - логи запросов
3. **Logs → Auth** - логи аутентификации

---

## 🆘 Если что-то не работает

### Проблема: "permission denied"
- Проверь RLS политики
- Убедись что пользователь авторизован

### Проблема: "JWT expired"
- Токен истёк, нужно обновить
- Проверь настройки JWT в Settings → Auth

### Проблема: Изображения не загружаются
- Проверь политики Storage
- Убедись что bucket публичный

---

## 📞 Поддержка

- [Документация Supabase](https://supabase.com/docs)
- [Discord сообщество](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)
