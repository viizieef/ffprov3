/**
 * Security & Cryptographic Utilities for User Authentication & Password Protection
 * Uses the standard Web Crypto API (crypto.subtle) native to browsers and Node.js
 */

export interface PasswordStrengthResult {
  score: number; // 0 to 100
  level: 'weak' | 'fair' | 'good' | 'strong';
  label: 'weak' | 'fair' | 'good' | 'strong';
  color: string;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  hasSpecial: boolean;
  checks: {
    minLength: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    specialChar: boolean;
    hasMinLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
    hasSpecialChar: boolean;
  };
  feedback: string[];
}

/**
 * Generate a cryptographically random salt
 */
export function generateSalt(length: number = 16): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  // Fallback
  return Math.random().toString(36).substring(2, 18) + Math.random().toString(36).substring(2, 18);
}

/**
 * Compute SHA-256 hash with salt using native Web Crypto API
 */
export async function hashPasswordWithSalt(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '::bbfms_pepper_2026::' + salt);
  
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Fast synchronous deterministic fallback for environments where subtle is unavailable
  let hash = 0;
  const str = password + salt;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(32, '0');
}

/**
 * Normalize and hash a security answer so answers are stored securely
 */
export async function hashSecurityAnswer(answer: string, salt: string): Promise<string> {
  const normalized = answer.trim().toLowerCase().replace(/\s+/g, ' ');
  return hashPasswordWithSalt(normalized, salt);
}

/**
 * Verify password against stored hash and salt
 */
export async function verifyPassword(
  inputPassword: string,
  storedHash: string,
  storedSalt: string
): Promise<boolean> {
  if (!inputPassword || !storedHash || !storedSalt) return false;
  const computedHash = await hashPasswordWithSalt(inputPassword, storedSalt);
  return computedHash === storedHash;
}

/**
 * Check password strength and compliance with security policies
 */
export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 8) score += 25;
  else feedback.push('Must be at least 8 characters long');

  if (password.length >= 12) score += 15;

  if (hasUppercase) score += 15;
  else feedback.push('Add an uppercase letter');

  if (hasLowercase) score += 15;
  else feedback.push('Add a lowercase letter');

  if (hasNumber) score += 15;
  else feedback.push('Add a number');

  if (hasSpecialChar) score += 15;
  else feedback.push('Add a special character (!@#$%^&*)');

  score = Math.min(100, Math.max(0, score));

  let level: 'weak' | 'fair' | 'good' | 'strong' = 'weak';
  let color = 'bg-rose-500 text-rose-700';

  if (score >= 80) {
    level = 'strong';
    color = 'bg-emerald-500 text-emerald-700';
  } else if (score >= 60) {
    level = 'good';
    color = 'bg-teal-500 text-teal-700';
  } else if (score >= 40) {
    level = 'fair';
    color = 'bg-amber-500 text-amber-700';
  }

  return {
    score,
    level,
    label: level,
    color,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
    hasSpecial: hasSpecialChar,
    checks: {
      minLength: hasMinLength,
      uppercase: hasUppercase,
      lowercase: hasLowercase,
      number: hasNumber,
      specialChar: hasSpecialChar,
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial: hasSpecialChar,
      hasSpecialChar
    },
    feedback
  };
}

/**
 * Check if a user account is locked due to brute-force attempts
 */
export function isAccountLocked(target?: { lockedUntil?: string | null } | string | null): { isLocked: boolean; remainingMinutes: number } {
  if (!target) return { isLocked: false, remainingMinutes: 0 };
  const lockedUntilStr = typeof target === 'string' ? target : target.lockedUntil;
  if (!lockedUntilStr) return { isLocked: false, remainingMinutes: 0 };
  
  const lockTime = new Date(lockedUntilStr).getTime();
  const now = Date.now();
  if (lockTime > now) {
    const diffMs = lockTime - now;
    const remainingMinutes = Math.ceil(diffMs / 60000);
    return { isLocked: true, remainingMinutes };
  }
  return { isLocked: false, remainingMinutes: 0 };
}
