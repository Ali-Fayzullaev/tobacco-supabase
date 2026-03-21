'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Settings,
  Store,
  CreditCard,
  Truck,
  Mail,
  Phone,
  MapPin,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Banknote,
  Wallet,
  Building2,
  FileText,
  Users,
  Link as LinkIcon,
  CalendarDays,
  Receipt,
  Quote
} from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { CenteredPageSkeleton } from '@/components/Skeleton';
import { cn } from '@/lib/utils';

interface SettingsSection {
  id: string;
  label: string;
  icon: React.ElementType;
}

const sections: SettingsSection[] = [
  { id: 'store', label: 'Магазин', icon: Store },
  { id: 'delivery', label: 'Доставка', icon: Truck },
  { id: 'payment', label: 'Оплата', icon: CreditCard },
];

export default function AdminSettingsPage() {
  const [activeSection, setActiveSection] = useState('store');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Store settings
  const [storeName, setStoreName] = useState('');
  const [storeEmail, setStoreEmail] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storePhoneSuppliers, setStorePhoneSuppliers] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [storeSlogan, setStoreSlogan] = useState('');
  const [storeSchedule, setStoreSchedule] = useState('');
  const [franchiseUrl, setFranchiseUrl] = useState('');
  
  // Delivery settings
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState('');
  const [deliveryCost, setDeliveryCost] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('');
  
  // Payment settings
  const [cashEnabled, setCashEnabled] = useState(false);
  const [cardEnabled, setCardEnabled] = useState(false);
  const [kaspiEnabled, setKaspiEnabled] = useState(false);
  const [invoiceEnabled, setInvoiceEnabled] = useState(true);

  // Track initial state to detect changes
  const initialState = useRef<string>('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase
        .from('store_settings')
        .select('key, value');

      if (error) throw error;

      const settings: Record<string, string> = {};
      data?.forEach(item => {
        settings[item.key] = item.value || '';
      });

      setStoreName(settings.store_name || 'Premium Tobacco');
      setStoreEmail(settings.store_email || '');
      setStorePhone(settings.store_phone || '');
      setStorePhoneSuppliers(settings.store_phone_suppliers || '');
      setStoreAddress(settings.store_address || '');
      setStoreDescription(settings.store_description || '');
      setStoreSlogan(settings.store_slogan || '');
      setStoreSchedule(settings.store_schedule || '');
      setFranchiseUrl(settings.franchise_url || '');
      setDeliveryCost(settings.delivery_cost || '0');
      setFreeDeliveryThreshold(settings.free_delivery_threshold || '200000');
      setDeliveryDays(settings.delivery_days || '1-7');
      setCashEnabled(settings.payment_cash === 'true');
      setCardEnabled(settings.payment_card === 'true');
      setKaspiEnabled(settings.payment_kaspi === 'true');
      setInvoiceEnabled(settings.payment_invoice !== 'false');
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Не удалось загрузить настройки');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentState = () => JSON.stringify({
    storeName, storeEmail, storePhone, storePhoneSuppliers, storeAddress,
    storeDescription, storeSlogan, storeSchedule, franchiseUrl,
    deliveryCost, freeDeliveryThreshold, deliveryDays,
    cashEnabled, cardEnabled, kaspiEnabled, invoiceEnabled,
  });

  // Save initial snapshot after loading
  useEffect(() => {
    if (!isLoading && !initialState.current) {
      initialState.current = getCurrentState();
    }
  });

  const hasChanges = initialState.current ? getCurrentState() !== initialState.current : false;

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);
    
    try {
      const supabase = createBrowserSupabaseClient();
      
      const settingsToSave = [
        { key: 'store_name', value: storeName },
        { key: 'store_email', value: storeEmail },
        { key: 'store_phone', value: storePhone },
        { key: 'store_phone_suppliers', value: storePhoneSuppliers },
        { key: 'store_address', value: storeAddress },
        { key: 'store_description', value: storeDescription },
        { key: 'store_slogan', value: storeSlogan },
        { key: 'store_schedule', value: storeSchedule },
        { key: 'franchise_url', value: franchiseUrl },
        { key: 'delivery_cost', value: deliveryCost },
        { key: 'free_delivery_threshold', value: freeDeliveryThreshold },
        { key: 'delivery_days', value: deliveryDays },
        { key: 'payment_cash', value: cashEnabled.toString() },
        { key: 'payment_card', value: cardEnabled.toString() },
        { key: 'payment_kaspi', value: kaspiEnabled.toString() },
        { key: 'payment_invoice', value: invoiceEnabled.toString() },
      ];

      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from('store_settings')
          .upsert(setting, { onConflict: 'key' });
        
        if (error) throw error;
      }
      
      setSaveSuccess(true);
      initialState.current = getCurrentState();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Не удалось сохранить настройки');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <CenteredPageSkeleton
        icon={<Settings className="w-6 h-6 text-white" />}
        title="Загрузка настроек..."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] flex items-center gap-3">
            <Settings className="w-8 h-8 text-gold-500" />
            Настройки
          </h1>
          <p className="text-[#A0A0A0] mt-1">Управление настройками магазина</p>
        </div>
        {(hasChanges || isSaving || saveSuccess) && (
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold shadow-lg transition-all",
            saveSuccess
              ? "bg-green-500 text-white shadow-green-500/30"
              : "bg-gradient-to-r from-gold-500 to-gold-500/50 text-white shadow-gold-500/30 hover:shadow-xl"
          )}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Сохранение...
            </>
          ) : saveSuccess ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Сохранено!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Сохранить
            </>
          )}
        </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-800/30 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-[#1E1E1E] rounded-2xl shadow-sm border border-[#2A2A2A] p-4">
            <nav className="space-y-1">
              {sections.map((section) => {
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                      isActive
                        ? "bg-gradient-to-r from-gold-500 to-gold-500/50 text-white shadow-lg shadow-gold-500/30"
                        : "text-[#A0A0A0] hover:bg-[#121212]"
                    )}
                  >
                    <section.icon className="w-5 h-5" />
                    <span className="font-medium">{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-[#1E1E1E] rounded-2xl shadow-sm border border-[#2A2A2A] p-6">
            {/* Store Settings */}
            {activeSection === 'store' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-[#2A2A2A]">
                  <div className="w-10 h-10 bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <Store className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#F5F5F5]">Информация о магазине</h2>
                    <p className="text-sm text-[#A0A0A0]">Основные данные магазина</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#C0C0C0] mb-2">
                      Название магазина
                    </label>
                    <div className="relative">
                      <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666]" />
                      <input
                        type="text"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-[#121212] text-[#F5F5F5] placeholder:text-[#666] border border-[#2A2A2A] rounded-xl focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#C0C0C0] mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666]" />
                      <input
                        type="email"
                        value={storeEmail}
                        onChange={(e) => setStoreEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-[#121212] text-[#F5F5F5] placeholder:text-[#666] border border-[#2A2A2A] rounded-xl focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#C0C0C0] mb-2">
                      Телефон (клиенты)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666]" />
                      <input
                        type="tel"
                        value={storePhone}
                        onChange={(e) => setStorePhone(e.target.value)}
                        placeholder="+7 (700) 800-18-00"
                        className="w-full pl-12 pr-4 py-3 bg-[#121212] text-[#F5F5F5] placeholder:text-[#666] border border-[#2A2A2A] rounded-xl focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#C0C0C0] mb-2">
                      Телефон (поставщики)
                    </label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666]" />
                      <input
                        type="tel"
                        value={storePhoneSuppliers}
                        onChange={(e) => setStorePhoneSuppliers(e.target.value)}
                        placeholder="+7 (705) 888-19-19"
                        className="w-full pl-12 pr-4 py-3 bg-[#121212] text-[#F5F5F5] placeholder:text-[#666] border border-[#2A2A2A] rounded-xl focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#C0C0C0] mb-2">
                      Адрес
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666]" />
                      <input
                        type="text"
                        value={storeAddress}
                        onChange={(e) => setStoreAddress(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-[#121212] text-[#F5F5F5] placeholder:text-[#666] border border-[#2A2A2A] rounded-xl focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#C0C0C0] mb-2">
                    Описание магазина
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-4 w-5 h-5 text-[#666]" />
                    <textarea
                      value={storeDescription}
                      onChange={(e) => setStoreDescription(e.target.value)}
                      rows={4}
                      className="w-full pl-12 pr-4 py-3 bg-[#121212] text-[#F5F5F5] placeholder:text-[#666] border border-[#2A2A2A] rounded-xl focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 resize-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#C0C0C0] mb-2">
                    Слоган
                  </label>
                  <div className="relative">
                    <Quote className="absolute left-4 top-4 w-5 h-5 text-[#666]" />
                    <textarea
                      value={storeSlogan}
                      onChange={(e) => setStoreSlogan(e.target.value)}
                      rows={3}
                      placeholder="Ведущий импортер и дистрибьютор..."
                      className="w-full pl-12 pr-4 py-3 bg-[#121212] text-[#F5F5F5] placeholder:text-[#666] border border-[#2A2A2A] rounded-xl focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 resize-none"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#C0C0C0] mb-2">
                      График работы
                    </label>
                    <div className="relative">
                      <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666]" />
                      <input
                        type="text"
                        value={storeSchedule}
                        onChange={(e) => setStoreSchedule(e.target.value)}
                        placeholder="Пн-Пт: 09:00 – 19:00"
                        className="w-full pl-12 pr-4 py-3 bg-[#121212] text-[#F5F5F5] placeholder:text-[#666] border border-[#2A2A2A] rounded-xl focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#C0C0C0] mb-2">
                      Ссылка на франшизу
                    </label>
                    <div className="relative">
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666]" />
                      <input
                        type="url"
                        value={franchiseUrl}
                        onChange={(e) => setFranchiseUrl(e.target.value)}
                        placeholder="https://tobaccoclub.kz"
                        className="w-full pl-12 pr-4 py-3 bg-[#121212] text-[#F5F5F5] placeholder:text-[#666] border border-[#2A2A2A] rounded-xl focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Settings */}
            {activeSection === 'delivery' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-[#2A2A2A]">
                  <div className="w-10 h-10 bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Truck className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#F5F5F5]">Настройки доставки</h2>
                    <p className="text-sm text-[#A0A0A0]">Стоимость и условия доставки</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#C0C0C0] mb-2">
                      Стоимость доставки (тг)
                    </label>
                    <div className="relative">
                      <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666]" />
                      <input
                        type="number"
                        value={deliveryCost}
                        onChange={(e) => setDeliveryCost(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-[#121212] text-[#F5F5F5] placeholder:text-[#666] border border-[#2A2A2A] rounded-xl focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#C0C0C0] mb-2">
                      Бесплатная доставка от (тг)
                    </label>
                    <div className="relative">
                      <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666]" />
                      <input
                        type="number"
                        value={freeDeliveryThreshold}
                        onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-[#121212] text-[#F5F5F5] placeholder:text-[#666] border border-[#2A2A2A] rounded-xl focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#C0C0C0] mb-2">
                      Срок доставки (дней)
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666]" />
                      <input
                        type="text"
                        value={deliveryDays}
                        onChange={(e) => setDeliveryDays(e.target.value)}
                        placeholder="2-5"
                        className="w-full pl-12 pr-4 py-3 bg-[#121212] text-[#F5F5F5] placeholder:text-[#666] border border-[#2A2A2A] rounded-xl focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-900/20 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">Информация о доставке</p>
                      <p className="text-sm text-blue-400 mt-1">
                        При заказе от {freeDeliveryThreshold} тг доставка бесплатная. 
                        Стандартная доставка занимает {deliveryDays} рабочих дней.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Settings */}
            {activeSection === 'payment' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-[#2A2A2A]">
                  <div className="w-10 h-10 bg-green-900/30 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#F5F5F5]">Способы оплаты</h2>
                    <p className="text-sm text-[#A0A0A0]">Включите или отключите способы оплаты</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 bg-[#121212] rounded-xl cursor-pointer hover:bg-[#252525] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gold-500/20 rounded-lg flex items-center justify-center">
                        <Receipt className="w-6 h-6 text-gold-500" />
                      </div>
                      <div>
                        <p className="font-medium text-[#F5F5F5]">Счёт на оплату</p>
                        <p className="text-sm text-[#A0A0A0]">Безналичный расчёт для юр. лиц</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={invoiceEnabled}
                      onChange={(e) => setInvoiceEnabled(e.target.checked)}
                      className="w-5 h-5 text-gold-500 rounded focus:ring-gold-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-[#121212] rounded-xl cursor-pointer hover:bg-[#252525] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-900/30 rounded-lg flex items-center justify-center">
                        <Banknote className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-[#F5F5F5]">Наличные при получении</p>
                        <p className="text-sm text-[#A0A0A0]">Оплата курьеру при доставке</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={cashEnabled}
                      onChange={(e) => setCashEnabled(e.target.checked)}
                      className="w-5 h-5 text-gold-500 rounded focus:ring-gold-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-[#121212] rounded-xl cursor-pointer hover:bg-[#252525] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-[#F5F5F5]">Банковская карта</p>
                        <p className="text-sm text-[#A0A0A0]">Visa, MasterCard</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={cardEnabled}
                      onChange={(e) => setCardEnabled(e.target.checked)}
                      className="w-5 h-5 text-gold-500 rounded focus:ring-gold-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-[#121212] rounded-xl cursor-pointer hover:bg-[#252525] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-900/30 rounded-lg flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-red-400" />
                      </div>
                      <div>
                        <p className="font-medium text-[#F5F5F5]">Kaspi QR / Перевод</p>
                        <p className="text-sm text-[#A0A0A0]">Оплата через Kaspi Bank</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={kaspiEnabled}
                      onChange={(e) => setKaspiEnabled(e.target.checked)}
                      className="w-5 h-5 text-gold-500 rounded focus:ring-gold-500"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
