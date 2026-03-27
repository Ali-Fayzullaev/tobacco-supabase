// frontend/src/app/admin/users/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { 
  Search, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  Users,
  RefreshCw,
  Shield,
  User,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  MoreVertical,
  Crown,
  UserCheck,
  UserX,
  Grid,
  List
} from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { TableSkeleton } from '@/components/Skeleton';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: string;
  created_at: string;
  orders_count?: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'auto' | 'table' | 'cards'>('auto');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const perPage = 20;

  useEffect(() => {
    loadUsers();
  }, [roleFilter, page]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * perPage, page * perPage - 1);

      if (roleFilter) {
        query = query.eq('role', roleFilter);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Get orders count for each user
      const usersWithOrders = await Promise.all(
        (data || []).map(async (user) => {
          const { count: ordersCount } = await supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id);
          return { ...user, orders_count: ordersCount || 0 };
        })
      );

      setUsers(usersWithOrders);
      setTotalPages(Math.ceil((count || 0) / perPage));
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const supabase = createBrowserSupabaseClient();
      
      // Используем RPC функцию для безопасного обновления роли
      const { data, error } = await supabase.rpc('update_user_role', {
        target_user_id: userId,
        new_role: newRole
      });

      if (error) {
        // Fallback на прямое обновление если RPC не существует
        if (error.message.includes('function') || error.code === '42883') {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);
          
          if (updateError) throw updateError;
        } else {
          throw error;
        }
      }

      // Обновляем локальный стейт
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
      
      alert(`Роль успешно изменена на "${newRole === 'admin' ? 'Администратор' : 'Пользователь'}"`);
    } catch (error: any) {
      console.error('Error updating user role:', error);
      alert(`Ошибка при изменении роли: ${error.message || 'Неизвестная ошибка'}`);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(query) ||
      user.first_name?.toLowerCase().includes(query) ||
      user.last_name?.toLowerCase().includes(query) ||
      user.phone?.includes(query)
    );
  });

  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount = users.filter(u => u.role === 'user').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] flex items-center gap-3">
            <Users className="w-8 h-8 text-gold-500" />
            Пользователи
          </h1>
          <p className="text-[#A0A0A0] mt-1">Управление аккаунтами пользователей</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadUsers}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#252525] hover:bg-[#2A2A2A] text-[#C0C0C0] rounded-xl font-medium transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            Обновить
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F5F5F5]">{totalCount}</p>
              <p className="text-xs text-[#A0A0A0]">Всего</p>
            </div>
          </div>
        </div>
        <div className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold-500/15 rounded-lg flex items-center justify-center">
              <Crown className="w-5 h-5 text-gold-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F5F5F5]">{adminCount}</p>
              <p className="text-xs text-[#A0A0A0]">Админов</p>
            </div>
          </div>
        </div>
        <div className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-900/30 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F5F5F5]">{userCount}</p>
              <p className="text-xs text-[#A0A0A0]">Пользователей</p>
            </div>
          </div>
        </div>
        <div className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-900/30 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F5F5F5]">
                {users.reduce((sum, u) => sum + (u.orders_count || 0), 0)}
              </p>
              <p className="text-xs text-[#A0A0A0]">Заказов</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#1E1E1E] rounded-2xl shadow-sm border border-[#2A2A2A] p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666]" />
            <input
              type="text"
              placeholder="Поиск по имени, email, телефону..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#121212] text-[#F5F5F5] placeholder:text-[#666] border border-[#2A2A2A] rounded-xl focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all"
            />
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-3 bg-[#121212] px-4 rounded-xl">
            <Shield className="w-5 h-5 text-[#666]" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="py-3 bg-transparent border-0 focus:ring-0 font-medium text-[#C0C0C0]"
            >
              <option value="">Все роли</option>
              <option value="admin">Администраторы</option>
              <option value="user">Пользователи</option>
            </select>
          </div>

          {/* View Mode */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[#A0A0A0] text-sm">Вид:</span>
            {(['auto', 'table', 'cards'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  viewMode === mode
                    ? 'bg-gold-500 text-[#121212]'
                    : 'bg-[#252525] text-[#A0A0A0] hover:bg-[#2A2A2A]'
                )}
              >
                {mode === 'auto' ? 'Авто' : mode === 'table' ? 'Таблица' : 'Карточки'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#1E1E1E] rounded-2xl shadow-sm border border-[#2A2A2A] overflow-hidden">
        {isLoading ? (
          <div className="p-4">
            <TableSkeleton cols={5} rows={6} />
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className={cn(
              viewMode === 'table' ? 'hidden' : viewMode === 'cards' ? 'block' : 'lg:hidden',
              'divide-y divide-[#2A2A2A]'
            )}>
              {filteredUsers.map((user) => (
                <div key={user.id} className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0",
                      user.role === 'admin' 
                        ? "bg-gradient-to-br from-gold-500 to-red-600" 
                        : "bg-gradient-to-br from-blue-400 to-blue-600"
                    )}>
                      {user.first_name?.[0] || user.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#F5F5F5] truncate">
                        {user.first_name || user.last_name 
                          ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                          : 'Без имени'
                        }
                      </p>
                      <p className="text-xs text-[#666] truncate">{user.email}</p>
                    </div>
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user.id, e.target.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-semibold border-0 cursor-pointer flex-shrink-0",
                        user.role === 'admin' 
                          ? "bg-gold-500/15 text-gold-700" 
                          : "bg-blue-900/30 text-blue-400"
                      )}
                    >
                      <option value="user">Пользователь</option>
                      <option value="admin">Администратор</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#666]">
                    <div className="flex items-center gap-3">
                      {user.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {user.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3" />
                        {user.orders_count || 0} заказов
                      </span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(user.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="px-6 py-16 text-center">
                  <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-[#A0A0A0] font-medium">Пользователи не найдены</p>
                  <p className="text-[#666] text-sm mt-1">Попробуйте изменить фильтры</p>
                </div>
              )}
            </div>

            {/* Desktop Table */}
            <div className={cn(
              viewMode === 'cards' ? 'hidden' : viewMode === 'table' ? 'block' : 'hidden lg:block',
              'overflow-x-auto'
            )}>
              <table className="w-full">
                <thead className="bg-[#121212]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider">
                      Пользователь
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider">
                      Контакты
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider">
                      Роль
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider">
                      Заказов
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider">
                      Регистрация
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A2A]">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gold-500/10/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0",
                            user.role === 'admin' 
                              ? "bg-gradient-to-br from-gold-500 to-red-600" 
                              : "bg-gradient-to-br from-blue-400 to-blue-600"
                          )}>
                            {user.first_name?.[0] || user.email?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#F5F5F5]">
                              {user.first_name || user.last_name 
                                ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                                : 'Без имени'
                              }
                            </p>
                            <p className="text-xs text-[#666] truncate">{user.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-[#A0A0A0]">
                            <Mail className="w-4 h-4 text-[#666]" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2 text-sm text-[#A0A0A0]">
                              <Phone className="w-4 h-4 text-[#666]" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, e.target.value)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-semibold border-0 cursor-pointer",
                            user.role === 'admin' 
                              ? "bg-gold-500/15 text-gold-700" 
                              : "bg-blue-900/30 text-blue-400"
                          )}
                        >
                          <option value="user">Пользователь</option>
                          <option value="admin">Администратор</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-[#666]" />
                          <span className="font-semibold text-[#F5F5F5]">
                            {user.orders_count || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-[#A0A0A0]">
                          <Calendar className="w-4 h-4 text-[#666]" />
                          {new Date(user.created_at).toLocaleDateString('ru-RU')}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-[#A0A0A0] font-medium">Пользователи не найдены</p>
                        <p className="text-[#666] text-sm mt-1">Попробуйте изменить фильтры</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-[#2A2A2A] bg-[#121212]">
                <p className="text-sm text-[#A0A0A0]">
                  Показано {(page - 1) * perPage + 1} - {Math.min(page * perPage, totalCount)} из {totalCount}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 border border-[#2A2A2A] bg-[#1E1E1E] rounded-lg disabled:opacity-50 hover:bg-[#121212] transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="px-4 py-2 text-sm font-medium text-[#C0C0C0]">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 border border-[#2A2A2A] bg-[#1E1E1E] rounded-lg disabled:opacity-50 hover:bg-[#121212] transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
