/** Utility เงินแบบ minor units ป้องกัน floating-point ผิดพลาดระหว่าง DB และ Stripe */
const ZERO_DECIMAL = new Set([
  "BIF", "CLP", "DJF", "GNF", "ISK", "JPY", "KMF", "KRW", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF",
]);
const THREE_DECIMAL = new Set(["BHD", "IQD", "JOD", "KWD", "LYD", "OMR", "TND"]);

export function currencyExponent(currency) {
  const code = String(currency).toUpperCase();
  const configured = process.env.SHOP_CURRENCY_EXPONENT;
  if (configured !== undefined) {
    const exponent = Number(configured);
    if (!Number.isInteger(exponent) || exponent < 0 || exponent > 3) {
      throw new Error("SHOP_CURRENCY_EXPONENT must be an integer from 0 to 3");
    }
    return exponent;
  }
  if (ZERO_DECIMAL.has(code)) return 0;
  if (THREE_DECIMAL.has(code)) return 3;
  return 2;
}

export function shopCurrency() {
  const currency = (process.env.SHOP_CURRENCY ?? "THB").toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error("SHOP_CURRENCY must be a 3-letter ISO 4217 code");
  return { currency, exponent: currencyExponent(currency) };
}

export function decimalToMinor(value, exponent) {
  const text = String(value);
  const match = text.match(/^(\d+)(?:\.(\d+))?$/);
  if (!match) throw new Error(`Invalid monetary value: ${text}`);
  const fraction = match[2] ?? "";
  if (fraction.slice(exponent).replace(/0/g, "") !== "") {
    throw new Error(`Monetary value ${text} has more than ${exponent} decimal places`);
  }
  const padded = fraction.slice(0, exponent).padEnd(exponent, "0");
  return BigInt(match[1]) * 10n ** BigInt(exponent) + BigInt(padded || "0");
}

export function minorToNumber(value, exponent) {
  return Number(value) / 10 ** exponent;
}

export function serializeMinor(value) {
  const number = Number(value);
  if (!Number.isSafeInteger(number)) throw new Error("Payment amount exceeds JavaScript safe integer range");
  return number;
}
