'use client';

import * as React from 'react';
import { Button } from '../../src/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { silkscreen } from '../fonts';
import {
  calculatePrice,
  calculateDates,
  calculateDiscount,
  calculateMaxDiscount,
} from '../../src/lib/utils';
import config from '../../config/dashboard_config.json';
import AGIThoughtBackground from '../../src/components/ui/agiThought';
import DashboardHeader from '../../src/components/ui/DashboardHeader';
import { useAppManagment } from '../../src/context/AppManagment';
import { SubscriptionContainer } from '../../src/components/ui/SubscriptionContainer';
import { UserProfileContainer } from '../../src/components/ui/UserProfileContainer';
import { SubscriptionUpgradeContainer } from '../../src/components/ui/SubscriptionUpgradeContainer';
import UserDashboardTitle from '../../src/components/ui/UserDashboardTitle';

const MAX_MOVE_BOTS = config.MAX_MOVE_BOTS;
const MAX_QRIBBLE_NFTS = config.MAX_QRIBBLE_NFTS;
const MAX_SSHIFT_RECORDS = config.MAX_SSHIFT_RECORDS;

export default function SubscriptionPage() {
  const [days, setDays] = React.useState(15);
  const [price, setPrice] = React.useState(0);
  const [dates, setDates] = React.useState({
    startDate: '',
    expirationDate: '',
  });

  const router = useRouter();
  const { moveBotsOwned, qribbleNFTsOwned, sshiftRecordsOwned } =
    useAppManagment();
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    const priceWithoutDiscount = calculatePrice(days);
    const maxDiscount = calculateMaxDiscount(
      moveBotsOwned,
      qribbleNFTsOwned,
      sshiftRecordsOwned,
      days
    );
    setDiscount(maxDiscount);

    const finalPrice = priceWithoutDiscount * (1 - maxDiscount / 100);
    setPrice(parseFloat(finalPrice.toFixed(2)));
    setDates(calculateDates(days));
  }, [days, moveBotsOwned, qribbleNFTsOwned, sshiftRecordsOwned]);

  const handleEnterSShiftGPT = () => {
    router.push('/chat');
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <AGIThoughtBackground />
      <DashboardHeader />

      {/* Main Content */}
      <div className="flex-grow flex flex-col items-center justify-start px-4 py-8 relative z-10 w-full max-w-[1400px] mx-auto overflow-y-auto">
        <div className="flex flex-col items-center w-full">
          <UserDashboardTitle />
          <div className="flex flex-col lg:flex-row lg:space-x-8 space-y-8 lg:space-y-0 mb-8 w-full items-center lg:items-stretch">
            {/* Subscription Container */}
            <SubscriptionContainer
              days={days}
              setDays={setDays}
              price={price}
              dates={dates}
              discount={discount}
            />

            {/* User Profile Container */}
            <UserProfileContainer
              moveBotsOwned={moveBotsOwned}
              qribbleNFTsOwned={qribbleNFTsOwned}
              sshiftRecordsOwned={sshiftRecordsOwned}
            />

            {/* Subscription Upgrade Container */}
            <SubscriptionUpgradeContainer />
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
            mt-4
            w-full
            max-w-[400px]
          `}
          onClick={handleEnterSShiftGPT}
        >
          Enter SShift GPT
        </Button>
      </div>
    </div>
  );
}


