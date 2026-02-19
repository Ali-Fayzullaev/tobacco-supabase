'use client';

import React, { Component, ErrorInfo } from 'react';
import { toast } from 'sonner';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error | null;
  errorInfo?: ErrorInfo | null;
  sending: boolean;
};

// Компонент ErrorBoundary для перехвата ошибок на клиенте
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, errorInfo: null, sending: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error } as Partial<State>;
  }

  // Логируем подробности ошибки (можно отправлять на сервер тоже)
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Сохраняем локально — пользователь сможет отправить отчет
    this.setState({ error, errorInfo });

    // Автоматически отправляем минимальный отчет (user_consent = false)
    void this.sendReport({
      message: error.message,
      stack: error.stack || errorInfo.componentStack || null,
      url: typeof window !== 'undefined' ? window.location.href : null,
      userId: null,
      user_consent: false,
    }).catch(() => {
      // ошибки при отправке не ломают UI
    });
  }

  // Отправка отчёта в /api/report-error
  async sendReport(payload: {
    message: string;
    stack?: string | null;
    url?: string | null;
    userId?: string | null;
    user_consent?: boolean;
  }) {
    this.setState({ sending: true });
    try {
      const res = await fetch('/api/report-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to send report: ${res.status} ${text}`);
      }
      return true;
    } finally {
      this.setState({ sending: false });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    // UI — красивое сообщение и кнопка отправки отчета
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-2xl w-full bg-white shadow-lg rounded-2xl border border-gray-100 p-8 text-center">
          <div className="text-orange-500 mb-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 mx-auto">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <path d="M12 9v4"/><path d="M12 17h.01"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Что‑то пошло не так</h2>
          <p className="text-gray-500 mb-6">Мы уже получили краткий отчёт об ошибке. Вы можете отправить дополнительную информацию разработчикам.</p>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                // Простая локальная перезагрузка страницы
                window.location.reload();
              }}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Перезагрузить страницу
            </button>

            <button
              onClick={async () => {
                try {
                  await this.sendReport({
                    message: this.state.error?.message || 'Client error',
                    stack: this.state.error?.stack || this.state.errorInfo?.componentStack || null,
                    url: typeof window !== 'undefined' ? window.location.href : null,
                    userId: null,
                    user_consent: true,
                  });
                  toast.success('Спасибо — мы исправим эту проблему');
                } catch (err: any) {
                  console.error('Report send failed:', err);
                  toast.error('Не удалось отправить отчёт — попробуйте позже');
                }
              }}
              disabled={this.state.sending}
              className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {this.state.sending ? 'Отправка...' : 'Отправить разработчикам'}
            </button>
          </div>

          <details className="mt-6 text-xs text-gray-400 text-left max-h-48 overflow-auto p-3 bg-gray-50 rounded-md">
            <summary className="cursor-pointer text-sm text-gray-600">Показать данные ошибки</summary>
            <div className="mt-2 whitespace-pre-wrap text-xs text-gray-700">
              <strong>Message:</strong>
              <div>{this.state.error?.message}</div>
              <strong className="mt-2 block">Stack:</strong>
              <div>{this.state.error?.stack || this.state.errorInfo?.componentStack}</div>
            </div>
          </details>
        </div>
      </div>
    );
  }
}
