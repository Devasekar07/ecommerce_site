export function formatMoney(amountPence: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2
  }).format(amountPence / 100);
}
