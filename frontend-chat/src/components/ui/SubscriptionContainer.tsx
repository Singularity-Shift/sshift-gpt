import React, { useState, useEffect } from 'react';
import { Slider } from './slider';
import { useAppManagment } from '@fn-chat/context/AppManagment';
import { calculatePrice, calculateDates, calculateMaxDiscount } from '../../lib/utils';

export const SubscriptionContainer = () => {
  const [days, setDays] = useState(15);
  const [price, setPrice] = useState(0);
  const [dates, setDates] = useState({ startDate: '', expirationDate: '' });
  const { moveBotsOwned, qribbleNFTsOwned, sshiftRecordsOwned, isSubscriptionActive } = useAppManagment();

  useEffect(() => {
    const priceWithoutDiscount = calculatePrice(days);
    const maxDiscount = calculateMaxDiscount(
      moveBotsOwned,
      qribbleNFTsOwned,
      sshiftRecordsOwned,
      days
    );

    const finalPrice = priceWithoutDiscount * (1 - maxDiscount / 100);
    setPrice(parseFloat(finalPrice.toFixed(2)));
    setDates(calculateDates(days));
  }, [days, moveBotsOwned, qribbleNFTsOwned, sshiftRecordsOwned]);

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-bold mb-2">SShift GPT Subscription</h2>
      <p className="text-sm text-gray-600 mb-6">Choose your subscription length</p>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>1 day</span>
            <span>30 days</span>
          </div>
          <Slider
            min={1}
            max={30}
            step={1}
            value={[days]}
            onValueChange={(value) => setDays(value[0])}
            className="w-full"
          />
          <div className="mt-4 text-center">
            <div className="text-lg font-semibold">{days} days</div>
            <div className="text-sm text-gray-600">
              Starts: {dates.startDate}
            </div>
            <div className="text-sm text-gray-600">
              Expires: {dates.expirationDate}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-center">
            <div className="text-sm text-gray-600">Total Price</div>
            <div className="text-3xl font-bold mt-1">{price} USDT</div>
            <div className="text-sm text-green-600">Discount Applied: 3.33%</div>
          </div>
        </div>

        <button
          className="w-full py-2 px-4 bg-indigo-100 text-indigo-700 rounded-lg"
          disabled
        >
          Currently with subscription active
        </button>
      </div>
    </div>
  );
};
