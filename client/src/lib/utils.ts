import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// crypto.randomUUID() requires a secure context (HTTPS or localhost) and is
// undefined otherwise, e.g. testing over plain HTTP on a local network IP.
export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Date.now() prefix guards against Math.random() producing a very short
  // (or, for 0, empty) string; these ids are used as React keys.
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
}
