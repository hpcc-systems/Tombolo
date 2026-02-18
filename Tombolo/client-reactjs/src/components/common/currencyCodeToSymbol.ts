export default function currencyCodeToSymbol(currencyCode: string | undefined): string | undefined {
  if (!currencyCode) throw new Error('Currency code is required');

  if (currencyCode === 'USD') {
    return '$';
  } else if (currencyCode === 'EUR') {
    return '€';
  } else if (currencyCode === 'GBP') {
    return '£';
  } else if (currencyCode === 'INR') {
    return '₹';
  }

  return undefined;
}
