'use client';

import * as React from 'react';
import { Button } from '../../src/components/ui/button';
import { Slider } from '../../src/components/ui/slider';
import { LogOut, ArrowLeft } from 'lucide-react'; // Import the LogOut and ArrowLeft icons
import { useRouter } from 'next/navigation'; // Import useRouter

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
  const [isSubscriptionActive, setIsSubscriptionActive] = React.useState(false); // Default to inactive
  const router = useRouter(); // Initialize the router

  React.useEffect(() => {
    setPrice(calculatePrice(days));
    setDates(calculateDates(days));
  }, [days]);

  const handleNavigateToChat = () => {
    router.push('/chat');
  };

  const handleDisconnect = () => {
    console.log('User disconnected');
    router.push('/'); // Redirect to home page
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Bar */}
      <div className="bg-white shadow-sm py-2 px-4 flex justify-between items-center h-[73px]">
        <div className="flex items-center space-x-4">
          <Button
            onClick={handleNavigateToChat}
            variant="ghost"
            size="sm"
            className="flex items-center space-x-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Chat</span>
          </Button>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Connected</span>
          </div>
          <Button 
            onClick={handleDisconnect} 
            variant="ghost" 
            size="sm"
            className="text-sm text-gray-600 hover:bg-gray-100"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow flex flex-col items-center justify-center px-4 py-8">
        <div className="flex space-x-8 mb-8">
          {/* Subscription Container */}
          <div className="w-[400px] bg-white p-10 rounded-xl shadow-lg">
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
                  <p className="mt-1 text-4xl font-extrabold text-gray-900">{price} USDT</p>
                </div>
              </div>
              <Button className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Subscribe
              </Button>
            </div>
          </div>

          {/* User Profile Container */}
          <div className="w-[400px] bg-white p-10 rounded-xl shadow-lg">
            <div className="text-center">
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">User Profile</h2>
              <p className="mt-2 text-sm text-gray-600">&nbsp;</p>
            </div>
            <div className="mt-8 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Subscription Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  isSubscriptionActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {isSubscriptionActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Expiry Date:</span>
                <div className="border border-gray-300 rounded-md px-3 py-2 w-48 text-right">
                  <span className="text-sm text-gray-600">
                    {isSubscriptionActive ? 'YYYY-MM-DD HH:MM:SS UTC' : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Upgrade Subscription Container */}
          <div className="w-[400px] bg-white p-10 rounded-xl shadow-lg">
            <div className="text-center">
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Upgrade Subscription</h2>
              <p className="mt-2 text-sm text-gray-600">&nbsp;</p>
            </div>
            <div className="mt-8 flex items-center justify-center h-40">
              <p className="text-lg text-gray-400 text-center">
                Coming soon - under development
              </p>
            </div>
          </div>
        </div>

        <Button variant="outline" className="py-3 px-6 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Enter SShift GPT
        </Button>
      </div>
    </div>
  );
}