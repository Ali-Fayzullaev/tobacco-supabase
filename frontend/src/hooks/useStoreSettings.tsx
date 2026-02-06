'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase';

export interface StoreSettings {
  store_name: string;
  store_email: string;
  store_phone: string;
  store_address: string;
  store_description: string;
  delivery_cost: string;
  free_delivery_threshold: string;
  delivery_days: string;
  payment_cash: boolean;
  payment_card: boolean;
  payment_kaspi: boolean;
}

const defaultSettings: StoreSettings = {
  store_name: 'Shop Shop',
  store_email: 'info@tobacco.kz',
  store_phone: '+7 (777) 123-45-67',
  store_address: 'г. Алматы, ул. Абая 150, офис 312',
  store_description: '',
  delivery_cost: '1500',
  free_delivery_threshold: '15000',
  delivery_days: '2-5',
  payment_cash: true,
  payment_card: true,
  payment_kaspi: true,
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
          store_address: settingsMap.store_address || defaultSettings.store_address,
          store_description: settingsMap.store_description || defaultSettings.store_description,
          delivery_cost: settingsMap.delivery_cost || defaultSettings.delivery_cost,
          free_delivery_threshold: settingsMap.free_delivery_threshold || defaultSettings.free_delivery_threshold,
          delivery_days: settingsMap.delivery_days || defaultSettings.delivery_days,
          payment_cash: settingsMap.payment_cash !== 'false',
          payment_card: settingsMap.payment_card !== 'false',
          payment_kaspi: settingsMap.payment_kaspi !== 'false',
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
