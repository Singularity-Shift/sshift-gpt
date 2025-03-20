import * as React from 'react';
import { Button } from './button';
import { Slider } from './slider';
import { useAppManagment } from '../../context/AppManagment';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { ICurrency } from '@helpers';

interface SubscriptionContainerProps {
  days: number;
  setDays: (days: number) => void;
  price: number;
  dates: {
    startDate: string;
    expirationDate: string;
  };
  discount: number;
  selectedStableCoin?: ICurrency;
  setSelectedStableCoin: React.Dispatch<
    React.SetStateAction<ICurrency | undefined>
  >;
  availableStableCoins: ICurrency[];
}

export function SubscriptionContainer({
  days,
  setDays,
  price,
  dates,
  discount,
  selectedStableCoin,
  setSelectedStableCoin,
  availableStableCoins,
}: SubscriptionContainerProps) {
  const { onSubscribe, isSubscriptionActive, isCollector, isTrialVersion } =
    useAppManagment();

  const handleStableCoinChange = (value: string) => {
    const selected = availableStableCoins.find((coin) => coin.symbol === value);
    if (selected) {
      setSelectedStableCoin(selected);
    }
  };

  return (
    <div className="w-full max-w-[400px] h-[600px] bg-white bg-opacity-90 p-6 lg:p-10 rounded-xl shadow-lg border border-gray-300 flex flex-col">
      <div className="text-center">
        <h2 className="mt-6 text-2xl lg:text-3xl font-extrabold text-gray-900">
          SShift GPT Subscription
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Choose your subscription length
        </p>
      </div>
      <div className="flex-grow mt-8 space-y-6">
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
            <span className="text-lg font-semibold text-gray-900">
              {days} day{days !== 1 ? 's' : ''}
            </span>
            <p className="text-sm text-gray-600">Starts: {dates.startDate}</p>
            <p className="text-sm text-gray-600">
              Expires: {dates.expirationDate}
            </p>
          </div>
        </div>
        <div className="bg-gray-100 px-4 py-5 sm:p-6 rounded-md">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Price</p>
            <div className="mt-1 flex items-center justify-center">
              <p className="text-3xl lg:text-4xl font-extrabold text-gray-900">
                {price}
              </p>
              <div className="ml-2">
                <Select
                  value={selectedStableCoin?.symbol}
                  onValueChange={handleStableCoinChange}
                >
                  <SelectTrigger className="w-[140px] h-8 text-sm border border-gray-200 bg-white rounded-md shadow-sm px-3">
                    <SelectValue>
                      <div className="flex items-center mr-3">
                        <img
                          src={
                            selectedStableCoin?.logo || '/images/sshift-gui.png'
                          }
                          alt={selectedStableCoin?.symbol || ''}
                          width={20}
                          height={20}
                          className="rounded-full mr-2"
                        />
                        <span>{selectedStableCoin?.symbol}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-md rounded-md min-w-[120px]">
                    {availableStableCoins.map((coin) => (
                      <SelectItem
                        key={coin.symbol}
                        value={coin.symbol}
                        className="hover:bg-gray-100 data-[state=checked]:bg-gray-100 data-[state=checked]:font-medium"
                      >
                        <div className="flex items-center">
                          <img
                            src={
                              selectedStableCoin?.logo ||
                              '/images/sshift-gui.png'
                            }
                            alt={selectedStableCoin?.symbol || ''}
                            width={20}
                            height={20}
                            className="rounded-full mr-2"
                          />
                          {coin.symbol}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {discount > 0 && (
              <p className="text-sm text-green-600">
                Discount Applied: {discount.toFixed(2)}%
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="mt-auto">
        <Button
          disabled={
            (isSubscriptionActive && !isTrialVersion) ||
            isCollector ||
            !selectedStableCoin
          }
          onClick={() =>
            onSubscribe(days, selectedStableCoin?.address as string)
          }
          className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {isSubscriptionActive && !isTrialVersion
            ? 'Currently with subscription active'
            : isCollector
            ? "Collectors doesn't need subscription"
            : 'Subscribe'}
        </Button>
      </div>
    </div>
  );
}
