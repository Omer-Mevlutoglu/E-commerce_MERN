/**
 * Client-side card helpers.
 *
 * The card number never leaves the browser. Only the last four digits and the
 * detected brand — both safe to store and display — are sent to the API. This
 * mirrors how a real integration works: a provider's SDK (Stripe Elements and
 * friends) tokenises the card in the browser and hands the server a token plus
 * these same display-only fields.
 */

export type CardBrand =
  | "visa"
  | "mastercard"
  | "amex"
  | "discover"
  | "unknown";

/** Strips spaces and dashes so grouped input like "4242 4242" still parses. */
export const normalizeCardNumber = (value: string): string =>
  value.replace(/[\s-]/g, "");

export const detectCardBrand = (cardNumber: string): CardBrand => {
  const n = normalizeCardNumber(cardNumber);

  if (/^4/.test(n)) return "visa";
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  if (/^(6011|65|64[4-9])/.test(n)) return "discover";

  return "unknown";
};

export const getLast4 = (cardNumber: string): string =>
  normalizeCardNumber(cardNumber).slice(-4);

/** Luhn checksum — catches typos before the request is sent. */
export const isValidCardNumber = (cardNumber: string): boolean => {
  const n = normalizeCardNumber(cardNumber);
  if (!/^\d{13,19}$/.test(n)) return false;

  let sum = 0;
  let double = false;

  for (let i = n.length - 1; i >= 0; i--) {
    let digit = Number(n[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }

  return sum % 10 === 0;
};

/** Accepts MM/YY or MM/YYYY and rejects anything already in the past. */
export const isValidExpiry = (exp: string): boolean => {
  const match = exp.trim().match(/^(0[1-9]|1[0-2])\s*\/\s*(\d{2}|\d{4})$/);
  if (!match) return false;

  const month = Number(match[1]);
  const year =
    match[2].length === 2 ? 2000 + Number(match[2]) : Number(match[2]);

  const now = new Date();
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  return endOfMonth >= now;
};

export const isValidCvc = (cvc: string, brand: CardBrand): boolean =>
  brand === "amex" ? /^\d{4}$/.test(cvc) : /^\d{3}$/.test(cvc);
