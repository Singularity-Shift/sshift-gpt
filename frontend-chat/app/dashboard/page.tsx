'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { silkscreen } from '../fonts';
import {
  calculatePrice,
  calculateDates,
  calculateMaxDiscount,
} from '../../src/lib/utils';
import AGIThoughtBackground from '../../src/components/ui/agiThought';
import DashboardDisplayArea from '../../src/components/ui/DashboardDisplayArea';
import DashboardHeader from '../../src/components/ui/DashboardHeader';
import { useAppManagment } from '../../src/context/AppManagment';
import Link from 'next/link';
import Image from 'next/image';
import { useChain } from '../../src/context/ChainProvider';
import { Chain } from '@helpers';

// Define available stable coins
const AVAILABLE_STABLE_COINS = [
  { symbol: 'USDT', name: 'Tether USD', icon: '/images/USDT.png' },
  { symbol: 'USDC', name: 'USD Coin', icon: '/images/USDC.png' },
];

export default function SubscriptionPage() {
  const [days, setDays] = React.useState(15);
  const [price, setPrice] = React.useState(0);
  const [dates, setDates] = React.useState({
    startDate: '',
    expirationDate: '',
  });
  const [selectedStableCoin, setSelectedStableCoin] = React.useState(AVAILABLE_STABLE_COINS[0]);
  const { chain } = useChain();

  const { moveBotsOwned, qribbleNFTsOwned, sshiftRecordsOwned } =
    useAppManagment();
  const [discount, setDiscount] = useState(0);

  // Get the appropriate buy link based on chain and selected stable coin
  const getBuyLink = () => {
    if (chain === Chain.Aptos) {
      return `https://app.panora.exchange/swap/aptos?pair=APT-${selectedStableCoin.symbol}`;
    } else {
      // Movement chain
      if (selectedStableCoin.symbol === 'USDC') {
        return 'https://app.mosaic.ag/swap/MOVE-USDC.e';
      } else {
        // USDT on Movement
        return 'https://app.mosaic.ag/swap/MOVE-USDT';
      }
    }
  };

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
            selectedStableCoin={selectedStableCoin}
            setSelectedStableCoin={setSelectedStableCoin}
            availableStableCoins={AVAILABLE_STABLE_COINS}
          />
          <div className="mt-6 text-center">
            <Link
              href={getBuyLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-gray-100 transition-colors duration-200 border-2 border-gray-300"
            >
              <Image
                src={selectedStableCoin.icon}
                alt={selectedStableCoin.symbol}
                width={24}
                height={24}
                className="rounded-full"
              />
              <span className={`${silkscreen.className} text-black`}>
                BUY {selectedStableCoin.symbol} ON {chain === Chain.Aptos ? 'PANORA' : 'MOSAIC'}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
