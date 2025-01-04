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
import DashboardDisplayArea from '../../src/components/ui/DashboardDisplayArea';
import DashboardHeader from '../../src/components/ui/DashboardHeader';
import { useAppManagment } from '../../src/context/AppManagment';

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

  return (
    <div className="min-h-screen flex flex-col relative">
      <AGIThoughtBackground />
      <DashboardHeader />

      {/* Main Content */}
      <div className="flex-grow flex flex-col items-center justify-center py-8 relative z-10">
        <div className="w-full max-w-[1400px] flex flex-col items-center">
          <DashboardDisplayArea
            days={days}
            setDays={setDays}
            price={price}
            dates={dates}
            discount={discount}
            moveBotsOwned={moveBotsOwned}
            qribbleNFTsOwned={qribbleNFTsOwned}
            sshiftRecordsOwned={sshiftRecordsOwned}
          />
        </div>
      </div>
    </div>
  );
}


