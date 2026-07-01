import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { AppointmentStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(iso: string): string {
  return format(parseISO(iso), 'dd MMM yyyy, HH:mm', { locale: ru });
}

export function formatDate(iso: string): string {
  return format(parseISO(iso), 'dd MMMM yyyy', { locale: ru });
}

export function formatTime(iso: string): string {
  return format(parseISO(iso), 'HH:mm');
}

export function formatPrice(price: string | number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'KZT',
    minimumFractionDigits: 0,
  }).format(Number(price));
}

export function formatPhoneNumber(val: string): string {
  if (!val) return '';
  const digits = val.replace(/\D/g, '');
  if (!digits) return '';
  
  // If the user starts typing with 7 or 8, we strip it out for the formatter, 
  // because +7 is the constant prefix.
  const isRussianKazakhStart = digits[0] === '7' || digits[0] === '8';
  let number = isRussianKazakhStart ? digits.slice(1) : digits;
  
  let res = '+7';
  if (number.length > 0) res += '-' + number.substring(0, 3);
  if (number.length > 3) res += '-' + number.substring(3, 6);
  if (number.length > 6) res += '-' + number.substring(6, 8);
  if (number.length > 8) res += '-' + number.substring(8, 10);
  
  return res;
}


export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтверждена',
  CANCELLED: 'Отменена',
  COMPLETED: 'Завершена',
  NO_SHOW: 'Не пришли',
};

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  CONFIRMED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  COMPLETED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  NO_SHOW: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
export const DAY_NAMES_FULL = [
  'Воскресенье', 'Понедельник', 'Вторник', 'Среда',
  'Четверг', 'Пятница', 'Суббота',
];
