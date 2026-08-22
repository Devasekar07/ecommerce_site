import { formatMoney } from "../../../lib/money";

type PriceDisplayProps = {
  pricePence: number;
  salePricePence?: number | null;
  currency: string;
};

export function PriceDisplay({ pricePence, salePricePence, currency }: PriceDisplayProps) {
  if (salePricePence && salePricePence < pricePence) {
    return (
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-semibold text-berry">{formatMoney(salePricePence, currency)}</span>
        <span className="text-sm text-ink/50 line-through">{formatMoney(pricePence, currency)}</span>
      </div>
    );
  }

  return <span className="font-semibold text-ink">{formatMoney(pricePence, currency)}</span>;
}
