-- 015_error_reports_add_resolved.sql
-- Добавляет колонку resolved в таблицу error_reports

alter table if exists public.error_reports
  add column if not exists resolved boolean default false not null;

create index if not exists idx_error_reports_resolved on public.error_reports(resolved);
