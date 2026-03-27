import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Форматирование цены в тенге
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-KZ', {
    style: 'currency',
    currency: 'KZT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// Форматирование даты
export function formatDate(date: string | Date, locale: 'ru' | 'kk' = 'ru'): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'kk-KZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

// Форматирование даты и времени
export function formatDateTime(date: string | Date, locale: 'ru' | 'kk' = 'ru'): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'kk-KZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

// Проверка возраста (21+)
export function isAdult(birthDate: string | Date): boolean {
  const birth = new Date(birthDate);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1 >= 21;
  }
  
  return age >= 21;
}

// Максимальная дата рождения (для формы регистрации - 21 год назад)
export function getMaxBirthDate(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 21);
  return date.toISOString().split('T')[0];
}

// Склонение слов
export function pluralize(
  count: number,
  one: string,
  few: string,
  many: string
): string {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod100 >= 11 && mod100 <= 19) {
    return many;
  }

  if (mod10 === 1) {
    return one;
  }

  if (mod10 >= 2 && mod10 <= 4) {
    return few;
  }

  return many;
}

// Формат для товаров: "5 товаров", "1 товар", "2 товара"
export function formatProductCount(count: number): string {
  return `${count} ${pluralize(count, 'товар', 'товара', 'товаров')}`;
}

// Генерация slug из текста (поддержка русского и казахского)
export function generateSlug(text: string): string {
  // Карта транслитерации для русского и казахского
  const translitMap: Record<string, string> = {
    // Русские буквы
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
    'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    // Казахские буквы
    'ә': 'a', 'ғ': 'g', 'қ': 'k', 'ң': 'n', 'ө': 'o', 'ұ': 'u', 'ү': 'u', 
    'і': 'i', 'һ': 'h'
  };

  return text
    .toLowerCase()
    .split('')
    .map(char => translitMap[char] !== undefined ? translitMap[char] : char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Сокращение текста
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}

// Валидация email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Валидация телефона Казахстана
export function isValidKZPhone(phone: string): boolean {
  const phoneRegex = /^\+7[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Форматирование телефона
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('7')) {
    return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9)}`;
  }
  return phone;
}

// Статусы заказа на русском
export const orderStatusLabels: Record<string, { ru: string; kk: string }> = {
  new: { ru: 'Новый', kk: 'Жаңа' },
  confirmed: { ru: 'Подтверждён', kk: 'Расталған' },
  processing: { ru: 'В обработке', kk: 'Өңделуде' },
  shipping: { ru: 'В доставке', kk: 'Жеткізуде' },
  delivered: { ru: 'Доставлен', kk: 'Жеткізілді' },
  cancelled: { ru: 'Отменён', kk: 'Бас тартылған' },
};

// Способы оплаты
export const paymentMethodLabels: Record<string, { ru: string; kk: string }> = {
  cash: { ru: 'Наличными', kk: 'Қолма-қол' },
  card: { ru: 'Картой онлайн', kk: 'Картамен онлайн' },
  kaspi: { ru: 'Kaspi перевод', kk: 'Kaspi аударым' },
};

// Способы доставки
export const deliveryMethodLabels: Record<string, { ru: string; kk: string }> = {
  courier: { ru: 'Курьерская доставка', kk: 'Курьерлік жеткізу' },
  pickup: { ru: 'Самовывоз', kk: 'Өзі алып кету' },
};

// Статусы оплаты
export const paymentStatusLabels: Record<string, { ru: string; kk: string }> = {
  pending: { ru: 'Ожидает оплаты', kk: 'Төлем күтілуде' },
  paid: { ru: 'Оплачен', kk: 'Төленді' },
  failed: { ru: 'Ошибка оплаты', kk: 'Төлем қатесі' },
  refunded: { ru: 'Возврат', kk: 'Қайтару' },
};

// Получить метку статуса заказа
export function getStatusLabel(status: string, locale: 'ru' | 'kk' = 'ru'): string {
  return orderStatusLabels[status]?.[locale] || status;
}

// Получить цвет статуса заказа
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    new: 'bg-blue-900/30 text-blue-400',
    confirmed: 'bg-green-900/30 text-green-400',
    processing: 'bg-yellow-900/30 text-yellow-400',
    shipping: 'bg-purple-900/30 text-purple-400',
    delivered: 'bg-green-900/30 text-green-400',
    cancelled: 'bg-red-900/30 text-red-400',
  };
  return colors[status] || 'bg-[#252525] text-[#C0C0C0]';
}

/**
 * Повтор запроса при ошибке (обновление токена, сеть)
 */
export async function withRetry<T>(fn: () => PromiseLike<T>, retries = 2, delay = 500): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === retries) throw e;
      await new Promise(r => setTimeout(r, delay * (i + 1)));
    }
  }
  throw new Error('withRetry: unreachable');
}
