'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Trash2, Eye, Check, X, RefreshCw, Search } from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { formatDateTime, cn, truncate } from '@/lib/utils';
import { toast } from 'sonner';

type ErrorReport = {
  id: number;
  created_at: string;
  message: string;
  stack?: string | null;
  url?: string | null;
  user_id?: string | null;
  user_consent?: boolean;
  resolved?: boolean;
};

export default function AdminErrorReportsPage() {
  const [reports, setReports] = useState<ErrorReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [resolvedFilter, setResolvedFilter] = useState<'all' | 'resolved' | 'unresolved'>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 20;

  useEffect(() => {
    loadReports();
  }, [page, resolvedFilter]);

  // Загружает список отчётов с фильтрами и пагинацией
  const loadReports = async () => {
    setIsLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      let q = supabase
        .from('error_reports')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * perPage, page * perPage - 1);

      if (resolvedFilter === 'resolved') q = q.eq('resolved', true);
      if (resolvedFilter === 'unresolved') q = q.eq('resolved', false);

      if (query.trim()) {
        const like = `%${query.replace(/%/g, '')}%`;
        // поиск по message, url, user_id
        q = q.or(`message.ilike.${like},url.ilike.${like},user_id.ilike.${like}`);
      }

      const { data, error, count } = await q;
      if (error) throw error;
      setReports((data || []) as ErrorReport[]);
      setTotal(count || 0);
    } catch (err: any) {
      console.error('Load reports error:', err);
      toast.error('Ошибка загрузки отчётов');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleResolved = async (id: number, newValue: boolean) => {
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.from('error_reports').update({ resolved: newValue }).eq('id', id);
      if (error) throw error;
      toast.success(newValue ? 'Помечено как решённое' : 'Пометка снята');
      await loadReports();
    } catch (err: any) {
      console.error('Toggle resolved error:', err);
      toast.error('Не удалось обновить статус');
    }
  };

  const deleteReport = async (id: number) => {
    if (!confirm('Удалить этот отчёт об ошибке?')) return;
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.from('error_reports').delete().eq('id', id);
      if (error) throw error;
      toast.success('Отчёт удалён');
      await loadReports();
    } catch (err: any) {
      console.error('Delete report error:', err);
      toast.error('Не удалось удалить отчёт');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-orange-500" />
            Отчёты об ошибках
          </h1>
          <p className="text-gray-500 mt-1">Просмотр автоматических отчётов — можно отметить как resolved</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => loadReports()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200">
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            Обновить
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); loadReports(); } }}
            placeholder="Поиск по сообщению, URL или user_id"
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Статус:</label>
          <select
            value={resolvedFilter}
            onChange={(e) => { setResolvedFilter(e.target.value as any); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-xl bg-white"
          >
            <option value="all">Все</option>
            <option value="unresolved">Только не решённые</option>
            <option value="resolved">Только решённые</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">Найдено: {total}</div>
            <div className="text-sm text-gray-400">Страница {page}</div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Дата</th>
                    <th className="px-4 py-3">Сообщение</th>
                    <th className="px-4 py-3">URL</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Consent</th>
                    <th className="px-4 py-3">Resolved</th>
                    <th className="px-4 py-3">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-36" /></td>
                      <td className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-64" /></td>
                      <td className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-48" /></td>
                      <td className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-24" /></td>
                      <td className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-16" /></td>
                      <td className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-20" /></td>
                      <td className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-20" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Отчётов не найдено</div>
        ) : (
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Дата</th>
                    <th className="px-4 py-3">Сообщение</th>
                    <th className="px-4 py-3">URL</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Consent</th>
                    <th className="px-4 py-3">Resolved</th>
                    <th className="px-4 py-3">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reports.map((r) => (
                    <tr key={r.id} className={cn(r.resolved ? 'bg-green-50' : '', 'group hover:bg-gray-50 transition-colors')}>
                      <td className="px-4 py-3 align-top text-xs text-gray-600 w-[160px]">{formatDateTime(r.created_at)}</td>
                      <td className="px-4 py-3 align-top max-w-xl">
                        <div className="font-medium text-gray-900">{truncate(r.message || '', 120)}</div>
                        <details className="text-xs text-gray-500 mt-1">
                          <summary className="cursor-pointer">Показать полный текст</summary>
                          <pre className="whitespace-pre-wrap mt-2 text-xs text-gray-700 bg-gray-50 p-3 rounded">{r.message}</pre>
                        </details>
                      </td>
                      <td className="px-4 py-3 align-top max-w-sm text-sm text-blue-600">
                        {r.url ? <a href={r.url} target="_blank" rel="noreferrer" className="hover:underline">{truncate(r.url, 60)}</a> : '-'}
                      </td>
                      <td className="px-4 py-3 align-top text-sm text-gray-700">{r.user_id || '-'}</td>
                      <td className="px-4 py-3 align-top text-sm">
                        {r.user_consent ? <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">yes</span> : <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs">no</span>}
                      </td>
                      <td className="px-4 py-3 align-top text-sm">
                        {r.resolved ? <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">resolved</span> : <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs">unresolved</span>}
                      </td>
                      <td className="px-4 py-3 align-top text-sm">
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleResolved(r.id, !r.resolved)} className="px-3 py-1 rounded-full bg-white border border-gray-200 text-sm hover:bg-gray-50">
                            {r.resolved ? 'Unresolve' : 'Mark resolved'}
                          </button>
                          <button onClick={() => deleteReport(r.id)} className="p-2 rounded-full text-red-500 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <details className="mt-2 text-xs text-gray-500 max-h-40 overflow-auto">
                          <summary className="cursor-pointer">Stack / details</summary>
                          <pre className="whitespace-pre-wrap mt-2 text-xs text-gray-700 bg-gray-50 p-3 rounded">{r.stack || '—'}</pre>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">Показано {reports.length} из {total}</div>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded-lg bg-white border border-gray-200">Prev</button>
                <div className="px-3 py-1 rounded-lg bg-white border border-gray-200 text-sm">{page}</div>
                <button onClick={() => setPage(p => p + 1)} disabled={page * perPage >= total} className="px-3 py-1 rounded-lg bg-white border border-gray-200">Next</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
