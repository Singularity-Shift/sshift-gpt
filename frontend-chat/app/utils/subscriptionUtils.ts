export function calculatePrice(days: number) {
    const minPrice = 2; // Price for 1 day
    const maxPrice = 22; // Price for 30 days
    const maxDays = 30;
  
    if (days === 1) return minPrice;
    if (days === maxDays) return maxPrice;
  
    // Calculate the exponent that satisfies our constraints
    const exponent = Math.log(maxPrice / minPrice) / Math.log(maxDays);
  
    // Calculate the price using the power function
    const price = minPrice * Math.pow(days, exponent);
  
    return parseFloat(price.toFixed(2));
  }
  
  function formatUTCDate(date: Date): string {
    return date.toUTCString().replace('GMT', 'UTC');
  }
  
  export function calculateDates(days: number): {
    startDate: string;
    expirationDate: string;
  } {
    const startDate = new Date();
    const expirationDate = new Date(
      startDate.getTime() + days * 24 * 60 * 60 * 1000
    );
  
    return {
      startDate: formatUTCDate(startDate),
      expirationDate: formatUTCDate(expirationDate),
    };
  }
  
  export function calculateDiscount(owned: number, supply: number): number {
    return Math.min((owned / supply) * 100 * 100, 30);
  }