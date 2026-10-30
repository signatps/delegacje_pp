import Decimal from "decimal.js";

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export type MoneyString = string;

export function money(value: string | number | Decimal): Decimal {
  return new Decimal(value);
}

export function moneyFixed(value: string | number | Decimal, digits = 2): MoneyString {
  return money(value).toFixed(digits);
}

export function moneyAdd(...values: Array<string | number | Decimal>): Decimal {
  return values.reduce<Decimal>((acc, v) => acc.plus(money(v)), money(0));
}

export function moneyMul(a: string | number | Decimal, b: string | number | Decimal): Decimal {
  return money(a).times(money(b));
}

export function moneyDiv(a: string | number | Decimal, b: string | number | Decimal): Decimal {
  return money(a).div(money(b));
}

export function moneyMax(a: string | number | Decimal, b: string | number | Decimal): Decimal {
  const left = money(a);
  const right = money(b);
  return left.gte(right) ? left : right;
}

export function moneyMin(a: string | number | Decimal, b: string | number | Decimal): Decimal {
  const left = money(a);
  const right = money(b);
  return left.lte(right) ? left : right;
}

export function formatPln(value: string | number | Decimal): string {
  return `${moneyFixed(value, 2).replace(".", ",")} zł`;
}

export function formatMoney(value: string | number | Decimal, currency: string): string {
  return `${moneyFixed(value, 2).replace(".", ",")} ${currency}`;
}
