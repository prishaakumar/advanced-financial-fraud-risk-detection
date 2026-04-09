import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as INR currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats a date string or timestamp
 */
export function formatDate(date: string | number | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Returns a CSS color class based on risk level
 */
export function getRiskColor(level: string): string {
  switch (level?.toUpperCase()) {
    case 'HIGH':
    case 'FRAUD':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'MEDIUM':
    case 'RISKY':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'LOW':
    case 'SAFE':
      return 'text-green-600 bg-green-50 border-green-200';
    default:
      return 'text-slate-600 bg-slate-50 border-slate-200';
  }
}
