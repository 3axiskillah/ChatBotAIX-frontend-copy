// Frontend Security Utilities

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHTML(html: string): string {
  const div = document.createElement("div");
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Validate and sanitize user input
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (typeof input !== "string") {
    throw new Error("Input must be a string");
  }

  // Remove null bytes and control characters
  let sanitized = input.replace(/[\x00-\x1F\x7F]/g, "");

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Remove dangerous patterns
  const dangerousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /<form[^>]*>/gi,
    /<input[^>]*>/gi,
    /<textarea[^>]*>/gi,
    /<select[^>]*>/gi,
    /<button[^>]*>/gi,
  ];

  dangerousPatterns.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, "");
  });

  return sanitized.trim();
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate chat message
 */
export function validateChatMessage(message: string): {
  isValid: boolean;
  error?: string;
  sanitized?: string;
} {
  if (!message || typeof message !== "string") {
    return { isValid: false, error: "Message must be a non-empty string" };
  }

  if (message.trim().length === 0) {
    return { isValid: false, error: "Message cannot be empty" };
  }

  if (message.length > 1000) {
    return { isValid: false, error: "Message too long (max 1000 characters)" };
  }

  const sanitized = sanitizeInput(message, 1000);

  return { isValid: true, sanitized };
}

/**
 * Validate URL
 */
export function validateURL(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const dangerousProtocols = ["javascript:", "vbscript:", "data:", "file:"];
    return !dangerousProtocols.some(
      (protocol) => urlObj.protocol.toLowerCase() === protocol
    );
  } catch {
    return false;
  }
}

/**
 * Sanitize form data
 */
export function sanitizeFormData<T extends Record<string, any>>(data: T): T {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeFormData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Prevent XSS in dynamic content
 */
export function safeSetInnerHTML(element: HTMLElement, content: string): void {
  element.textContent = content; // Use textContent instead of innerHTML
}

/**
 * Validate and sanitize API response data
 */
export function sanitizeAPIResponse<T>(data: T): T {
  if (typeof data === "string") {
    return sanitizeInput(data) as T;
  }

  if (typeof data === "object" && data !== null) {
    if (Array.isArray(data)) {
      return data.map((item) => sanitizeAPIResponse(item)) as T;
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeAPIResponse(value);
    }
    return sanitized as T;
  }

  return data;
}

/**
 * Rate limiting for frontend actions
 */
class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> =
    new Map();

  canAttempt(
    action: string,
    maxAttempts: number = 5,
    windowMs: number = 60000
  ): boolean {
    const now = Date.now();
    const key = `${action}_${Math.floor(now / windowMs)}`;

    const current = this.attempts.get(key);

    if (!current || now > current.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (current.count >= maxAttempts) {
      return false;
    }

    current.count++;
    return true;
  }

  reset(action: string): void {
    const now = Date.now();
    const key = `${action}_${Math.floor(now / 60000)}`;
    this.attempts.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Secure localStorage wrapper
 */
export class SecureStorage {
  private static readonly PREFIX = "secure_";

  static setItem(key: string, value: string): void {
    try {
      const sanitizedKey = sanitizeInput(key, 50);
      const sanitizedValue = sanitizeInput(value, 10000);
      localStorage.setItem(this.PREFIX + sanitizedKey, sanitizedValue);
    } catch (error) {
      console.error("Failed to set secure storage item:", error);
    }
  }

  static getItem(key: string): string | null {
    try {
      const sanitizedKey = sanitizeInput(key, 50);
      return localStorage.getItem(this.PREFIX + sanitizedKey);
    } catch (error) {
      console.error("Failed to get secure storage item:", error);
      return null;
    }
  }

  static removeItem(key: string): void {
    try {
      const sanitizedKey = sanitizeInput(key, 50);
      localStorage.removeItem(this.PREFIX + sanitizedKey);
    } catch (error) {
      console.error("Failed to remove secure storage item:", error);
    }
  }
}

/**
 * CSRF token management
 */
export class CSRFProtection {
  private static token: string | null = null;

  static setToken(token: string): void {
    this.token = sanitizeInput(token, 100);
  }

  static getToken(): string | null {
    return this.token;
  }

  static addToHeaders(headers: Headers): void {
    if (this.token) {
      headers.append("X-CSRFToken", this.token);
    }
  }
}
