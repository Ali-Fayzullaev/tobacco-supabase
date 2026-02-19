-- 014_error_reports.sql
-- Создаёт таблицу для хранения отчётов об ошибках из фронтенда

create table if not exists public.error_reports (
  id bigserial primary key,
  created_at timestamptz default now() not null,
  message text not null,
  stack text,
  url text,
  user_id text,
  user_consent boolean default false
);

-- Добавляем простой индекс по created_at для быстрых выборок
create index if not exists idx_error_reports_created_at on public.error_reports(created_at desc);
