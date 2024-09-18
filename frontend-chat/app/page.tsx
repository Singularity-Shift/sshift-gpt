'use client';

import Image from 'next/image';
import { silkscreen } from './fonts';
import { SshiftWallet } from '@fn-chat/components/SshigtWallet';
import { GameOfLife } from '../src/components/ui/gameOfLife';

export default function Home() {
  return (
    <div className="relative min-h-screen">
      <GameOfLife />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
        <div className="flex items-center mb-8">
          <div className="relative w-64 h-64 mr-8">
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
              className={`text-6xl font-bold text-gray-800 leading-tight text-center ${silkscreen.className}`}
            >
              Welcome to
              <br />
              SShift GPT
            </h1>
          </div>
        </div>
        <div className="flex space-x-4">
          <SshiftWallet />
        </div>
      </div>
    </div>
  );
}
