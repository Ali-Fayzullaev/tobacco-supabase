'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle2, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 shadow-lg shadow-gold-500/25">
              <span className="text-xl font-bold text-white">T</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-[#F5F5F5]">Premium</span>
              <span className="text-2xl font-bold text-gold-500"> Tobacco</span>
            </div>
          </Link>
        </div>

        <Card className="bg-[#1E1E1E] border-[#2A2A2A] shadow-xl">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold-500/10 flex items-center justify-center">
              <Mail className="w-8 h-8 text-gold-500" />
            </div>

            <h2 className="text-xl font-bold text-[#F5F5F5] mb-2">Подтвердите email</h2>

            <p className="text-[#A0A0A0] mb-1">
              Мы отправили письмо с ссылкой для подтверждения
            </p>
            {email && (
              <p className="text-gold-500 font-medium mb-4">{email}</p>
            )}

            <div className="bg-[#121212] rounded-xl p-4 mb-6 text-left space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-gold-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-[#C0C0C0]">Откройте письмо от Premium Tobacco</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-gold-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-[#C0C0C0]">Нажмите на кнопку «Подтвердить email»</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-gold-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-[#C0C0C0]">Если не нашли — проверьте папку «Спам»</p>
              </div>
            </div>

            <Link href="/login">
              <Button className="bg-gold-500 hover:bg-gold-600 text-[#121212] font-semibold shadow-lg shadow-gold-500/25 h-11 px-8">
                Перейти ко входу
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
