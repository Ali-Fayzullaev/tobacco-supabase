export type SecurityEventClientPayload = {
  eventType: 'login_attempt' | 'login_failed' | 'login_success' | 'register_attempt' | 'register_failed' | 'register_success' | 'bot_honeypot_triggered';
  outcome?: 'success' | 'failed' | 'blocked';
  email?: string;
  reason?: string;
  path?: string;
  honeypotFilled?: boolean;
  meta?: Record<string, unknown>;
};

export async function logSecurityEvent(payload: SecurityEventClientPayload): Promise<void> {
  try {
    await fetch('/api/security-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Silent fail: security logging should not break auth UX.
  }
}
