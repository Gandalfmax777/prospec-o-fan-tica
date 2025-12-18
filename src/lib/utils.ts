import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Garante que a URL use HTTPS em produção
 * Em desenvolvimento, mantém HTTP para localhost
 */
export function ensureHttpsInProduction(url: string): string {
  // Se já estiver usando HTTPS, retorna como está
  if (url.startsWith("https://")) {
    return url;
  }

  // Se estiver em desenvolvimento (localhost), mantém HTTP
  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    return url;
  }

  // Em produção, força HTTPS
  if (url.startsWith("http://")) {
    return url.replace("http://", "https://");
  }

  return url;
}
