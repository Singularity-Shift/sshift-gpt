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
    <div className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-md p-4 md:p-6 lg:p-8">
      <div className="space-y-4 md:space-y-6">
        {/* Header Section */}
        <div className="text-center md:text-left">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold">
            SShift GPT Subscription
          </h2>
          <p className="text-sm md:text-base text-gray-600 mt-2">
            Choose your subscription length
          </p>
        </div>

        {/* Slider Section */}
        <div className="mt-6 md:mt-8">
          <div className="flex justify-between text-xs md:text-sm text-gray-600 mb-2">
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

          {/* Date Information */}
          <div className="mt-4 md:mt-6 text-center">
            <div className="text-base md:text-lg font-semibold">
              {days} days
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-sm md:text-base text-gray-600">
              <div className="sm:text-right sm:pr-2">
                Starts: <span className="font-medium">{dates.startDate}</span>
              </div>
              <div className="sm:text-left sm:pl-2">
                Expires: <span className="font-medium">{dates.expirationDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Price Section */}
        <div className="bg-gray-50 rounded-lg p-4 md:p-6 mt-6 md:mt-8">
          <div className="text-center space-y-2">
            <div className="text-sm md:text-base text-gray-600">
              Total Price
            </div>
            <div className="text-2xl md:text-3xl lg:text-4xl font-bold">
              {price} USDT
            </div>
            <div className="text-xs md:text-sm text-green-600">
              Discount Applied: 3.33%
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          className="w-full py-3 px-4 bg-indigo-100 text-indigo-700 rounded-lg 
                     text-sm md:text-base font-medium transition-colors duration-200
                     hover:bg-indigo-200 focus:outline-none focus:ring-2 
                     focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50
                     disabled:cursor-not-allowed"
          disabled={isSubscriptionActive}
        >
          {isSubscriptionActive 
            ? "Currently with subscription active"
            : "Purchase Subscription"}
        </button>
      </div>
    </div>
  );
};
