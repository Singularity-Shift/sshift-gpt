'use client';

import * as React from 'react';
import { Button } from '../../src/components/ui/button';
import { Slider } from '../../src/components/ui/slider';

interface SubscriptionPageProps {}

function calculatePrice(days: number) {
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

function calculateDates(days: number): { startDate: string; expirationDate: string } {
  const startDate = new Date();
  const expirationDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
  
  return {
    startDate: formatUTCDate(startDate),
    expirationDate: formatUTCDate(expirationDate)
  };
}

export default function SubscriptionPage({}: SubscriptionPageProps) {
  const [days, setDays] = React.useState(15);
  const [price, setPrice] = React.useState(0);
  const [dates, setDates] = React.useState({ startDate: '', expirationDate: '' });

  React.useEffect(() => {
    setPrice(calculatePrice(days));
    setDates(calculateDates(days));
  }, [days]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">SShift GPT Subscription</h2>
          <p className="mt-2 text-sm text-gray-600">Choose your subscription length</p>
        </div>
        <div className="mt-8 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">1 day</span>
              <span className="text-sm font-medium text-gray-700">30 days</span>
            </div>
            <Slider
              min={1}
              max={30}
              step={1}
              value={[days]}
              onValueChange={(value) => setDays(value[0])}
              className="w-full"
            />
            <div className="text-center space-y-2">
              <span className="text-lg font-semibold text-gray-900">{days} day{days !== 1 ? 's' : ''}</span>
              <p className="text-sm text-gray-600">Starts: {dates.startDate}</p>
              <p className="text-sm text-gray-600">Expires: {dates.expirationDate}</p>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:p-6 rounded-md">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Price</p>
              <p className="mt-1 text-4xl font-extrabold text-gray-900">${price}</p>
            </div>
          </div>
          <Button className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Subscribe
          </Button>
        </div>
      </div>
      <Button variant="outline" className="mt-6 py-3 px-6 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        Enter SShift GPT
      </Button>
    </div>
  );
}