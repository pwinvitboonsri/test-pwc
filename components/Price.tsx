interface PriceProps {
  value: number;
  currency?: string;
}

const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: string): Intl.NumberFormat {
  const cached = formatterCache.get(currency);
  if (cached) {
    return cached;
  }
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2
  });
  formatterCache.set(currency, formatter);
  return formatter;
}

export function Price({ value, currency = "USD" }: PriceProps) {
  const formatter = getFormatter(currency);
  return <span>{formatter.format(value)}</span>;
}
