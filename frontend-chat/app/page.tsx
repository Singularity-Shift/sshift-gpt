'use client';

import Image from 'next/image';
import { silkscreen } from './fonts';
import { SshiftWallet } from '../src/components/SshigtWallet';
import { GameOfLife } from '../src/components/ui/gameOfLife';

export default function Home() {
  return (
    <div className="relative min-h-screen">
      <GameOfLife />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        <div className="flex flex-col md:flex-row items-center mb-4 md:mb-8">
          <div className="relative w-40 h-40 md:w-64 md:h-64 mb-4 md:mb-0 md:mr-8">
            <Image
              src="/images/sshift-logo-animated.gif"
              alt="SShift GPT Logo"
              fill
              style={{ objectFit: 'contain' }}
              priority
              unoptimized
            />
          </div>
          <div className="flex flex-col justify-center">
            <h1
              className={`text-4xl md:text-6xl font-bold text-gray-800 leading-tight text-center ${silkscreen.className}`}
            >
              Welcome to
              <br />
              SShift GPT
            </h1>
          </div>
        </div>
        <div className="flex space-x-2 md:space-x-4">
          <SshiftWallet />
        </div>
      </div>
    </div>
  );
}
