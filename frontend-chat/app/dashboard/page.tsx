'use client';

import * as React from 'react';
import { Button } from '../../src/components/ui/button';
import { Slider } from '../../src/components/ui/slider';
import { LogOut, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { silkscreen } from '../fonts';
import { Input } from '../../src/components/ui/input';
import { SshiftWalletDisconnect } from '@fn-chat/components/SshigtWallet';
import { calculatePrice, calculateDates, calculateDiscount } from '../utils/subscriptionUtils';
import config from '../../config/dashboard_config.json';
import AGIThoughtBackground from '../../src/components/ui/agiThought';
import Link from 'next/link';

const MAX_MOVE_BOTS = config.MAX_MOVE_BOTS;
const MAX_QRIBBLE_NFTS = config.MAX_QRIBBLE_NFTS;
const MAX_SSHIFT_RECORDS = config.MAX_SSHIFT_RECORDS;

interface SubscriptionPageProps {}

export default function SubscriptionPage({}: SubscriptionPageProps) {
  const [days, setDays] = React.useState(15);
  const [price, setPrice] = React.useState(0);
  const [dates, setDates] = React.useState({
    startDate: '',
    expirationDate: '',
  });
  const [isSubscriptionActive, setIsSubscriptionActive] = React.useState(false);
  const router = useRouter();
  const [moveBotsOwned, setMoveBotsOwned] = useState('0');
  const [qribbleNFTsOwned, setQribbleNFTsOwned] = useState('0');
  const [sshiftRecordsOwned, setSShiftRecordsOwned] = useState('0');
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    const priceWithoutDiscount = calculatePrice(days);
    const moveBotsDiscount = calculateDiscount(parseInt(moveBotsOwned), MAX_MOVE_BOTS);
    const qribbleNFTsDiscount = calculateDiscount(parseInt(qribbleNFTsOwned), MAX_QRIBBLE_NFTS);
    const sshiftRecordsDiscount = calculateDiscount(parseInt(sshiftRecordsOwned), MAX_SSHIFT_RECORDS);

    const maxDiscount = Math.max(moveBotsDiscount, qribbleNFTsDiscount, sshiftRecordsDiscount);
    setDiscount(maxDiscount);

    const finalPrice = priceWithoutDiscount * (1 - maxDiscount / 100);
    setPrice(parseFloat(finalPrice.toFixed(2)));
    setDates(calculateDates(days));
  }, [days, moveBotsOwned, qribbleNFTsOwned, sshiftRecordsOwned]);

  const handleNavigateToChat = () => {
    router.push('/chat');
  };

  const handleEnterSShiftGPT = () => {
    router.push('/chat');
  };

  const handleMoveBotsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(parseInt(e.target.value) || 0, MAX_MOVE_BOTS);
    setMoveBotsOwned(value.toString());
  };

  const handleQribbleNFTsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(parseInt(e.target.value) || 0, MAX_QRIBBLE_NFTS);
    setQribbleNFTsOwned(value.toString());
  };

  const handleSShiftRecordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(parseInt(e.target.value) || 0, MAX_SSHIFT_RECORDS);
    setSShiftRecordsOwned(value.toString());
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <AGIThoughtBackground />
      {/* Top Bar */}
      <div className="bg-white bg-opacity-90 shadow-sm py-2 px-4 flex justify-between items-center h-[73px] relative z-10">
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
            <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
            <span className="text-gray-800 font-semibold">Connected</span>
          </div>
          <SshiftWalletDisconnect />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow flex flex-col items-center justify-center px-4 py-8 relative z-10">
        <div className="flex flex-col items-center space-y-8">
          {/* User Dashboard Title Container */}
          <div className="bg-white bg-opacity-90 p-6 rounded-xl shadow-lg border border-gray-300 mb-8">
            <h1
              className={`${silkscreen.className} text-4xl text-gray-800 text-center`}
            >
              USER DASHBOARD
            </h1>
          </div>

          <div className="flex space-x-8 mb-8">
            {/* Subscription Container */}
            <div className="w-[400px] bg-white bg-opacity-90 p-10 rounded-xl shadow-lg border border-gray-300">
              <div className="text-center">
                <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                  SShift GPT Subscription
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Choose your subscription length
                </p>
              </div>
              <div className="mt-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      1 day
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      30 days
                    </span>
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
                    <p className="text-sm text-gray-600">
                      Starts: {dates.startDate}
                    </p>
                    <p className="text-sm text-gray-600">
                      Expires: {dates.expirationDate}
                    </p>
                  </div>
                </div>
                <div className="bg-gray-100 px-4 py-5 sm:p-6 rounded-md"> {/* Changed from bg-gray-50 to bg-gray-100 */}
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Price</p>
                    <p className="mt-1 text-4xl font-extrabold text-gray-900">
                      {price} USDT
                    </p>
                    {discount > 0 && (
                      <p className="text-sm text-green-600">
                        Discount Applied: {discount.toFixed(2)}%
                      </p>
                    )}
                  </div>
                </div>
                <Button className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Subscribe
                </Button>
              </div>
            </div>

            {/* User Profile Container */}
            <div className="w-[400px] bg-white bg-opacity-90 p-10 rounded-xl shadow-lg flex flex-col border border-gray-300">
              <div>
                <div className="text-center">
                  <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                    User Profile
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">&nbsp;</p>
                </div>
                <div className="mt-8 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      Subscription Status:
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        isSubscriptionActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {isSubscriptionActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      Expiry Date:
                    </span>
                    <div className="bg-gray-100 border border-gray-300 rounded-md px-3 py-2 w-56 text-right"> {/* Changed w-40 to w-56 */}
                      <span className="text-sm text-gray-600">
                        {isSubscriptionActive ? 'YYYY-MM-DD HH:MM:SS UTC' : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-16 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Move Bot owned:
                    </span>
                    <Link 
                      href={config.MOVEBOT_BUY}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-600 hover:text-gray-800 underline block"
                    >
                      Buy
                    </Link>
                  </div>
                  <Input
                    type="number"
                    value={moveBotsOwned}
                    className="w-20 text-right bg-gray-100"
                    readOnly
                  />
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Qribble NFT owned:
                    </span>
                    <Link 
                      href={config.QRIBBLE_BUY}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-600 hover:text-gray-800 underline block"
                    >
                      Buy
                    </Link>
                  </div>
                  <Input
                    type="number"
                    value={qribbleNFTsOwned}
                    className="w-20 text-right bg-gray-100"
                    readOnly
                  />
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      SShift Records owned:
                    </span>
                    <Link 
                      href={config.SSHIFT_RECORDS_BUY}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-600 hover:text-gray-800 underline block"
                    >
                      Buy
                    </Link>
                  </div>
                  <Input
                    type="number"
                    value={sshiftRecordsOwned}
                    className="w-20 text-right bg-gray-100"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Upgrade Subscription Container */}
            <div className="w-[400px] bg-white bg-opacity-90 p-10 rounded-xl shadow-lg border border-gray-300">
              <div className="text-center">
                <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                  Upgrade Subscription
                </h2>
                <p className="mt-2 text-sm text-gray-600">&nbsp;</p>
              </div>
              <div className="mt-8 flex items-center justify-center h-40">
                <p className="text-lg text-gray-400 text-center">
                  Coming soon - under development
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="default"
            className={`
              ${silkscreen.className}
              py-4 px-6
              text-lg
              font-bold
              text-black
              bg-green-400
              hover:bg-green-500
              focus:outline-none
              focus:ring-2
              focus:ring-offset-2
              focus:ring-green-400
              transform
              transition-transform
              hover:scale-105
              rounded-xl
              shadow-lg
              border
              border-gray-700
              relative z-10
            `}
            onClick={handleEnterSShiftGPT}
          >
            Enter SShift GPT
          </Button>
        </div>
      </div>
    </div>
  );
}