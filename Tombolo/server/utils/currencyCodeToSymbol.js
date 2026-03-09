function currencyCodeToSymbol(currencyCode) {
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
}

export default currencyCodeToSymbol;
