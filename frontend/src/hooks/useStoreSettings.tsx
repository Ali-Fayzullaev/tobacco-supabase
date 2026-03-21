'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase';

export interface StoreSettings {
  store_name: string;
  store_email: string;
  store_phone: string;
  store_phone_suppliers: string;
  store_address: string;
  store_description: string;
  store_slogan: string;
  store_schedule: string;
  franchise_url: string;
  delivery_cost: string;
  free_delivery_threshold: string;
  delivery_days: string;
  payment_cash: boolean;
  payment_card: boolean;
  payment_kaspi: boolean;
  payment_invoice: boolean;
}

const defaultSettings: StoreSettings = {
  store_name: 'Premium Tobacco',
  store_email: 'premiumtobacco.info@gmail.com',
  store_phone: '+7 (700) 800-18-00',
  store_phone_suppliers: '+7 (705) 888-19-19',
  store_address: 'г. Астана',
  store_description: 'ТОО Premium Tobacco — ведущий импортер и дистрибьютор премиальной табачной продукции в Республике Казахстан.',
  store_slogan: 'Ведущий импортер и дистрибьютор премиальной табачной продукции в Республике Казахстан',
  store_schedule: 'Пн-Пт: 09:00 – 19:00',
  franchise_url: '',
  delivery_cost: '0',
  free_delivery_threshold: '200000',
  delivery_days: '1-7',
  payment_cash: false,
  payment_card: false,
  payment_kaspi: false,
  payment_invoice: true,
};

interface StoreSettingsContextType {
  settings: StoreSettings;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const StoreSettingsContext = createContext<StoreSettingsContextType>({
  settings: defaultSettings,
  isLoading: true,
  refetch: async () => {},
});

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase
        .from('store_settings')
        .select('key, value');

      if (error) {
        console.error('Error fetching store settings:', error);
        return;
      }

      if (data && data.length > 0) {
        const settingsMap: Record<string, string> = {};
        data.forEach(item => {
          settingsMap[item.key] = item.value || '';
        });

        setSettings({
          store_name: settingsMap.store_name || defaultSettings.store_name,
          store_email: settingsMap.store_email || defaultSettings.store_email,
          store_phone: settingsMap.store_phone || defaultSettings.store_phone,
          store_phone_suppliers: settingsMap.store_phone_suppliers || defaultSettings.store_phone_suppliers,
          store_address: settingsMap.store_address || defaultSettings.store_address,
          store_description: settingsMap.store_description || defaultSettings.store_description,
          store_slogan: settingsMap.store_slogan || defaultSettings.store_slogan,
          store_schedule: settingsMap.store_schedule || defaultSettings.store_schedule,
          franchise_url: settingsMap.franchise_url || defaultSettings.franchise_url,
          delivery_cost: settingsMap.delivery_cost || defaultSettings.delivery_cost,
          free_delivery_threshold: settingsMap.free_delivery_threshold || defaultSettings.free_delivery_threshold,
          delivery_days: settingsMap.delivery_days || defaultSettings.delivery_days,
          payment_cash: settingsMap.payment_cash !== 'false',
          payment_card: settingsMap.payment_card !== 'false',
          payment_kaspi: settingsMap.payment_kaspi !== 'false',
          payment_invoice: settingsMap.payment_invoice === 'true',
        });
      }
    } catch (err) {
      console.error('Error fetching store settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <StoreSettingsContext.Provider value={{ settings, isLoading, refetch: fetchSettings }}>
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  return useContext(StoreSettingsContext);
}
