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
} from '../../src/lib/utils';
import config from '../../config/dashboard_config.json';
import AGIThoughtBackground from '../../src/components/ui/agiThought';
import DashboardDisplayArea from '../../src/components/ui/DashboardDisplayArea';
import DashboardHeader from '../../src/components/ui/DashboardHeader';

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
  const [isSubscriptionActive, setIsSubscriptionActive] = React.useState(false);
  const router = useRouter();
  const [moveBotsOwned, setMoveBotsOwned] = useState('0');
  const [qribbleNFTsOwned, setQribbleNFTsOwned] = useState('0');
  const [sshiftRecordsOwned, setSShiftRecordsOwned] = useState('0');
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    const priceWithoutDiscount = calculatePrice(days);
    const moveBotsDiscount = calculateDiscount(
      parseInt(moveBotsOwned),
      MAX_MOVE_BOTS
    );
    const qribbleNFTsDiscount = calculateDiscount(
      parseInt(qribbleNFTsOwned),
      MAX_QRIBBLE_NFTS
    );
    const sshiftRecordsDiscount = calculateDiscount(
      parseInt(sshiftRecordsOwned),
      MAX_SSHIFT_RECORDS
    );

    const maxDiscount = Math.max(
      moveBotsDiscount,
      qribbleNFTsDiscount,
      sshiftRecordsDiscount
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
      <div className="flex-grow flex flex-col items-center justify-center px-4 py-8 relative z-10">
        <DashboardDisplayArea
          days={days}
          setDays={setDays}
          price={price}
          dates={dates}
          discount={discount}
          isSubscriptionActive={isSubscriptionActive}
          moveBotsOwned={moveBotsOwned}
          qribbleNFTsOwned={qribbleNFTsOwned}
          sshiftRecordsOwned={sshiftRecordsOwned}
        />

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
  );
}
